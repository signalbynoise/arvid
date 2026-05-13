-- Migration: Add full-text search across requirements, questions, and answers
-- Adds generated tsvector columns, GIN indexes, and a SECURITY INVOKER RPC function

-- ============================================================
-- Generated tsvector columns
-- ============================================================

ALTER TABLE public.requirements
  ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' ||
      coalesce(owner, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED;

ALTER TABLE public.questions
  ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(text, '') || ' ' ||
      coalesce(author, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED;

ALTER TABLE public.answers
  ADD COLUMN fts tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(text, '') || ' ' ||
      coalesce(author, '')
    )
  ) STORED;

-- ============================================================
-- GIN indexes for fast full-text lookups
-- ============================================================

CREATE INDEX idx_requirements_fts ON public.requirements USING GIN (fts);
CREATE INDEX idx_questions_fts ON public.questions USING GIN (fts);
CREATE INDEX idx_answers_fts ON public.answers USING GIN (fts);

-- ============================================================
-- Unified search RPC (SECURITY INVOKER = RLS enforced)
-- ============================================================

CREATE OR REPLACE FUNCTION public.search_entities(
  p_query text,
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS TABLE (
  entity_type text,
  entity_id text,
  short_id text,
  label text,
  author text,
  snippet text,
  rank real,
  project_id text,
  requirement_id text,
  question_id text
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
DECLARE
  safe_query text;
  tsq tsquery;
BEGIN
  safe_query := left(trim(p_query), 500);

  IF safe_query = '' THEN
    RETURN;
  END IF;

  tsq := websearch_to_tsquery('english', safe_query);

  RETURN QUERY
  (
    SELECT
      'requirement'::text AS entity_type,
      r.id::text AS entity_id,
      r.short_id::text,
      r.title::text AS label,
      r.owner::text AS author,
      ts_headline('english',
        r.title || ' ' || coalesce(r.description, ''),
        tsq,
        'MaxWords=30, MinWords=10, MaxFragments=1'
      )::text AS snippet,
      ts_rank(r.fts, tsq) AS rank,
      r.project_id::text,
      NULL::text AS requirement_id,
      NULL::text AS question_id
    FROM public.requirements r
    JOIN public.projects p ON p.id = r.project_id
    WHERE r.fts @@ tsq
      AND r.is_deactivated = false
      AND p.is_deleted = false
  )
  UNION ALL
  (
    SELECT
      'question'::text AS entity_type,
      q.id::text AS entity_id,
      q.short_id::text,
      q.text::text AS label,
      q.author::text,
      ts_headline('english',
        q.text || ' ' || coalesce(q.description, ''),
        tsq,
        'MaxWords=30, MinWords=10, MaxFragments=1'
      )::text AS snippet,
      ts_rank(q.fts, tsq) AS rank,
      r.project_id::text,
      q.requirement_id::text,
      NULL::text AS question_id
    FROM public.questions q
    JOIN public.requirements r ON r.id = q.requirement_id
    JOIN public.projects p ON p.id = r.project_id
    WHERE q.fts @@ tsq
      AND q.is_deactivated = false
      AND r.is_deactivated = false
      AND p.is_deleted = false
  )
  UNION ALL
  (
    SELECT
      'answer'::text AS entity_type,
      a.id::text AS entity_id,
      a.short_id::text,
      left(a.text, 120)::text AS label,
      a.author::text,
      ts_headline('english',
        a.text,
        tsq,
        'MaxWords=30, MinWords=10, MaxFragments=1'
      )::text AS snippet,
      ts_rank(a.fts, tsq) AS rank,
      r.project_id::text,
      q.requirement_id::text,
      a.question_id::text
    FROM public.answers a
    JOIN public.questions q ON q.id = a.question_id
    JOIN public.requirements r ON r.id = q.requirement_id
    JOIN public.projects p ON p.id = r.project_id
    WHERE a.fts @@ tsq
      AND a.is_deactivated = false
      AND q.is_deactivated = false
      AND r.is_deactivated = false
      AND p.is_deleted = false
  )
  ORDER BY rank DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
