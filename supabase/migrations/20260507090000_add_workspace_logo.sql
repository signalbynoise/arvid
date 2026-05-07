ALTER TABLE workspaces ADD COLUMN logo_url text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'workspace-logos',
  'workspace-logos',
  true,
  2097152,
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "workspace_logo_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'workspace-logos'
  AND EXISTS (
    SELECT 1 FROM workspace_memberships wm
    WHERE wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "workspace_logo_select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'workspace-logos');

CREATE POLICY "workspace_logo_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'workspace-logos'
  AND EXISTS (
    SELECT 1 FROM workspace_memberships wm
    WHERE wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);

CREATE POLICY "workspace_logo_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'workspace-logos'
  AND EXISTS (
    SELECT 1 FROM workspace_memberships wm
    WHERE wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  )
);
