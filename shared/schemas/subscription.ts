import { z } from 'zod';

export const SubscriptionPlanEnum = z.enum(['free', 'plus']);
export type SubscriptionPlan = z.infer<typeof SubscriptionPlanEnum>;

export const SubscriptionStatusEnum = z.enum([
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);
export type SubscriptionStatus = z.infer<typeof SubscriptionStatusEnum>;

export const PLAN_LIMITS = {
  free: {
    maxProjects: 1,
    maxRequirementsPerProject: 10,
  },
  plus: {
    maxProjects: Infinity,
    maxRequirementsPerProject: Infinity,
  },
} as const satisfies Record<SubscriptionPlan, { maxProjects: number; maxRequirementsPerProject: number }>;

export const PLAN_DISPLAY = {
  free: {
    name: 'Arvid Free',
    priceLabel: 'Free',
    description: '1 project, up to 10 requirements',
  },
  plus: {
    name: 'Arvid Plus',
    priceLabel: '$29/mo per user',
    description: 'Unlimited projects and requirements',
  },
} as const satisfies Record<SubscriptionPlan, { name: string; priceLabel: string; description: string }>;

export const STRIPE_CONFIG = {
  plusProductId: 'prod_UVGeFoxEjq46QA',
  plusPriceId: 'price_1TWG7j6PmNvvZfhWQ9badNXe',
} as const;

export const UserSubscriptionRowSchema = z.object({
  user_id: z.string().uuid(),
  stripe_customer_id: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),
  plan: SubscriptionPlanEnum,
  status: SubscriptionStatusEnum.nullable().optional(),
  current_period_end: z.string().nullable().optional(),
  cancel_at_period_end: z.boolean().optional(),
  created_at: z.string().nullable().optional(),
  updated_at: z.string().nullable().optional(),
});

export const UserSubscriptionSchema = UserSubscriptionRowSchema.transform(row => ({
  userId: row.user_id,
  stripeCustomerId: row.stripe_customer_id ?? undefined,
  stripeSubscriptionId: row.stripe_subscription_id ?? undefined,
  plan: row.plan,
  status: row.status ?? undefined,
  currentPeriodEnd: row.current_period_end ?? undefined,
  cancelAtPeriodEnd: row.cancel_at_period_end ?? false,
  createdAt: row.created_at ?? undefined,
  updatedAt: row.updated_at ?? undefined,
}));

export type UserSubscriptionRow = z.infer<typeof UserSubscriptionRowSchema>;
export type UserSubscription = z.output<typeof UserSubscriptionSchema>;

export const PlanLimitsResponseSchema = z.object({
  plan: SubscriptionPlanEnum,
  limits: z.object({
    maxProjects: z.number().nullable(),
    maxRequirementsPerProject: z.number().nullable(),
  }),
  usage: z.object({
    projects: z.number(),
  }),
});
export type PlanLimitsResponse = z.infer<typeof PlanLimitsResponseSchema>;

export const InvoiceSchema = z.object({
  id: z.string(),
  number: z.string().nullable(),
  status: z.string().nullable(),
  amountDue: z.number(),
  amountPaid: z.number(),
  currency: z.string(),
  created: z.number(),
  periodStart: z.number(),
  periodEnd: z.number(),
  hostedInvoiceUrl: z.string().nullable(),
  invoicePdf: z.string().nullable(),
});
export type Invoice = z.infer<typeof InvoiceSchema>;

export const CheckoutSessionResponseSchema = z.object({
  url: z.string().url(),
});

export const PortalSessionResponseSchema = z.object({
  url: z.string().url(),
});
