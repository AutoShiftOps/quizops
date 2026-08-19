import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthenticatedUser } from '@/lib/serverSupabase';
import { getPublisher } from '@/lib/publisher';

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const authed = await getAuthenticatedUser(req);
  if (!authed) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const publisher = await getPublisher(authed.supabase, authed.user.id);
  if (!publisher) {
    return NextResponse.json({ error: 'no_publisher_profile' }, { status: 403 });
  }

  if (publisher.tier !== 'free') {
    // `message` (not just `error`) so callers that surface this directly to
    // the user (see lib/stripeCheckout.ts) don't print the raw error code —
    // that was bug 1: pricing page showed the literal string "already_pro".
    return NextResponse.json(
      { error: 'already_pro', message: "You're already on Pro." },
      { status: 400 }
    );
  }

  // Create or retrieve the Stripe customer. supabaseAdmin (not the
  // RLS-scoped client) for the write below — publishers' own UPDATE policy
  // is presumably self-row-only already, but stripe_customer_id isn't
  // something the client should be able to set directly via a normal PATCH
  // path, so this goes through the service-role client deliberately.
  let customerId = publisher.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: authed.user.email,
      name: publisher.display_name,
      metadata: {
        publisher_id: publisher.id,
        username: publisher.username,
      },
    });
    customerId = customer.id;

    const { error } = await supabaseAdmin
      .from('publishers')
      .update({ stripe_customer_id: customerId })
      .eq('id', publisher.id);
    if (error) {
      console.error('[stripe/checkout] failed to save stripe_customer_id:', error.message);
    }
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [
      {
        price: process.env.STRIPE_PRO_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${appUrl}/dashboard?upgraded=true`,
    cancel_url: `${appUrl}/pricing`,
    metadata: {
      publisher_id: publisher.id,
    },
    subscription_data: {
      metadata: {
        publisher_id: publisher.id,
      },
    },
  });

  return NextResponse.json({ url: session.url });
}
