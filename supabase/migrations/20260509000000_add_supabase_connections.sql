-- Migration: Add Supabase Management API integration tables
-- Stores OAuth tokens for connecting to user's Supabase projects
-- and caches their database schema for AI context

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.supabase_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supabase_org_id text,
  supabase_org_name text,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  scopes text NOT NULL DEFAULT 'database:read,projects:read,organizations:read,edge_functions:read',
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE public.db_contexts (
  id text PRIMARY KEY,
  project_id text NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  supabase_project_ref text NOT NULL,
  tables jsonb NOT NULL DEFAULT '[]',
  relationships jsonb NOT NULL DEFAULT '[]',
  functions jsonb NOT NULL DEFAULT '[]',
  edge_functions jsonb NOT NULL DEFAULT '[]',
  analysis jsonb,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fetching', 'ready', 'error')),
  error_message text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id)
);

-- Add Supabase project ref to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS supabase_project_ref text,
  ADD COLUMN IF NOT EXISTS supabase_connected_at timestamptz;

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX supabase_connections_user_id_idx
  ON public.supabase_connections (user_id);

CREATE INDEX db_contexts_project_id_idx
  ON public.db_contexts (project_id);

CREATE INDEX db_contexts_status_idx
  ON public.db_contexts (status);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.supabase_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.db_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY supabase_connections_user_policy ON public.supabase_connections
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY db_contexts_workspace_policy ON public.db_contexts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = db_contexts.project_id
        AND (
          p.user_id = auth.uid()
          OR p.workspace_id IN (SELECT private.user_workspace_ids())
        )
    )
  );
