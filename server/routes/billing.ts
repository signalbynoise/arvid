import { Router } from 'express';
import { stripe, hasStripe } from '../stripe';
import { supabaseAdmin } from '../supabase';
import { STRIPE_CONFIG, PLAN_LIMITS } from '../../shared/schemas/subscription';
import type { SubscriptionPlan } from '../../shared/schemas/subscription';

export const billingRouter = Router();

function ensureStripe(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }): boolean {
  if (!hasStripe) {
    res.status(503).json({ error: 'Billing is not configured' });
    return false;
  }
  return true;
}

billingRouter.get('/subscription', async (req, res) => {
  const userId = req.user!.id;

  const { data, error } = await supabaseAdmin
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('[ERROR] [billing:subscription] Failed to load subscription', JSON.stringify({ userId, error: error.message }));
    return res.status(500).json({ error: error.message });
  }

  if (!data) {
    return res.json({
      user_id: userId,
      plan: 'free',
      status: null,
      stripe_customer_id: null,
      stripe_subscription_id: null,
      current_period_end: null,
      cancel_at_period_end: false,
    });
  }

  res.json(data);
});

billingRouter.post('/create-checkout-session', async (req, res) => {
  if (!ensureStripe(req, res)) return;

  const userId = req.user!.id;
  const email = req.user!.email;

  console.info('[INFO] [billing:checkout] Creating checkout session', JSON.stringify({ userId }));

  try {
    let customerId: string | undefined;

    const { data: existing } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: email ?? undefined,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customerId,
          plan: 'free',
        }, { onConflict: 'user_id' });

      console.info('[INFO] [billing:checkout] Stripe customer created', JSON.stringify({ userId, customerId }));
    }

    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: STRIPE_CONFIG.plusPriceId, quantity: 1 }],
      success_url: `${appOrigin}?billing=success`,
      cancel_url: `${appOrigin}?billing=canceled`,
      subscription_data: {
        metadata: { supabase_user_id: userId },
      },
      metadata: { supabase_user_id: userId },
    });

    console.info('[INFO] [billing:checkout] Session created', JSON.stringify({ userId, sessionId: session.id }));
    res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [billing:checkout] Failed to create checkout session', JSON.stringify({ userId, error: message }));
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

billingRouter.post('/create-portal-session', async (req, res) => {
  if (!ensureStripe(req, res)) return;

  const userId = req.user!.id;

  try {
    const { data } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!data?.stripe_customer_id) {
      console.warn('[WARN] [billing:portal] No Stripe customer found', JSON.stringify({ userId }));
      return res.status(400).json({ error: 'No billing account found. Subscribe first.' });
    }

    const appOrigin = process.env.APP_ORIGIN || 'http://localhost:5173';

    const session = await stripe.billingPortal.sessions.create({
      customer: data.stripe_customer_id,
      return_url: appOrigin,
    });

    console.info('[INFO] [billing:portal] Portal session created', JSON.stringify({ userId }));
    res.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [billing:portal] Failed to create portal session', JSON.stringify({ userId, error: message }));
    res.status(500).json({ error: 'Failed to create portal session' });
  }
});

billingRouter.get('/plan-limits', async (req, res) => {
  const userId = req.user!.id;

  try {
    const { data } = await supabaseAdmin
      .from('user_subscriptions')
      .select('plan, status')
      .eq('user_id', userId)
      .single();

    let plan: SubscriptionPlan = 'free';
    if (data?.plan === 'plus' && data?.status === 'active') {
      plan = 'plus';
    }

    const limits = PLAN_LIMITS[plan];

    const { count: projectCount, error: countError } = await supabaseAdmin
      .from('projects')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (countError) {
      console.error('[ERROR] [billing:planLimits] Failed to count projects', JSON.stringify({ userId, error: countError.message }));
    }

    res.json({
      plan,
      limits: {
        maxProjects: limits.maxProjects === Infinity ? null : limits.maxProjects,
        maxRequirementsPerProject: limits.maxRequirementsPerProject === Infinity ? null : limits.maxRequirementsPerProject,
      },
      usage: {
        projects: projectCount ?? 0,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [billing:planLimits] Unexpected error', JSON.stringify({ userId, error: message }));
    res.status(500).json({ error: 'Failed to load plan limits' });
  }
});

billingRouter.get('/invoices', async (req, res) => {
  if (!ensureStripe(req, res)) return;

  const userId = req.user!.id;

  try {
    const { data } = await supabaseAdmin
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (!data?.stripe_customer_id) {
      return res.json([]);
    }

    console.debug('[DEBUG] [billing:invoices] Fetching invoices', JSON.stringify({ userId }));

    const invoices = await stripe.invoices.list({
      customer: data.stripe_customer_id,
      limit: 24,
    });

    const mapped = invoices.data.map(inv => ({
      id: inv.id,
      number: inv.number,
      status: inv.status,
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      currency: inv.currency,
      created: inv.created,
      periodStart: inv.period_start,
      periodEnd: inv.period_end,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      invoicePdf: inv.invoice_pdf,
    }));

    res.json(mapped);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [billing:invoices] Failed to fetch invoices', JSON.stringify({ userId, error: message }));
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});
