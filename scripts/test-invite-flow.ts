import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { createElement } from 'react';
import { render } from '@react-email/components';
import { InviteEmail } from '../server/emails/InviteEmail';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;
const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || 'Arvid <arvid@arvid.work>';
const APP_ORIGIN = process.env.APP_ORIGIN || 'http://localhost:5173';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const resend = new Resend(RESEND_API_KEY);

const TARGET_EMAIL = 'erik@arvid.work';

async function removeUser() {
  console.log('--- Step 1: Remove erik@arvid.work ---');

  const { data: users } = await supabase.auth.admin.listUsers();
  const target = users?.users.find(u => u.email === TARGET_EMAIL);

  if (!target) {
    console.log(`User ${TARGET_EMAIL} not found — already clean`);
  } else {
    const uid = target.id;
    console.log(`Found user ${uid}, cleaning references...`);

    // Remove memberships and related data that reference this user
    for (const table of ['project_memberships', 'team_memberships', 'workspace_memberships', 'user_subscriptions']) {
      const { error } = await supabase.from(table).delete().eq('user_id', uid);
      if (error) console.log(`  ${table}: ${error.message}`);
      else console.log(`  ${table}: cleaned`);
    }

    // Remove invitations they sent
    await supabase.from('workspace_invitations').delete().eq('invited_by', uid);

    // Now delete the auth user
    const { error: delErr } = await supabase.auth.admin.deleteUser(uid);
    if (delErr) {
      console.error('Delete failed:', delErr.message);
    } else {
      console.log('User deleted from auth');
    }
  }

  // Clean up any pending invitations FOR this email
  await supabase.from('workspace_invitations').delete().eq('email', TARGET_EMAIL);
  console.log('Cleaned pending invitations\n');
}

async function findTestData() {
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(1)
    .single();
  if (!workspace) throw new Error('No workspace found');

  const { data: team } = await supabase
    .from('teams')
    .select('id, name')
    .eq('workspace_id', workspace.id)
    .limit(1)
    .single();

  const { data: project } = await supabase
    .from('projects')
    .select('id, name')
    .limit(1)
    .single();

  return { workspace, team, project };
}

async function sendInvite(opts: {
  scope: 'workspace' | 'team' | 'project';
  workspaceName: string;
  scopeName?: string;
}) {
  const inviteUrl = `${APP_ORIGIN}?invite=1`;

  const html = await render(
    createElement(InviteEmail, {
      url: inviteUrl,
      inviterEmail: 'erik.lydecker@gmail.com',
      workspaceName: opts.workspaceName,
      scope: opts.scope,
      scopeName: opts.scopeName,
    }),
  );

  const subject = opts.scope === 'workspace'
    ? `You've been invited to ${opts.workspaceName} on Arvid`
    : `You've been invited to ${opts.scopeName ?? opts.scope} in ${opts.workspaceName} on Arvid`;

  console.log(`[${opts.scope}] Sending to ${TARGET_EMAIL}...`);

  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: [TARGET_EMAIL],
    subject,
    html,
    text: `${subject}\n\nAccept: ${inviteUrl}`,
  });

  if (error) console.error(`[${opts.scope}] Error:`, error);
  else console.log(`[${opts.scope}] Sent! ID: ${data?.id}`);
}

async function main() {
  await removeUser();

  console.log('--- Step 2: Find test data ---');
  const { workspace, team, project } = await findTestData();
  console.log(`Workspace: ${workspace.name}`);
  console.log(`Team: ${team?.name ?? 'none'}`);
  console.log(`Project: ${project?.name ?? 'none'}\n`);

  // Find an existing user to be the "inviter"
  const { data: allUsers } = await supabase.auth.admin.listUsers();
  const inviter = allUsers?.users.find(u => u.email !== TARGET_EMAIL);
  if (!inviter) throw new Error('No inviter user found');

  console.log('--- Step 3: Create invitation rows ---');
  const rows: Record<string, unknown>[] = [
    { workspace_id: workspace.id, email: TARGET_EMAIL, role: 'member', scope: 'workspace', invited_by: inviter.id },
  ];
  if (team) {
    rows.push({ workspace_id: workspace.id, email: TARGET_EMAIL, role: 'member', scope: 'team', team_id: team.id, invited_by: inviter.id });
  }
  if (project) {
    rows.push({ workspace_id: workspace.id, email: TARGET_EMAIL, role: 'member', scope: 'project', project_id: project.id, invited_by: inviter.id });
  }

  const { error: insertErr } = await supabase.from('workspace_invitations').insert(rows);
  if (insertErr) console.error('Insert failed:', insertErr.message);
  else console.log(`Created ${rows.length} invitation row(s)\n`);

  console.log('--- Step 4: Send branded emails ---\n');

  await sendInvite({ scope: 'workspace', workspaceName: workspace.name });
  if (team) await sendInvite({ scope: 'team', workspaceName: workspace.name, scopeName: team.name });
  if (project) await sendInvite({ scope: 'project', workspaceName: workspace.name, scopeName: project.name });

  console.log('\n--- Ready to test! ---');
  console.log(`1. erik@arvid.work has NO Arvid account`);
  console.log(`2. 3 pending invitations exist in the DB`);
  console.log(`3. Check inbox → click "Accept Invitation"`);
  console.log(`4. Lands at ${APP_ORIGIN}?invite=1 → redirect to /login?invite=1`);
  console.log(`5. See invite banner, create account, boot accepts invitations`);
}

main().catch(console.error);
