import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Resend } from 'resend';

// Stripe's signature check needs Node's crypto, not the Edge runtime — and
// needs the exact raw request bytes, not a re-serialized JSON body.
//
// NOTE ON DEVIATION: the spec's `export const config = { api: { bodyParser:
// false } }` is a Pages Router (pages/api/*) convention for disabling
// Next.js's automatic JSON body parsing. It does not exist as a concept in
// the App Router — route handlers here (app/api/*/route.ts) never
// auto-parse the body in the first place, so there's no parser to disable,
// and a stray `config` export isn't a recognized route segment config (it's
// silently ignored, not an error, but it does nothing). `request.text()`
// below already gets the raw, unparsed body, which is all Stripe's
// signature verification actually needs.
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const stripe = getStripe();
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return new Response('Missing stripe-signature header', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('[stripe/webhook] signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const publisherId = session.metadata?.publisher_id;

      if (publisherId) {
        await supabaseAdmin
          .from('publishers')
          .update({
            tier: 'pro',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq('id', publisherId);

        const { data: publisher } = await supabaseAdmin
          .from('publishers')
          .select('display_name, id')
          .eq('id', publisherId)
          .single();

        const {
          data: { user },
        } = await supabaseAdmin.auth.admin.getUserById(publisherId);

        if (user?.email && process.env.RESEND_API_KEY) {
          const resend = new Resend(process.env.RESEND_API_KEY);
          const appUrl = process.env.APP_URL || 'https://quiz.autoshiftops.com';

          try {
            await resend.emails.send({
              from: 'Sudhakar from QuizOps <onboarding@resend.dev>',
              to: user.email,
              subject: 'Welcome to QuizOps Pro! 🎉',
              html: `
                <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
                  <h2 style="font-size:22px;font-weight:700;color:#18181B;margin-bottom:8px">
                    You're now on Pro, ${publisher?.display_name}!
                  </h2>
                  <p style="color:#71717A;font-size:15px;line-height:1.6;margin-bottom:16px">
                    Your QuizOps account has been upgraded. Here's what you now have access to:
                  </p>
                  <ul style="color:#18181B;font-size:14px;line-height:2;padding-left:20px">
                    <li>Unlimited published quizzes</li>
                    <li>Full analytics history</li>
                    <li>Remove QuizOps branding</li>
                    <li>iFrame embed support</li>
                    <li>Priority support</li>
                  </ul>
                  <a href="${appUrl}/dashboard"
                    style="display:inline-block;margin-top:24px;padding:12px 24px;background:#3E7BFA;
                    color:#fff;text-decoration:none;border-radius:8px;font-weight:600">
                    Go to your dashboard →
                  </a>
                  <hr style="border:none;border-top:1px solid #E4E4E7;margin:32px 0"/>
                  <p style="color:#A1A1AA;font-size:12px">
                    — Sudhakar, Builder of QuizOps<br/>
                    Reply to this email anytime.
                  </p>
                </div>
              `,
            });
          } catch (err) {
            console.error('[stripe/webhook] Pro welcome email failed:', err);
          }

          try {
            await resend.emails.send({
              from: 'QuizOps <onboarding@resend.dev>',
              to: process.env.ADMIN_EMAIL || 'admin@autoshiftops.com',
              subject: `🎉 New Pro subscriber: ${user.email}`,
              html: `
                <p>Publisher: ${publisher?.display_name}</p>
                <p>Email: ${user.email}</p>
                <p>Publisher ID: ${publisherId}</p>
                <p>This is the first paid customer trigger. Switch AI_PROVIDER to anthropic now.</p>
              `,
            });
          } catch (err) {
            console.error('[stripe/webhook] admin notification email failed:', err);
          }
        } else if (!process.env.RESEND_API_KEY) {
          console.error('[stripe/webhook] RESEND_API_KEY not configured — skipping Pro emails');
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const publisherId = subscription.metadata?.publisher_id;

      if (publisherId) {
        await supabaseAdmin
          .from('publishers')
          .update({
            tier: 'free',
            stripe_subscription_id: null,
          })
          .eq('id', publisherId);
      }
      break;
    }

    case 'invoice.payment_failed': {
      // Log for monitoring — Stripe handles retry logic automatically.
      console.error('[stripe/webhook] payment failed:', event.data.object);
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
