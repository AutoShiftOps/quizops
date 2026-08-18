# Stripe setup (M2-01)

Manual steps required outside the codebase to make Pro tier billing work.
Nothing in this file is a secret — real key/secret values never get
committed here or anywhere else in the repo. They go into Vercel env vars
only.

## 1. Run the database migration

`supabase/migrations/006_stripe.sql` adds `stripe_customer_id` and
`stripe_subscription_id` to `publishers`. Run it in the Supabase SQL Editor
(it isn't applied automatically).

## 2. Register the webhook in Stripe

Stripe Dashboard → Developers → Webhooks → Add endpoint:

- **URL:** `https://quiz.autoshiftops.com/api/stripe/webhook`
- **Events to send:**
  - `checkout.session.completed`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

After creating the endpoint, copy its **signing secret** (`whsec_...`) —
that's the value for `STRIPE_WEBHOOK_SECRET` below.

## 3. Add environment variables to Vercel

Project → Settings → Environment Variables. All of these are server/build
env vars except the `NEXT_PUBLIC_` one, which intentionally ships in the
browser bundle (publishable keys are designed to be public).

| Key | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_test_...` — rotate/generate from Stripe Dashboard → Developers → API keys. Never share this one in chat, a commit, or any file. |
| `STRIPE_PUBLISHABLE_KEY` | the `pk_test_...` key |
| `STRIPE_WEBHOOK_SECRET` | the `whsec_...` value from step 2 |
| `STRIPE_PRO_PRICE_ID` | the recurring Price ID for the $9/month Pro plan |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | same value as `STRIPE_PUBLISHABLE_KEY` |
| `APP_URL` | `https://quiz.autoshiftops.com` |

`.env.example` documents the same keys as placeholders for local dev.

## 4. Test in Stripe test mode

Test card `4242 4242 4242 4242`, any future expiry, any 3-digit CVC, any
5-digit ZIP.

1. Click "Upgrade to Pro" from the dashboard.
2. Confirm it redirects to Stripe Checkout.
3. Complete payment with the test card.
4. Confirm it redirects to `/dashboard?upgraded=true` and the success banner
   shows.
5. Confirm `publishers.tier = 'pro'` for that publisher in Supabase.
6. Confirm the Pro welcome email arrives, and the admin notification email
   arrives at `ADMIN_EMAIL`.
7. Click "Manage subscription →" and confirm it opens the Stripe customer
   portal.
8. Cancel the subscription from the portal and confirm `publishers.tier`
   reverts to `'free'` (via the `customer.subscription.deleted` webhook).
