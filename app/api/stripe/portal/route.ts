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
    return NextResponse.json({ error: 'no_stripe_customer' }, { status: 400 });
  }

  // Explicit return_url — deliberately not relying solely on the Stripe
  // Dashboard's portal-level default redirect, since that can be changed
  // independently of this code and isn't visible in version control.
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
