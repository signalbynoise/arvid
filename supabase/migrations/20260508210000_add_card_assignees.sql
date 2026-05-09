-- Card Assignees: multi-user assignment on requirements, questions, answers.
-- Also adds created_by (UUID) and is_deactivated (soft-delete) to entity tables.

-- ============================================================
-- Add columns to entity tables
-- ============================================================

ALTER TABLE public.requirements
  ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_deactivated boolean NOT NULL DEFAULT false;

ALTER TABLE public.questions
  ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_deactivated boolean NOT NULL DEFAULT false;

ALTER TABLE public.answers
  ADD COLUMN created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN is_deactivated boolean NOT NULL DEFAULT false;

CREATE INDEX requirements_is_deactivated_idx ON public.requirements (is_deactivated) WHERE is_deactivated = false;
CREATE INDEX questions_is_deactivated_idx ON public.questions (is_deactivated) WHERE is_deactivated = false;
CREATE INDEX answers_is_deactivated_idx ON public.answers (is_deactivated) WHERE is_deactivated = false;

-- ============================================================
-- Card assignees junction table
-- ============================================================

CREATE TABLE public.card_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('requirement', 'question', 'answer')),
  entity_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, entity_id, user_id)
);

CREATE INDEX card_assignees_entity_idx ON public.card_assignees (entity_type, entity_id);
CREATE INDEX card_assignees_user_id_idx ON public.card_assignees (user_id);

-- ============================================================
-- RLS for card_assignees
-- ============================================================

ALTER TABLE public.card_assignees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authorized users can view card assignees" ON public.card_assignees FOR SELECT
  USING (
    CASE entity_type
      WHEN 'requirement' THEN EXISTS (
        SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
        WHERE r.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'question' THEN EXISTS (
        SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE q.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'answer' THEN EXISTS (
        SELECT 1 FROM answers a JOIN questions q ON q.id = a.question_id JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE a.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
    END
  );

CREATE POLICY "Authorized users can manage card assignees" ON public.card_assignees FOR ALL
  USING (
    CASE entity_type
      WHEN 'requirement' THEN EXISTS (
        SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
        WHERE r.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'question' THEN EXISTS (
        SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE q.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'answer' THEN EXISTS (
        SELECT 1 FROM answers a JOIN questions q ON q.id = a.question_id JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE a.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
    END
  )
  WITH CHECK (
    CASE entity_type
      WHEN 'requirement' THEN EXISTS (
        SELECT 1 FROM requirements r JOIN projects p ON p.id = r.project_id
        WHERE r.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'question' THEN EXISTS (
        SELECT 1 FROM questions q JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE q.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
      WHEN 'answer' THEN EXISTS (
        SELECT 1 FROM answers a JOIN questions q ON q.id = a.question_id JOIN requirements r ON r.id = q.requirement_id JOIN projects p ON p.id = r.project_id
        WHERE a.id = card_assignees.entity_id AND (
          p.workspace_id IN (SELECT private.user_workspace_ids())
          OR p.team_id IN (SELECT private.user_team_ids())
          OR p.id::uuid IN (SELECT private.user_project_ids())
          OR p.user_id = auth.uid()
        )
      )
    END
  );
