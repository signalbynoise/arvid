-- Workspace invitations: pending email-based invites with expiration.

CREATE TABLE public.workspace_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'member')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days'
);

CREATE UNIQUE INDEX workspace_invitations_pending_unique
  ON public.workspace_invitations (workspace_id, email) WHERE status = 'pending';

CREATE INDEX workspace_invitations_email_pending_idx
  ON public.workspace_invitations (email) WHERE status = 'pending';

CREATE INDEX workspace_invitations_workspace_id_idx
  ON public.workspace_invitations (workspace_id);

ALTER TABLE public.workspace_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace invitations"
  ON public.workspace_invitations FOR SELECT
  USING (workspace_id IN (SELECT private.user_workspace_ids()));

CREATE POLICY "Admins can create invitations"
  ON public.workspace_invitations FOR INSERT
  WITH CHECK (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can update invitations"
  ON public.workspace_invitations FOR UPDATE
  USING (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));

CREATE POLICY "Admins can delete invitations"
  ON public.workspace_invitations FOR DELETE
  USING (private.user_workspace_role(workspace_id) IN ('owner', 'admin'));
