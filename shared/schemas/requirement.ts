import { z } from 'zod';
import { ClarityEnum, RiskEnum, ImplStatusEnum } from './enums';

export const RequirementRowSchema = z.object({
  id: z.string(),
  title: z.string(),
  short_id: z.string().nullable().optional(),
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
  linear_issue_id: z.string().nullable().optional(),
  linear_issue_identifier: z.string().nullable().optional(),
  linear_issue_url: z.string().nullable().optional(),
  linear_status: z.string().nullable().optional(),
  linear_status_type: z.string().nullable().optional(),
  impl_status: ImplStatusEnum.nullable().optional(),
  impl_confidence: z.number().nullable().optional(),
  impl_checked_at: z.string().nullable().optional(),
  impl_evidence: z.string().nullable().optional(),
  impl_analysis: z.unknown().nullable().optional(),
  created_by: z.string().uuid().nullable().optional(),
  is_deactivated: z.boolean().optional(),
});

export const RequirementSchema = RequirementRowSchema.transform(row => ({
  id: row.id,
  title: row.title,
  shortId: row.short_id ?? undefined,
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
  linearIssueId: row.linear_issue_id ?? undefined,
  linearIssueIdentifier: row.linear_issue_identifier ?? undefined,
  linearIssueUrl: row.linear_issue_url ?? undefined,
  linearStatus: row.linear_status ?? 'Pre-backlog',
  linearStatusType: row.linear_status_type ?? undefined,
  implStatus: row.impl_status ?? undefined,
  implConfidence: row.impl_confidence ?? undefined,
  implCheckedAt: row.impl_checked_at ?? undefined,
  implEvidence: row.impl_evidence ?? undefined,
  implAnalysis: (row.impl_analysis as import('./implCheck').ImplAnalysis | null) ?? undefined,
  createdBy: row.created_by ?? undefined,
  isDeactivated: row.is_deactivated ?? false,
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
  created_by: z.string().uuid().nullable().optional(),
  is_deactivated: z.boolean().optional(),
});

export const UpdateRequirementBodySchema = CreateRequirementBodySchema.partial().omit({ id: true });

export type RequirementRow = z.infer<typeof RequirementRowSchema>;
export type Requirement = z.output<typeof RequirementSchema>;
