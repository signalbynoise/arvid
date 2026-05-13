import { PLAN_LIMITS } from '../../../shared/schemas/subscription';
import type { SubscriptionPlan, UserSubscription } from '../types';

export function resolvePlan(subscription: UserSubscription | null): SubscriptionPlan {
  if (!subscription) return 'free';
  if (subscription.plan === 'plus' && subscription.status === 'active') return 'plus';
  return 'free';
}

export function isActivePlus(subscription: UserSubscription | null): boolean {
  return resolvePlan(subscription) === 'plus';
}

export function getPlanFeatures(plan: SubscriptionPlan): string[] {
  const limits = PLAN_LIMITS[plan];
  const features: string[] = [];

  if (limits.maxProjects === Infinity) {
    features.push('Unlimited projects');
  } else {
    features.push(`${limits.maxProjects} project`);
  }

  if (limits.maxRequirementsPerProject === Infinity) {
    features.push('Unlimited requirements');
  } else {
    features.push(`Up to ${limits.maxRequirementsPerProject} requirements`);
  }

  if (plan === 'free') {
    features.push('All core features');
  } else {
    features.push('All features included');
    features.push('Priority support');
  }

  return features;
}

export function formatSubscriptionStatus(subscription: UserSubscription): string {
  if (subscription.cancelAtPeriodEnd) return 'Canceling at period end';
  return subscription.status ?? 'unknown';
}

export function isSubscriptionHealthy(subscription: UserSubscription | null): boolean {
  if (!subscription) return true;
  return subscription.status === 'active' || subscription.plan === 'free';
}

export function formatPeriodEndLabel(subscription: UserSubscription): string {
  return subscription.cancelAtPeriodEnd ? 'Access until' : 'Renews on';
}
