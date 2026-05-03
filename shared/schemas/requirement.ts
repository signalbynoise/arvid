import { z } from 'zod';
import { ClarityEnum, RiskEnum } from './enums';

export const RequirementRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  source: z.string(),
  owner: z.string(),
  owner_team: z.string().nullable().optional(),
  owner_role: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  completeness: z.number(),
  clarity: ClarityEnum,
  risk: RiskEnum,
  project_id: z.string().nullable().optional(),
});

export const RequirementSchema = RequirementRowSchema.transform(row => ({
  id: row.id,
  title: row.title,
  source: row.source,
  owner: row.owner,
  ownerTeam: row.owner_team ?? undefined,
  ownerRole: row.owner_role ?? undefined,
  createdAt: row.created_at ?? undefined,
  description: row.description ?? undefined,
  completeness: row.completeness,
  clarity: row.clarity,
  risk: row.risk,
  projectId: row.project_id ?? undefined,
}));

export const CreateRequirementBodySchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  source: z.string().default('Unknown'),
  owner: z.string().default('Unassigned'),
  owner_team: z.string().nullable().optional(),
  owner_role: z.string().nullable().optional(),
  created_at: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  completeness: z.number().min(0).max(100).default(0),
  clarity: ClarityEnum.default('Low'),
  risk: RiskEnum.default('Medium'),
  project_id: z.string().nullable().optional(),
});

export const UpdateRequirementBodySchema = CreateRequirementBodySchema.partial().omit({ id: true });

export type RequirementRow = z.infer<typeof RequirementRowSchema>;
export type Requirement = z.output<typeof RequirementSchema>;
