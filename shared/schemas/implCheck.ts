import { z } from 'zod';
import { ImplStatusEnum } from './enums';

export const ImplementationCheckResponseSchema = z.object({
  status: ImplStatusEnum,
  confidence: z.number().min(0).max(1),
  evidence: z.string(),
});

export type ImplementationCheckResponse = z.infer<typeof ImplementationCheckResponseSchema>;
