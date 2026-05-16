-- Migration: Add Render integration tables
-- Stores API key for connecting to user's Render account
-- and tracks deploy status per requirement

-- ============================================================
-- Tables
-- ============================================================

CREATE TABLE public.render_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  api_key text NOT NULL,
  render_owner_id text,
  render_owner_name text,
  connected_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

-- Add Render service fields to projects table
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS render_service_id text,
  ADD COLUMN IF NOT EXISTS render_service_name text,
  ADD COLUMN IF NOT EXISTS render_service_url text,
  ADD COLUMN IF NOT EXISTS render_connected_at timestamptz;

-- Add deploy status fields to requirements table
ALTER TABLE public.requirements
  ADD COLUMN IF NOT EXISTS deploy_status text CHECK (deploy_status IS NULL OR deploy_status IN ('live', 'not_deployed', 'deploy_failed', 'unknown')),
  ADD COLUMN IF NOT EXISTS deploy_url text,
  ADD COLUMN IF NOT EXISTS deploy_commit_sha text,
  ADD COLUMN IF NOT EXISTS deploy_checked_at timestamptz;

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX render_connections_user_id_idx
  ON public.render_connections (user_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.render_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY render_connections_user_policy ON public.render_connections
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all render connections"
  ON public.render_connections FOR ALL USING (true);
