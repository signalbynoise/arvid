ALTER TABLE public.articles
  DROP CONSTRAINT articles_type_check,
  ADD CONSTRAINT articles_type_check CHECK (type IN ('article', 'feature', 'guide', 'docs', 'changelog'));
