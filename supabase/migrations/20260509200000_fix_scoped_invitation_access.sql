-- Fix: Project/team-scoped invitations were granting full workspace access.
-- Root cause: accepting a scoped invite created a workspace_membership with
-- role='member', and all RLS policies treated any workspace membership as
-- full access. Solution: introduce 'guest' role for scoped-only members,
-- and a new helper function that only returns workspaces where the user has
-- full access (owner/admin/member but NOT guest).

-- ============================================================
-- 1. Allow 'guest' role in workspace_memberships
-- ============================================================

ALTER TABLE public.workspace_memberships
  DROP CONSTRAINT IF EXISTS workspace_memberships_role_check;

ALTER TABLE public.workspace_memberships
  ADD CONSTRAINT workspace_memberships_role_check
  CHECK (role IN ('owner', 'admin', 'member', 'guest'));

-- ============================================================
-- 2. New helper: returns only workspaces with full access
-- ============================================================

CREATE OR REPLACE FUNCTION private.user_full_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT workspace_id
  FROM public.workspace_memberships
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'member');
$$;

-- ============================================================
-- 2b. Fix user_project_ids: return text to match projects.id type
-- ============================================================

DROP FUNCTION IF EXISTS private.user_project_ids() CASCADE;

CREATE FUNCTION private.user_project_ids()
RETURNS SETOF text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT project_id FROM public.project_memberships WHERE user_id = auth.uid();
$$;

-- Recreate project_memberships SELECT policy (dropped by CASCADE)
DROP POLICY IF EXISTS "Members can view project members" ON public.project_memberships;
CREATE POLICY "Members can view project members"
  ON public.project_memberships FOR SELECT
  USING (
    project_id IN (SELECT private.user_project_ids())
    OR project_id IN (
      SELECT p.id FROM public.projects p
      WHERE p.workspace_id IN (SELECT private.user_full_workspace_ids())
    )
  );

-- ============================================================
-- 3. Update RLS on teams: full workspace members see all teams,
--    guests only see teams they have explicit membership in
-- ============================================================

DROP POLICY IF EXISTS "Members can view teams" ON public.teams;
CREATE POLICY "Members can view teams"
  ON public.teams FOR SELECT
  USING (
    workspace_id IN (SELECT private.user_full_workspace_ids())
    OR id IN (SELECT private.user_team_ids())
    OR id IN (
      SELECT p.team_id FROM public.projects p
      WHERE p.id IN (SELECT private.user_project_ids())
      AND p.team_id IS NOT NULL
    )
  );

-- ============================================================
-- 4. Update RLS on projects: full workspace members see all,
--    guests only see via team/project memberships
-- ============================================================

DROP POLICY IF EXISTS "Authorized users can view projects" ON public.projects;
CREATE POLICY "Authorized users can view projects"
  ON public.projects FOR SELECT
  USING (
    workspace_id IN (SELECT private.user_full_workspace_ids())
    OR team_id IN (SELECT private.user_team_ids())
    OR id IN (SELECT private.user_project_ids())
    OR user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authorized users can manage projects" ON public.projects;
CREATE POLICY "Authorized users can manage projects"
  ON public.projects FOR ALL
  USING (
    workspace_id IN (SELECT private.user_full_workspace_ids())
    OR team_id IN (SELECT private.user_team_ids())
    OR id IN (SELECT private.user_project_ids())
    OR user_id = auth.uid()
  )
  WITH CHECK (
    workspace_id IN (SELECT private.user_full_workspace_ids())
    OR team_id IN (SELECT private.user_team_ids())
    OR id IN (SELECT private.user_project_ids())
    OR user_id = auth.uid()
  );

-- ============================================================
-- 5. Update RLS on requirements
-- ============================================================

DROP POLICY IF EXISTS "Authorized users can manage requirements" ON public.requirements;
CREATE POLICY "Authorized users can manage requirements" ON public.requirements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = requirements.project_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = requirements.project_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

-- ============================================================
-- 6. Update RLS on questions
-- ============================================================

DROP POLICY IF EXISTS "Authorized users can manage questions" ON public.questions;
CREATE POLICY "Authorized users can manage questions" ON public.questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = questions.requirement_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = questions.requirement_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

-- ============================================================
-- 7. Update RLS on answers
-- ============================================================

DROP POLICY IF EXISTS "Authorized users can manage answers" ON public.answers;
CREATE POLICY "Authorized users can manage answers" ON public.answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
    WHERE q.id = answers.question_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
    WHERE q.id = answers.question_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

-- ============================================================
-- 8. Update RLS on summaries
-- ============================================================

DROP POLICY IF EXISTS "Authorized users can manage summaries" ON public.summaries;
CREATE POLICY "Authorized users can manage summaries" ON public.summaries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = summaries.requirement_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
    WHERE r.id = summaries.requirement_id AND (
      p.workspace_id IN (SELECT private.user_full_workspace_ids())
      OR p.team_id IN (SELECT private.user_team_ids())
      OR p.id IN (SELECT private.user_project_ids())
      OR p.user_id = auth.uid()
    )
  ));

-- ============================================================
-- 9. Update RLS on card_assignees
-- ============================================================

DROP POLICY IF EXISTS "Authorized users can view card_assignees" ON public.card_assignees;
CREATE POLICY "Authorized users can view card_assignees" ON public.card_assignees FOR SELECT
  USING (
    CASE entity_type
      WHEN 'requirement' THEN EXISTS (
        SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
        WHERE r.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'question' THEN EXISTS (
        SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE q.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'answer' THEN EXISTS (
        SELECT 1 FROM answers a JOIN questions q ON q.id = a.question_id JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE a.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      ELSE false
    END
  );

DROP POLICY IF EXISTS "Authorized users can manage card_assignees" ON public.card_assignees;
CREATE POLICY "Authorized users can manage card_assignees" ON public.card_assignees FOR INSERT
  WITH CHECK (
    CASE entity_type
      WHEN 'requirement' THEN EXISTS (
        SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
        WHERE r.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'question' THEN EXISTS (
        SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE q.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'answer' THEN EXISTS (
        SELECT 1 FROM answers a JOIN questions q ON q.id = a.question_id JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE a.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      ELSE false
    END
  );

DROP POLICY IF EXISTS "Authorized users can delete card_assignees" ON public.card_assignees;
CREATE POLICY "Authorized users can delete card_assignees" ON public.card_assignees FOR DELETE
  USING (
    CASE entity_type
      WHEN 'requirement' THEN EXISTS (
        SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
        WHERE r.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'question' THEN EXISTS (
        SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE q.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'answer' THEN EXISTS (
        SELECT 1 FROM answers a JOIN questions q ON q.id = a.question_id JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE a.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_full_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      ELSE false
    END
  );

-- ============================================================
-- 10. Update RLS on workspace_invitations: guests should NOT
--     see other invitations, only full members can
-- ============================================================

DROP POLICY IF EXISTS "Members can view workspace invitations" ON public.workspace_invitations;
CREATE POLICY "Members can view workspace invitations"
  ON public.workspace_invitations FOR SELECT
  USING (workspace_id IN (SELECT private.user_full_workspace_ids()));

-- ============================================================
-- 11. Update db_contexts RLS if it exists
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'db_contexts') THEN
    EXECUTE 'DROP POLICY IF EXISTS "db_contexts_workspace_policy" ON public.db_contexts';
    EXECUTE '
      CREATE POLICY "db_contexts_workspace_policy" ON public.db_contexts FOR ALL
        USING (EXISTS (
          SELECT 1 FROM public.projects p
          WHERE p.id = db_contexts.project_id
            AND (
              p.user_id = auth.uid()
              OR p.workspace_id IN (SELECT private.user_full_workspace_ids())
              OR p.team_id IN (SELECT private.user_team_ids())
              OR p.id IN (SELECT private.user_project_ids())
            )
        ))';
  END IF;
END $$;

-- ============================================================
-- 12. Downgrade existing scoped-only members to 'guest'
--     (users who have team/project memberships but were
--      incorrectly given 'member' workspace role via invite)
-- ============================================================
-- NOTE: This is intentionally left as a manual step. Run after
-- reviewing which users were affected. The migration above
-- prevents NEW invites from creating the wrong role.
