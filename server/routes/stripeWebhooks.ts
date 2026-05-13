import { Router, Request, Response } from 'express';
import { stripe, hasStripe, STRIPE_WEBHOOK_SECRET } from '../stripe';
import { supabaseAdmin } from '../supabase';
import type Stripe from 'stripe';

export const stripeWebhooksRouter = Router();

stripeWebhooksRouter.post('/stripe', async (req: Request, res: Response) => {
  if (!hasStripe) {
    console.warn('[WARN] [webhooks:stripe] Stripe not configured, ignoring webhook');
    return res.sendStatus(200);
  }

  const sig = req.headers['stripe-signature'] as string | undefined;
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

  if (!sig || !rawBody) {
    console.error('[ERROR] [webhooks:stripe] Missing signature or raw body');
    return res.sendStatus(400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [webhooks:stripe] Signature verification failed', JSON.stringify({ error: message }));
    return res.sendStatus(400);
  }

  console.info('[INFO] [webhooks:stripe] Event received', JSON.stringify({ type: event.type, id: event.id }));

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted':
      await handleSubscriptionChange(event.data.object as Stripe.Subscription);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice);
      break;

    default:
      console.debug('[DEBUG] [webhooks:stripe] Unhandled event type', JSON.stringify({ type: event.type }));
  }

  res.sendStatus(200);
});

function extractPeriodEnd(subscription: Stripe.Subscription): string | null {
  const item = subscription.items?.data?.[0];
  const periodEnd = (item as { current_period_end?: number } | undefined)?.current_period_end;
  if (periodEnd) return new Date(periodEnd * 1000).toISOString();
  return null;
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = session.metadata?.supabase_user_id;
  if (!userId) {
    console.error('[ERROR] [webhooks:stripe] No supabase_user_id in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  console.info('[INFO] [webhooks:stripe] Processing checkout.session.completed', JSON.stringify({ userId, subscriptionId }));

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .upsert({
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        plan: 'plus',
        status: subscription.status,
        current_period_end: extractPeriodEnd(subscription),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('[ERROR] [webhooks:stripe] Failed to upsert subscription after checkout', JSON.stringify({ userId, error: error.message }));
    } else {
      console.info('[INFO] [webhooks:stripe] Subscription activated', JSON.stringify({ userId, subscriptionId, plan: 'plus' }));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [webhooks:stripe] handleCheckoutCompleted failed', JSON.stringify({ userId, error: message }));
  }
}

async function handleSubscriptionChange(subscription: Stripe.Subscription): Promise<void> {
  try {
    const { data: sub } = await supabaseAdmin
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .single();

    if (!sub) {
      console.warn('[WARN] [webhooks:stripe] Subscription not found in DB', JSON.stringify({ subscriptionId: subscription.id }));
      return;
    }

    const isCanceled = subscription.status === 'canceled';
    const plan = isCanceled ? 'free' : 'plus';

    const { error } = await supabaseAdmin
      .from('user_subscriptions')
      .update({
        plan,
        status: subscription.status,
        current_period_end: extractPeriodEnd(subscription),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('[ERROR] [webhooks:stripe] Failed to update subscription', JSON.stringify({ subscriptionId: subscription.id, error: error.message }));
    } else {
      console.info('[INFO] [webhooks:stripe] Subscription updated', JSON.stringify({ userId: sub.user_id, status: subscription.status, plan }));
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [webhooks:stripe] handleSubscriptionChange failed', JSON.stringify({ subscriptionId: subscription.id, error: message }));
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const { data: sub } = await supabaseAdmin
    .from('user_subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!sub) {
    console.warn('[WARN] [webhooks:stripe] Customer not found for failed payment', JSON.stringify({ customerId }));
    return;
  }

  console.warn('[WARN] [webhooks:stripe] Payment failed', JSON.stringify({ userId: sub.user_id, invoiceId: invoice.id }));
}
