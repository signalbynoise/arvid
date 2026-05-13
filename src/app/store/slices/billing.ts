import { StateCreator } from 'zustand';
import { api } from '../../api';
import { logger } from '../../logger';
import type { UserSubscription } from '../../types';

const log = logger.create('store:billing');

export interface PlanLimits {
  maxProjects: number | null;
  maxRequirementsPerProject: number | null;
}

export interface PlanUsage {
  projects: number;
}

export interface BillingSlice {
  subscription: UserSubscription | null;
  subscriptionLoading: boolean;
  planLimits: PlanLimits | null;
  planUsage: PlanUsage | null;

  loadSubscription: () => Promise<void>;
  loadPlanLimits: () => Promise<void>;
  startCheckout: () => Promise<void>;
  openBillingPortal: () => Promise<void>;
}

export const createBillingSlice: StateCreator<BillingSlice, [], [], BillingSlice> = (set) => ({
  subscription: null,
  subscriptionLoading: false,
  planLimits: null,
  planUsage: null,

  loadSubscription: async () => {
    log.debug('loadSubscription', 'Fetching subscription');
    set({ subscriptionLoading: true });
    try {
      const sub = await api.getSubscription();
      set({
        subscription: sub,
        subscriptionLoading: false,
      });
      log.info('loadSubscription', 'Subscription loaded', { plan: sub.plan, status: sub.status });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown';
      log.error('loadSubscription', 'Failed to load subscription', { error: message });
      set({ subscriptionLoading: false });
    }
  },

  loadPlanLimits: async () => {
    log.debug('loadPlanLimits', 'Fetching plan limits');
    try {
      const result = await api.getPlanLimits();
      set({
        planLimits: result.limits,
        planUsage: result.usage,
      });
      log.debug('loadPlanLimits', 'Plan limits loaded', { plan: result.plan });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown';
      log.error('loadPlanLimits', 'Failed to load plan limits', { error: message });
    }
  },

  startCheckout: async () => {
    log.info('startCheckout', 'Creating checkout session');
    try {
      const { url } = await api.createCheckoutSession();
      log.info('startCheckout', 'Redirecting to Stripe Checkout');
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown';
      log.error('startCheckout', 'Failed to start checkout', { error: message });
    }
  },

  openBillingPortal: async () => {
    log.info('openBillingPortal', 'Creating portal session');
    try {
      const { url } = await api.createPortalSession();
      log.info('openBillingPortal', 'Redirecting to billing portal');
      window.location.href = url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown';
      log.error('openBillingPortal', 'Failed to open billing portal', { error: message });
    }
  },
});
