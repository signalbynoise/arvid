-- Restrict article write access to super admin only
-- Public read for published articles remains unchanged

DROP POLICY IF EXISTS articles_authenticated_select ON articles;
DROP POLICY IF EXISTS articles_authenticated_insert ON articles;
DROP POLICY IF EXISTS articles_authenticated_update ON articles;
DROP POLICY IF EXISTS articles_authenticated_delete ON articles;

-- Super admin can read all articles (any status)
CREATE POLICY articles_admin_select ON articles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = '926ede11-3607-446e-a7aa-400bd22635ff');

-- Super admin can insert
CREATE POLICY articles_admin_insert ON articles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = '926ede11-3607-446e-a7aa-400bd22635ff');

-- Super admin can update
CREATE POLICY articles_admin_update ON articles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = '926ede11-3607-446e-a7aa-400bd22635ff')
  WITH CHECK (auth.uid() = '926ede11-3607-446e-a7aa-400bd22635ff');

-- Super admin can delete
CREATE POLICY articles_admin_delete ON articles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = '926ede11-3607-446e-a7aa-400bd22635ff');
