-- The original unique index only covered (workspace_id, email) for pending
-- invitations. With scoped invitations (workspace / team / project) we need
-- to allow one pending invite per scope per email per workspace.

DROP INDEX IF EXISTS workspace_invitations_pending_unique;

CREATE UNIQUE INDEX workspace_invitations_pending_unique
  ON public.workspace_invitations (workspace_id, email, scope)
  WHERE status = 'pending';
