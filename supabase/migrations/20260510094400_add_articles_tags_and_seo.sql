-- Add tags for search/filtering and meta_description for SEO
ALTER TABLE articles ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE articles ADD COLUMN IF NOT EXISTS meta_description text;

CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING gin (tags);
