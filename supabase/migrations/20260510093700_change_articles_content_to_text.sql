-- Switch content column from jsonb blocks to markdown text
ALTER TABLE articles ALTER COLUMN content DROP DEFAULT;
ALTER TABLE articles ALTER COLUMN content TYPE text USING content::text;
ALTER TABLE articles ALTER COLUMN content SET DEFAULT '';
ALTER TABLE articles ALTER COLUMN content SET NOT NULL;
