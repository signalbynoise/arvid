-- Fix duplicate short_ids by regenerating them sequentially within each scope

-- Fix requirements: unique per project_id
WITH numbered AS (
  SELECT id, project_id,
    'R' || LPAD(ROW_NUMBER() OVER (PARTITION BY project_id ORDER BY created_at, id)::text, 2, '0') AS new_short_id
  FROM requirements
  WHERE project_id IS NOT NULL
)
UPDATE requirements r
SET short_id = n.new_short_id
FROM numbered n
WHERE r.id = n.id AND r.short_id IS DISTINCT FROM n.new_short_id;

-- Fix questions: unique per requirement_id
WITH numbered AS (
  SELECT id, requirement_id,
    'Q' || LPAD(ROW_NUMBER() OVER (PARTITION BY requirement_id ORDER BY created_at, id)::text, 2, '0') AS new_short_id
  FROM questions
  WHERE requirement_id IS NOT NULL
)
UPDATE questions q
SET short_id = n.new_short_id
FROM numbered n
WHERE q.id = n.id AND q.short_id IS DISTINCT FROM n.new_short_id;

-- Fix answers: unique per question_id
WITH numbered AS (
  SELECT id, question_id,
    'A' || LPAD(ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at, id)::text, 2, '0') AS new_short_id
  FROM answers
  WHERE question_id IS NOT NULL
)
UPDATE answers a
SET short_id = n.new_short_id
FROM numbered n
WHERE a.id = n.id AND a.short_id IS DISTINCT FROM n.new_short_id;

-- Add unique constraints to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS requirements_project_short_id_unique
  ON requirements (project_id, short_id) WHERE short_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS questions_requirement_short_id_unique
  ON questions (requirement_id, short_id) WHERE short_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS answers_question_short_id_unique
  ON answers (question_id, short_id) WHERE short_id IS NOT NULL;
