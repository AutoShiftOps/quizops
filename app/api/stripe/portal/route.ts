import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { getAuthenticatedUser } from '@/lib/serverSupabase';
import { getPublisher } from '@/lib/publisher';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const authed = await getAuthenticatedUser(req);
  if (!authed) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const publisher = await getPublisher(authed.supabase, authed.user.id);
  if (!publisher?.stripe_customer_id) {
    console.error(
      '[stripe/portal] no_stripe_customer — auth.uid():',
      authed.user.id,
      'publisher found:',
      Boolean(publisher),
      'publisher.id:',
      publisher?.id,
      'tier:',
      publisher?.tier
    );
    // Temporary diagnostic fields (auth.uid()/publisher lookup result, not
    // secrets — safe to return to the authenticated user themselves) while
    // tracking down why this fires for an account confirmed to have
    // stripe_customer_id set in the DB. Remove once root cause is found.
    return NextResponse.json(
      {
        error: 'no_stripe_customer',
        debug: {
          auth_uid: authed.user.id,
          publisher_found: Boolean(publisher),
          publisher_id: publisher?.id ?? null,
          tier: publisher?.tier ?? null,
        },
      },
      { status: 400 }
    );
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: publisher.stripe_customer_id,
      return_url: `${appUrl}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Surface the real Stripe error instead of an opaque 500 — this is what
    // would show if the Customer Portal weren't configured in Stripe test
    // mode, or the customer ID were invalid/from a different Stripe mode.
    const stripeErr = err as { message?: string; type?: string; code?: string };
    console.error('[stripe/portal] billingPortal.sessions.create failed:', err);
    return NextResponse.json(
      {
        error: 'stripe_error',
        message: stripeErr.message || 'Could not open billing portal.',
        stripe_error_type: stripeErr.type,
        stripe_error_code: stripeErr.code,
      },
      { status: 502 }
    );
  }
}
