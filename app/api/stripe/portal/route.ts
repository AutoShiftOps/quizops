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

  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const session = await stripe.billingPortal.sessions.create({
    customer: publisher.stripe_customer_id,
    return_url: `${appUrl}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
