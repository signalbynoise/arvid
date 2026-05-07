-- Add short_id columns to workspaces and teams for coherent W01/T01 identifiers.

ALTER TABLE public.workspaces ADD COLUMN short_id text;
ALTER TABLE public.teams ADD COLUMN short_id text;

CREATE INDEX workspaces_short_id_idx ON public.workspaces (short_id) WHERE is_deleted = false;
CREATE INDEX teams_short_id_idx ON public.teams (short_id, workspace_id) WHERE is_deleted = false;

-- Populate existing rows
DO $$
DECLARE
  ws RECORD;
  tm RECORD;
  ws_counter integer;
  tm_counter integer;
  uid uuid;
BEGIN
  FOR uid IN SELECT DISTINCT created_by FROM public.workspaces WHERE is_deleted = false
  LOOP
    ws_counter := 0;
    FOR ws IN SELECT id FROM public.workspaces WHERE created_by = uid AND is_deleted = false ORDER BY created_at
    LOOP
      ws_counter := ws_counter + 1;
      UPDATE public.workspaces SET short_id = 'W' || lpad(ws_counter::text, 2, '0') WHERE id = ws.id;
    END LOOP;
  END LOOP;

  FOR ws IN SELECT id FROM public.workspaces WHERE is_deleted = false
  LOOP
    tm_counter := 0;
    FOR tm IN SELECT id FROM public.teams WHERE workspace_id = ws.id AND is_deleted = false ORDER BY created_at
    LOOP
      tm_counter := tm_counter + 1;
      UPDATE public.teams SET short_id = 'T' || lpad(tm_counter::text, 2, '0') WHERE id = tm.id;
    END LOOP;
  END LOOP;
END $$;
