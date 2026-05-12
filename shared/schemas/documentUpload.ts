import { z } from 'zod';
import { ClarityEnum, RiskEnum } from './enums';

export const DocumentUploadStatusEnum = z.enum([
  'uploading',
  'processing',
  'completed',
  'failed',
]);

export type DocumentUploadStatus = z.infer<typeof DocumentUploadStatusEnum>;

export const DocumentUploadRowSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string(),
  uploaded_by: z.string().uuid(),
  filename: z.string(),
  storage_path: z.string(),
  file_size: z.number(),
  mime_type: z.string(),
  status: DocumentUploadStatusEnum,
  error_message: z.string().nullable(),
  extracted_requirements: z.unknown().nullable(),
  extracted_count: z.number().nullable(),
  extracted_at: z.string().nullable(),
  created_at: z.string(),
  is_deactivated: z.boolean(),
});

export type DocumentUploadRow = z.infer<typeof DocumentUploadRowSchema>;

export const DocumentUploadSchema = DocumentUploadRowSchema.transform(row => ({
  id: row.id,
  projectId: row.project_id,
  uploadedBy: row.uploaded_by,
  filename: row.filename,
  storagePath: row.storage_path,
  fileSize: row.file_size,
  mimeType: row.mime_type,
  status: row.status,
  errorMessage: row.error_message,
  extractedRequirements: row.extracted_requirements,
  extractedCount: row.extracted_count,
  extractedAt: row.extracted_at,
  createdAt: row.created_at,
  isDeactivated: row.is_deactivated,
}));

export type DocumentUpload = z.infer<typeof DocumentUploadSchema>;

export const ExtractedRequirementSchema = z.object({
  title: z.string(),
  description: z.string(),
  clarity: ClarityEnum,
  risk: RiskEnum,
  owner: z.string().optional(),
});

export type ExtractedRequirement = z.infer<typeof ExtractedRequirementSchema>;

export const ConfirmDocumentRequirementsBodySchema = z.object({
  requirements: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    clarity: ClarityEnum.default('Low'),
    risk: RiskEnum.default('Medium'),
    owner: z.string().optional(),
  })),
});

export type ConfirmDocumentRequirementsBody = z.infer<typeof ConfirmDocumentRequirementsBodySchema>;
