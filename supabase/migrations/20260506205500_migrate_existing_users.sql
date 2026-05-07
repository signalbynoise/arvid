-- Data migration: Create personal workspaces and teams for existing users
-- and re-parent existing projects under the new hierarchy.

DO $$
DECLARE
  rec RECORD;
  ws_id uuid;
  team_id uuid;
BEGIN
  FOR rec IN
    SELECT DISTINCT user_id FROM public.projects WHERE user_id IS NOT NULL
  LOOP
    INSERT INTO public.workspaces (name, slug, created_by)
    VALUES ('My Workspace', 'my-workspace-' || left(rec.user_id::text, 8), rec.user_id)
    RETURNING id INTO ws_id;

    INSERT INTO public.workspace_memberships (workspace_id, user_id, role)
    VALUES (ws_id, rec.user_id, 'owner');

    INSERT INTO public.teams (workspace_id, name, slug, created_by)
    VALUES (ws_id, 'General', 'general', rec.user_id)
    RETURNING id INTO team_id;

    UPDATE public.projects
    SET workspace_id = ws_id, team_id = team_id
    WHERE user_id = rec.user_id
      AND workspace_id IS NULL;
  END LOOP;
END $$;
