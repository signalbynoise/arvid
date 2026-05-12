-- Document uploads: storage bucket + metadata table for AI requirements extraction

-- ============================================================
-- 1. Storage bucket for uploaded documents
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-uploads',
  'document-uploads',
  false,
  10485760,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: project members can upload/read documents
-- NOTE: objects.name must be explicitly qualified to avoid resolving to projects.name
CREATE POLICY "document_upload_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'document-uploads'
  AND EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = (string_to_array(objects.name, '/'))[1]
    AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "document_upload_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'document-uploads'
  AND EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = (string_to_array(objects.name, '/'))[1]
    AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  )
);

CREATE POLICY "document_upload_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'document-uploads'
  AND EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = (string_to_array(objects.name, '/'))[1]
    AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  )
);

-- ============================================================
-- 2. Document uploads metadata table
-- ============================================================

CREATE TABLE public.document_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  filename text NOT NULL,
  storage_path text NOT NULL,
  file_size integer NOT NULL,
  mime_type text NOT NULL,
  status text NOT NULL DEFAULT 'uploading'
    CHECK (status IN ('uploading', 'processing', 'completed', 'failed')),
  error_message text,
  extracted_text text,
  extracted_requirements jsonb,
  extracted_count integer,
  extracted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_deactivated boolean NOT NULL DEFAULT false
);

CREATE INDEX idx_document_uploads_project_id ON public.document_uploads(project_id);
CREATE INDEX idx_document_uploads_status ON public.document_uploads(status);

-- ============================================================
-- 3. RLS policies for document_uploads
-- ============================================================

ALTER TABLE public.document_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can manage document_uploads"
ON public.document_uploads FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = document_uploads.project_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = document_uploads.project_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

-- ============================================================
-- 4. Enable Realtime for status updates
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.document_uploads;
