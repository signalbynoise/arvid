-- Hierarchical Access Control: team and project level memberships
-- with additive, cascading RBAC.

-- ============================================================
-- New tables
-- ============================================================

CREATE TABLE public.team_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE public.project_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX team_memberships_user_id_idx ON public.team_memberships (user_id);
CREATE INDEX team_memberships_team_id_idx ON public.team_memberships (team_id);
CREATE INDEX project_memberships_user_id_idx ON public.project_memberships (user_id);
CREATE INDEX project_memberships_project_id_idx ON public.project_memberships (project_id);

-- ============================================================
-- Update invitations table with scope
-- ============================================================

ALTER TABLE public.workspace_invitations
  ADD COLUMN project_id text REFERENCES public.projects(id) ON DELETE CASCADE,
  ADD COLUMN scope text NOT NULL DEFAULT 'workspace' CHECK (scope IN ('workspace', 'team', 'project'));

-- ============================================================
-- Private helper functions for hierarchical access
-- ============================================================

CREATE OR REPLACE FUNCTION private.user_team_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT team_id FROM public.team_memberships WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION private.user_project_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT project_id::uuid FROM public.project_memberships WHERE user_id = auth.uid();
$$;

-- ============================================================
-- Enable RLS on new tables
-- ============================================================

ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_memberships ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS: team_memberships
-- ============================================================

CREATE POLICY "Members can view team members"
  ON public.team_memberships FOR SELECT
  USING (
    team_id IN (SELECT private.user_team_ids())
    OR team_id IN (
      SELECT t.id FROM public.teams t
      WHERE t.workspace_id IN (SELECT private.user_workspace_ids())
    )
  );

CREATE POLICY "Admins can add team members"
  ON public.team_memberships FOR INSERT
  WITH CHECK (
    private.user_workspace_role(
      (SELECT t.workspace_id FROM public.teams t WHERE t.id = team_memberships.team_id)
    ) IN ('owner', 'admin')
  );

CREATE POLICY "Admins can remove team members"
  ON public.team_memberships FOR DELETE
  USING (
    private.user_workspace_role(
      (SELECT t.workspace_id FROM public.teams t WHERE t.id = team_memberships.team_id)
    ) IN ('owner', 'admin')
  );

-- ============================================================
-- RLS: project_memberships
-- ============================================================

CREATE POLICY "Members can view project members"
  ON public.project_memberships FOR SELECT
  USING (
    project_id::uuid IN (SELECT private.user_project_ids())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (SELECT private.user_workspace_ids())
    )
  );

CREATE POLICY "Admins can add project members"
  ON public.project_memberships FOR INSERT
  WITH CHECK (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (SELECT private.user_workspace_ids())
      AND private.user_workspace_role(p.workspace_id) IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can remove project members"
  ON public.project_memberships FOR DELETE
  USING (
    project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (SELECT private.user_workspace_ids())
      AND private.user_workspace_role(p.workspace_id) IN ('owner', 'admin')
    )
  );

-- ============================================================
-- Update existing RLS: teams (add team membership check)
-- ============================================================

DROP POLICY IF EXISTS "Members can view teams" ON public.teams;
CREATE POLICY "Members can view teams"
  ON public.teams FOR SELECT
  USING (
    workspace_id IN (SELECT private.user_workspace_ids())
    OR id IN (SELECT private.user_team_ids())
  );

-- ============================================================
-- Update existing RLS: projects (add team + project membership)
-- ============================================================

DROP POLICY IF EXISTS "Workspace members can view projects" ON public.projects;
DROP POLICY IF EXISTS "Workspace members can manage projects" ON public.projects;

-- Uses private.user_project_ids() instead of inline subquery to avoid
-- infinite recursion between projects and project_memberships RLS.
CREATE POLICY "Authorized users can view projects"
  ON public.projects FOR SELECT
  USING (
    workspace_id IN (SELECT private.user_workspace_ids())
    OR team_id IN (SELECT private.user_team_ids())
    OR id::uuid IN (SELECT private.user_project_ids())
    OR user_id = auth.uid()
  );

CREATE POLICY "Authorized users can manage projects"
  ON public.projects FOR ALL
  USING (
    workspace_id IN (SELECT private.user_workspace_ids())
    OR team_id IN (SELECT private.user_team_ids())
    OR id::uuid IN (SELECT private.user_project_ids())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    workspace_id IN (SELECT private.user_workspace_ids())
    OR team_id IN (SELECT private.user_team_ids())
    OR id::uuid IN (SELECT private.user_project_ids())
    OR user_id = auth.uid()
  );

-- ============================================================
-- Update existing RLS: requirements, questions, answers, summaries
-- (chain through projects which now handles all access levels)
-- ============================================================

DROP POLICY IF EXISTS "Workspace members can manage requirements" ON public.requirements;
CREATE POLICY "Authorized users can manage requirements" ON public.requirements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = requirements.project_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = requirements.project_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Workspace members can manage questions" ON public.questions;
CREATE POLICY "Authorized users can manage questions" ON public.questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = questions.requirement_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = questions.requirement_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Workspace members can manage answers" ON public.answers;
CREATE POLICY "Authorized users can manage answers" ON public.answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
    WHERE q.id = answers.question_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
    WHERE q.id = answers.question_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

DROP POLICY IF EXISTS "Workspace members can manage summaries" ON public.summaries;
CREATE POLICY "Authorized users can manage summaries" ON public.summaries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = summaries.requirement_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = summaries.requirement_id AND (
      p.workspace_id IN (SELECT private.user_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id::uuid IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));
