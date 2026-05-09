-- Replace scoped short_id indexes with globally unique indexes.
-- New short IDs use random alphanumeric format (e.g. W-8H7B) and are
-- globally unique by design, so scoping by parent is no longer needed.

DROP INDEX IF EXISTS workspaces_short_id_idx;
DROP INDEX IF EXISTS teams_short_id_idx;
DROP INDEX IF EXISTS requirements_project_short_id_unique;
DROP INDEX IF EXISTS questions_requirement_short_id_unique;
DROP INDEX IF EXISTS answers_question_short_id_unique;

CREATE UNIQUE INDEX workspaces_short_id_unique
  ON public.workspaces (short_id) WHERE short_id IS NOT NULL;

CREATE UNIQUE INDEX teams_short_id_unique
  ON public.teams (short_id) WHERE short_id IS NOT NULL;

CREATE UNIQUE INDEX projects_short_id_unique
  ON public.projects (short_id) WHERE short_id IS NOT NULL;

CREATE UNIQUE INDEX requirements_short_id_unique
  ON public.requirements (short_id) WHERE short_id IS NOT NULL;

CREATE UNIQUE INDEX questions_short_id_unique
  ON public.questions (short_id) WHERE short_id IS NOT NULL;

CREATE UNIQUE INDEX answers_short_id_unique
  ON public.answers (short_id) WHERE short_id IS NOT NULL;
