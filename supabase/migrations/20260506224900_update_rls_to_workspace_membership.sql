-- Update all data table RLS policies from user_id = auth.uid()
-- to workspace membership checks via private.user_workspace_ids().
-- Keeps backward compatibility with OR user_id = auth.uid() for
-- any projects not yet migrated to a workspace.

-- Projects
DROP POLICY IF EXISTS "Users manage own projects" ON public.projects;
DROP POLICY IF EXISTS "Users read own projects" ON public.projects;

CREATE POLICY "Workspace members can view projects" ON public.projects FOR SELECT
  USING (workspace_id IN (SELECT private.user_workspace_ids()) OR user_id = auth.uid());

CREATE POLICY "Workspace members can manage projects" ON public.projects FOR ALL
  USING (workspace_id IN (SELECT private.user_workspace_ids()) OR user_id = auth.uid())
  WITH CHECK (workspace_id IN (SELECT private.user_workspace_ids()) OR user_id = auth.uid());

-- Requirements
DROP POLICY IF EXISTS "Users manage own requirements" ON public.requirements;

CREATE POLICY "Workspace members can manage requirements" ON public.requirements FOR ALL
  USING (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = requirements.project_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = requirements.project_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ));

-- Questions
DROP POLICY IF EXISTS "Users manage own questions" ON public.questions;

CREATE POLICY "Workspace members can manage questions" ON public.questions FOR ALL
  USING (EXISTS (
    SELECT 1 FROM requirements r
    JOIN projects p ON p.id = r.project_id
    WHERE r.id = questions.requirement_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM requirements r
    JOIN projects p ON p.id = r.project_id
    WHERE r.id = questions.requirement_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ));

-- Answers
DROP POLICY IF EXISTS "Users manage own answers" ON public.answers;

CREATE POLICY "Workspace members can manage answers" ON public.answers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM questions q
    JOIN requirements r ON r.id = q.requirement_id
    JOIN projects p ON p.id = r.project_id
    WHERE q.id = answers.question_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM questions q
    JOIN requirements r ON r.id = q.requirement_id
    JOIN projects p ON p.id = r.project_id
    WHERE q.id = answers.question_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ));

-- Summaries
DROP POLICY IF EXISTS "Users manage own summaries" ON public.summaries;

CREATE POLICY "Workspace members can manage summaries" ON public.summaries FOR ALL
  USING (EXISTS (
    SELECT 1 FROM requirements r
    JOIN projects p ON p.id = r.project_id
    WHERE r.id = summaries.requirement_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM requirements r
    JOIN projects p ON p.id = r.project_id
    WHERE r.id = summaries.requirement_id
    AND (p.workspace_id IN (SELECT private.user_workspace_ids()) OR p.user_id = auth.uid())
  ));
