import { supabaseAdmin } from '../supabase';

const TABLES_TO_DELETE_BY_USER_ID = [
  'card_assignees',
  'project_memberships',
  'team_memberships',
  'workspace_memberships',
  'db_contexts',
  'user_subscriptions',
];

const TABLES_TO_NULLIFY_CREATED_BY = [
  'requirements',
  'questions',
  'answers',
  'articles',
];

const INTEGRATION_TABLES = [
  'github_connections',
  'linear_connections',
  'slack_connections',
  'supabase_connections',
  'figma_connections',
  'render_connections',
];

export async function runAccountDeletions(): Promise<{ processed: number; deleted: number; errors: number }> {
  console.info('[INFO] [accountDeletion] Checking for pending account deletions');

  const { data: pending, error: fetchError } = await supabaseAdmin
    .from('account_deletions')
    .select('*')
    .eq('status', 'pending')
    .lt('delete_after', new Date().toISOString());

  if (fetchError) {
    console.error('[ERROR] [accountDeletion] Failed to fetch pending deletions', JSON.stringify({ error: fetchError.message }));
    return { processed: 0, deleted: 0, errors: 1 };
  }

  if (!pending || pending.length === 0) {
    console.info('[INFO] [accountDeletion] No pending deletions to process');
    return { processed: 0, deleted: 0, errors: 0 };
  }

  let deleted = 0;
  let errors = 0;

  for (const deletion of pending) {
    const { user_id: userId, email } = deletion;
    console.info('[INFO] [accountDeletion] Processing deletion', JSON.stringify({ userId, email }));

    try {
      for (const table of TABLES_TO_NULLIFY_CREATED_BY) {
        const { error } = await supabaseAdmin
          .from(table)
          .update({ created_by: null })
          .eq('created_by', userId);
        if (error) {
          console.warn(`[WARN] [accountDeletion] Nullify ${table}.created_by failed`, JSON.stringify({ error: error.message }));
        } else {
          console.debug(`[DEBUG] [accountDeletion] Nullified ${table}.created_by`);
        }
      }

      await supabaseAdmin
        .from('workspaces')
        .update({ created_by: null })
        .eq('created_by', userId);

      await supabaseAdmin
        .from('document_uploads')
        .update({ uploaded_by: null })
        .eq('uploaded_by', userId);

      await supabaseAdmin
        .from('workspace_invitations')
        .delete()
        .eq('invited_by', userId);

      for (const table of INTEGRATION_TABLES) {
        const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
        if (error) {
          console.warn(`[WARN] [accountDeletion] Delete ${table} failed`, JSON.stringify({ error: error.message }));
        }
      }

      for (const table of TABLES_TO_DELETE_BY_USER_ID) {
        const { error } = await supabaseAdmin.from(table).delete().eq('user_id', userId);
        if (error) {
          console.warn(`[WARN] [accountDeletion] Delete ${table} failed`, JSON.stringify({ error: error.message }));
        }
      }

      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId, true);
      if (authError) {
        console.error('[ERROR] [accountDeletion] Auth user deletion failed', JSON.stringify({ userId, error: authError.message }));
        errors++;
        continue;
      }

      await supabaseAdmin
        .from('account_deletions')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', deletion.id);

      deleted++;
      console.info('[INFO] [accountDeletion] Account deleted successfully', JSON.stringify({ userId, email }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ERROR] [accountDeletion] Unexpected error', JSON.stringify({ userId, error: message }));
      errors++;
    }
  }

  return { processed: pending.length, deleted, errors };
}
