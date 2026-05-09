import { z } from 'zod';

export const EntityTypeEnum = z.enum(['requirement', 'question', 'answer']);

export const CardAssigneeRowSchema = z.object({
  id: z.string().uuid(),
  entity_type: EntityTypeEnum,
  entity_id: z.string(),
  user_id: z.string().uuid(),
  assigned_at: z.string(),
});

export const CardAssigneeSchema = CardAssigneeRowSchema.transform(row => ({
  id: row.id,
  entityType: row.entity_type,
  entityId: row.entity_id,
  userId: row.user_id,
  assignedAt: row.assigned_at,
}));

export const CreateCardAssigneeBodySchema = z.object({
  entity_type: EntityTypeEnum,
  entity_id: z.string().min(1),
  user_id: z.string().uuid(),
});

export type EntityType = z.infer<typeof EntityTypeEnum>;
export type CardAssigneeRow = z.infer<typeof CardAssigneeRowSchema>;
export type CardAssignee = z.output<typeof CardAssigneeSchema>;
