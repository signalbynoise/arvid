-- Replace scoped short_id indexes with globally unique indexes.
-- New short IDs use random alphanumeric format (e.g. W-8H7B) and are
-- globally unique by design, so scoping by parent is no longer needed.

-- Step 1: Drop old scoped indexes
DROP INDEX IF EXISTS workspaces_short_id_idx;
DROP INDEX IF EXISTS teams_short_id_idx;
DROP INDEX IF EXISTS requirements_project_short_id_unique;
DROP INDEX IF EXISTS questions_requirement_short_id_unique;
DROP INDEX IF EXISTS answers_question_short_id_unique;

-- Step 2: Deduplicate existing rows (keep first per short_id, regenerate rest)
CREATE OR REPLACE FUNCTION generate_random_short_id(prefix text) RETURNS text AS $$
DECLARE
  charset text := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  result text := prefix || '-';
  i int;
BEGIN
  FOR i IN 1..4 LOOP
    result := result || substr(charset, floor(random() * length(charset) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

UPDATE workspaces SET short_id = generate_random_short_id('W')
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY short_id ORDER BY id) as rn
    FROM workspaces WHERE short_id IS NOT NULL
  ) sub WHERE rn > 1
);

UPDATE teams SET short_id = generate_random_short_id('T')
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY short_id ORDER BY id) as rn
    FROM teams WHERE short_id IS NOT NULL
  ) sub WHERE rn > 1
);

UPDATE projects SET short_id = generate_random_short_id('P')
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY short_id ORDER BY id) as rn
    FROM projects WHERE short_id IS NOT NULL
  ) sub WHERE rn > 1
);

UPDATE requirements SET short_id = generate_random_short_id('R')
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY short_id ORDER BY id) as rn
    FROM requirements WHERE short_id IS NOT NULL
  ) sub WHERE rn > 1
);

UPDATE questions SET short_id = generate_random_short_id('Q')
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY short_id ORDER BY id) as rn
    FROM questions WHERE short_id IS NOT NULL
  ) sub WHERE rn > 1
);

UPDATE answers SET short_id = generate_random_short_id('A')
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY short_id ORDER BY id) as rn
    FROM answers WHERE short_id IS NOT NULL
  ) sub WHERE rn > 1
);

-- Step 3: Create globally unique indexes
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

DROP FUNCTION IF EXISTS generate_random_short_id(text);
