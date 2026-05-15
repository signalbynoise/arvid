-- Allow service-role (and anon via supabase client) to read db_contexts
-- Matches the existing "Service role can manage all repo contexts" policy on repo_contexts.
-- Without this, the CMS article writer cannot access db context because
-- db_contexts_workspace_policy requires auth.uid() from a user session.
CREATE POLICY "Service role can manage all db contexts"
  ON db_contexts FOR ALL USING (true);
