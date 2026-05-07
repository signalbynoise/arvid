-- Migration: Add workspaces > teams > projects hierarchy
-- Phase 1: Structural changes (tables, indexes, RLS)
-- Phase 6 (separate migration): data migration for existing users

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

CREATE TABLE public.workspace_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz
);

ALTER TABLE public.projects
  ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  ADD COLUMN team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN deleted_at timestamptz;

-- ============================================================
-- Partial unique indexes (soft-delete aware)
-- ============================================================

CREATE UNIQUE INDEX workspaces_slug_active_unique
  ON public.workspaces (slug) WHERE is_deleted = false;

CREATE UNIQUE INDEX teams_workspace_slug_active_unique
  ON public.teams (workspace_id, slug) WHERE is_deleted = false;

CREATE UNIQUE INDEX projects_workspace_name_active_unique
  ON public.projects (workspace_id, name) WHERE is_deleted = false;

-- ============================================================
-- Performance indexes
-- ============================================================

CREATE INDEX workspace_memberships_user_id_idx
  ON public.workspace_memberships (user_id);

CREATE INDEX workspace_memberships_workspace_id_idx
  ON public.workspace_memberships (workspace_id);

CREATE INDEX teams_workspace_id_active_idx
  ON public.teams (workspace_id) WHERE is_deleted = false;

CREATE INDEX projects_workspace_id_active_idx
  ON public.projects (workspace_id) WHERE is_deleted = false;

CREATE INDEX projects_team_id_active_idx
  ON public.projects (team_id) WHERE is_deleted = false;

-- ============================================================
-- Enable RLS
-- ============================================================

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS Policies: workspaces
-- ============================================================

CREATE POLICY "Members can view workspace"
  ON public.workspaces FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm
    WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can update workspace"
  ON public.workspaces FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm
    WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Owners can delete workspace"
  ON public.workspaces FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm
    WHERE wm.workspace_id = workspaces.id AND wm.user_id = auth.uid()
    AND wm.role = 'owner'
  ));

-- ============================================================
-- RLS Policies: workspace_memberships
-- Subqueries on the same table do not trigger recursive RLS
-- evaluation in PostgreSQL.
-- ============================================================

CREATE POLICY "Members can view workspace members"
  ON public.workspace_memberships FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm2
    WHERE wm2.workspace_id = workspace_memberships.workspace_id
    AND wm2.user_id = auth.uid()
  ));

CREATE POLICY "Admins can add members"
  ON public.workspace_memberships FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm2
    WHERE wm2.workspace_id = workspace_memberships.workspace_id
    AND wm2.user_id = auth.uid()
    AND wm2.role IN ('owner', 'admin')
  ));

CREATE POLICY "Owners can update member roles"
  ON public.workspace_memberships FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm2
    WHERE wm2.workspace_id = workspace_memberships.workspace_id
    AND wm2.user_id = auth.uid()
    AND wm2.role = 'owner'
  ));

CREATE POLICY "Admins can remove members"
  ON public.workspace_memberships FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm2
    WHERE wm2.workspace_id = workspace_memberships.workspace_id
    AND wm2.user_id = auth.uid()
    AND wm2.role IN ('owner', 'admin')
  ));

-- ============================================================
-- RLS Policies: teams
-- ============================================================

CREATE POLICY "Members can view teams"
  ON public.teams FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm
    WHERE wm.workspace_id = teams.workspace_id AND wm.user_id = auth.uid()
  ));

CREATE POLICY "Admins can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm
    WHERE wm.workspace_id = teams.workspace_id AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can update teams"
  ON public.teams FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm
    WHERE wm.workspace_id = teams.workspace_id AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));

CREATE POLICY "Admins can delete teams"
  ON public.teams FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.workspace_memberships wm
    WHERE wm.workspace_id = teams.workspace_id AND wm.user_id = auth.uid()
    AND wm.role IN ('owner', 'admin')
  ));
