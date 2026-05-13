-- Semantic similarity: pgvector embeddings + cached similarity results
-- for surfacing related requirements on cards and in the details modal.

-- ============================================================
-- Enable pgvector
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================
-- Embeddings table  (one row per requirement)
-- ============================================================

CREATE TABLE public.requirement_embeddings (
  requirement_id TEXT PRIMARY KEY REFERENCES public.requirements(id) ON DELETE CASCADE,
  embedding extensions.vector(1536) NOT NULL,
  content_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.requirement_embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Similarity cache  (top-5 per requirement, 24 h TTL)
-- ============================================================

CREATE TABLE public.similarity_cache (
  requirement_id TEXT PRIMARY KEY REFERENCES public.requirements(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  similar_requirements JSONB NOT NULL DEFAULT '[]',
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX similarity_cache_project_id_idx
  ON public.similarity_cache (project_id);

ALTER TABLE public.similarity_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Trigger: invalidate project cache on requirement changes
-- ============================================================

CREATE OR REPLACE FUNCTION public.invalidate_similarity_cache()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.similarity_cache
      WHERE project_id = OLD.project_id;
    DELETE FROM public.requirement_embeddings
      WHERE requirement_id = OLD.id;
    RETURN OLD;
  END IF;

  DELETE FROM public.similarity_cache
    WHERE project_id = NEW.project_id;

  IF TG_OP = 'UPDATE' AND OLD.project_id IS DISTINCT FROM NEW.project_id THEN
    DELETE FROM public.similarity_cache
      WHERE project_id = OLD.project_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER requirements_similarity_cache_invalidation
  AFTER INSERT
     OR UPDATE OF title, description, is_deactivated, project_id
     OR DELETE
  ON public.requirements
  FOR EACH ROW
  EXECUTE FUNCTION public.invalidate_similarity_cache();

-- ============================================================
-- RPC: cosine similarity search via pgvector
-- ============================================================

CREATE OR REPLACE FUNCTION public.match_similar_requirements(
  target_id TEXT,
  target_project_id TEXT,
  similarity_threshold DOUBLE PRECISION DEFAULT 0.3,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  short_id TEXT,
  title TEXT,
  score DOUBLE PRECISION
)
LANGUAGE sql STABLE
SECURITY DEFINER
AS $$
  SELECT
    r.id,
    r.short_id,
    r.title,
    1 - (e_target.embedding <=> e_other.embedding) AS score
  FROM public.requirements r
  JOIN public.requirement_embeddings e_other
    ON e_other.requirement_id = r.id
  CROSS JOIN public.requirement_embeddings e_target
  WHERE e_target.requirement_id = target_id
    AND r.id != target_id
    AND r.project_id = target_project_id
    AND r.is_deactivated = false
    AND 1 - (e_target.embedding <=> e_other.embedding) >= similarity_threshold
  ORDER BY score DESC
  LIMIT match_count;
$$;
