-- Figma integration: connection storage + design links per requirement

-- ============================================================
-- 1. Figma connections (one per user, PAT-based)
-- ============================================================

CREATE TABLE public.figma_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  figma_user_id text,
  figma_username text,
  figma_email text,
  scopes text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.figma_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own figma_connection"
ON public.figma_connections FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 2. Requirement Figma links (many per requirement)
-- ============================================================

CREATE TABLE public.requirement_figma_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id text NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  figma_url text NOT NULL,
  file_key text NOT NULL,
  node_id text,
  node_name text,
  thumbnail_url text,
  structural_summary jsonb,
  fetched_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_requirement_figma_links_requirement_id
  ON public.requirement_figma_links(requirement_id);

ALTER TABLE public.requirement_figma_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can manage requirement_figma_links"
ON public.requirement_figma_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM requirements r
    JOIN projects p ON p.id = r.project_id
    WHERE r.id = requirement_figma_links.requirement_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM requirements r
    JOIN projects p ON p.id = r.project_id
    WHERE r.id = requirement_figma_links.requirement_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));
