import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  console.warn(
    '[WARN] [stripe] STRIPE_SECRET_KEY is not set — billing features will not work. ' +
    'Set STRIPE_SECRET_KEY in your .env file.',
  );
}

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2026-04-22.dahlia' as Stripe.LatestApiVersion })
  : (null as unknown as Stripe);

export const hasStripe = !!STRIPE_SECRET_KEY;

export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? '';
