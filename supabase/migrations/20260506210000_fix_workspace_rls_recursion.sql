-- Fix: Self-referencing RLS policies on workspace_memberships caused
-- infinite recursion (ERROR 42P17). Solution: SECURITY DEFINER helper
-- functions in a private schema that bypass RLS for membership lookups.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.user_workspace_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT workspace_id FROM public.workspace_memberships WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION private.user_workspace_role(p_workspace_id uuid)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.workspace_memberships
  WHERE workspace_id = p_workspace_id AND user_id = auth.uid()
  LIMIT 1;
$$;

-- Drop old self-referencing policies
DROP POLICY IF EXISTS "Members can view workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Admins can update workspace" ON public.workspaces;
DROP POLICY IF EXISTS "Owners can delete workspace" ON public.workspaces;

DROP POLICY IF EXISTS "Members can view workspace members" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Admins can add members" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Owners can update member roles" ON public.workspace_memberships;
DROP POLICY IF EXISTS "Admins can remove members" ON public.workspace_memberships;

DROP POLICY IF EXISTS "Members can view teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can create teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can update teams" ON public.teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON public.teams;

-- Recreate all policies using private helper functions

CREATE POLICY "Members can view workspace" ON public.workspaces FOR SELECT
  USING (id IN (SELECT private.user_workspace_ids()));

CREATE POLICY "Admins can update workspace" ON public.workspaces FOR UPDATE
  USING (private.user_workspace_role(id) IN ('owner', 'admin'));

CREATE POLICY "Owners can delete workspace" ON public.workspaces FOR DELETE
  USING (private.user_workspace_role(id) = 'owner');

CREATE POLICY "Members can view workspace members" ON public.workspace_memberships FOR SELECT
  USING (workspace_id IN (SELECT private.user_workspace_ids()));

CREATE POLICY "Admins can add members" ON public.workspace_memberships FOR INSERT
  WITH CHECK (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Owners can update member roles" ON public.workspace_memberships FOR UPDATE
  USING (private.user_workspace_role(workspace_id) = 'owner');

CREATE POLICY "Admins can remove members" ON public.workspace_memberships FOR DELETE
  USING (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Members can view teams" ON public.teams FOR SELECT
  USING (workspace_id IN (SELECT private.user_workspace_ids()));

CREATE POLICY "Admins can create teams" ON public.teams FOR INSERT
  WITH CHECK (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can update teams" ON public.teams FOR UPDATE
  USING (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can delete teams" ON public.teams FOR DELETE
  USING (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));
