import { z } from 'zod';

export const ClarityEnum = z.enum(['High', 'Medium', 'Low']);
export const RiskEnum = z.enum(['Low', 'Medium', 'High']);
export const StatusEnum = z.enum(['Unanswered', 'Answered', 'Conflicting']);
export const ImportanceEnum = z.enum(['Critical', 'Important', 'Optional']);
export const QuestionTypeEnum = z.enum(['Auto-generated', 'Manual']);
export const CategoryEnum = z.enum(['Scope', 'Data', 'Time', 'Output', 'Quality']);
export const ImplStatusEnum = z.enum(['Not Checked', 'Checking', 'Implemented', 'Partially Implemented', 'Not Implemented', 'No Repo', 'Unknown']);

export const DeployStatusEnum = z.enum(['live', 'not_deployed', 'deploy_failed', 'unknown', 'checking']);
export type DeployStatus = z.infer<typeof DeployStatusEnum>;

export type Clarity = z.infer<typeof ClarityEnum>;
export type Risk = z.infer<typeof RiskEnum>;
export type Status = z.infer<typeof StatusEnum>;
export type Importance = z.infer<typeof ImportanceEnum>;
export type QuestionType = z.infer<typeof QuestionTypeEnum>;
export type Category = z.infer<typeof CategoryEnum>;
export type ImplStatus = z.infer<typeof ImplStatusEnum>;
