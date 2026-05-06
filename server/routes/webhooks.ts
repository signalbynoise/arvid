import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { supabase } from '../supabase';
import { classifyImplementation } from '../openrouter';
import type { RepoAnalysis } from '../../shared/schemas/repoContext';

export const webhooksRouter = Router();

function verifyLinearSignature(signature: string | undefined, rawBody: Buffer): boolean {
  const secret = process.env.LINEAR_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const computed = createHmac('sha256', secret).update(rawBody).digest();
  const provided = Buffer.from(signature, 'hex');

  if (computed.length !== provided.length) return false;
  return timingSafeEqual(computed, provided);
}

webhooksRouter.post('/linear', async (req: Request, res: Response) => {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  if (!rawBody) {
    console.error('[ERROR] [webhooks:linear] Missing raw body for signature verification');
    return res.sendStatus(400);
  }

  const signature = req.get('linear-signature');
  if (!verifyLinearSignature(signature, rawBody)) {
    console.error('[ERROR] [webhooks:linear] Invalid signature');
    return res.sendStatus(401);
  }

  const { action, type, data, webhookTimestamp } = req.body;

  if (Math.abs(Date.now() - webhookTimestamp) > 60_000) {
    console.error('[ERROR] [webhooks:linear] Stale webhook timestamp');
    return res.sendStatus(401);
  }

  if (type !== 'Issue' || action !== 'update') {
    return res.sendStatus(200);
  }

  const linearIssueId = data?.id;
  const stateName = data?.state?.name;
  const stateType = data?.state?.type;

  if (!linearIssueId || !stateName) {
    return res.sendStatus(200);
  }

  console.info('[INFO] [webhooks:linear] Issue status update received', JSON.stringify({
    linearIssueId,
    stateName,
    stateType,
  }));

  const { error } = await supabase
    .from('requirements')
    .update({
      linear_status: stateName,
      linear_status_type: stateType ?? null,
    })
    .eq('linear_issue_id', linearIssueId);

  if (error) {
    console.error('[ERROR] [webhooks:linear] Failed to update requirement', JSON.stringify({ error: error.message }));
    return res.sendStatus(500);
  }

  if (stateType === 'completed') {
    checkImplementationAsync(linearIssueId).catch(err => {
      console.error(
        '[ERROR] [webhooks:implCheck] Async implementation check failed',
        JSON.stringify({ linearIssueId, error: err instanceof Error ? err.message : 'Unknown error' }),
      );
    });
  }

  res.sendStatus(200);
});

async function checkImplementationAsync(linearIssueId: string): Promise<void> {
  console.info(
    '[INFO] [webhooks:implCheck] Starting async implementation check',
    JSON.stringify({ linearIssueId }),
  );

  const { data: requirement } = await supabase
    .from('requirements')
    .select('*')
    .eq('linear_issue_id', linearIssueId)
    .single();

  if (!requirement) {
    console.warn('[WARN] [webhooks:implCheck] Requirement not found for linear issue', JSON.stringify({ linearIssueId }));
    return;
  }

  if (!requirement.project_id) {
    console.info('[INFO] [webhooks:implCheck] No project_id on requirement, setting No Repo', JSON.stringify({ requirementId: requirement.id }));
    await supabase
      .from('requirements')
      .update({ impl_status: 'No Repo', impl_confidence: null, impl_checked_at: new Date().toISOString() })
      .eq('id', requirement.id);
    return;
  }

  const { data: project, error: projError } = await supabase
    .from('projects')
    .select('github_repo_full_name')
    .eq('id', requirement.project_id)
    .single();

  if (projError) {
    console.error('[ERROR] [webhooks:implCheck] Failed to load project', JSON.stringify({ projectId: requirement.project_id, error: projError.message }));
  }

  if (!project?.github_repo_full_name) {
    console.info('[INFO] [webhooks:implCheck] No GitHub repo linked to project, setting No Repo', JSON.stringify({ requirementId: requirement.id, projectId: requirement.project_id, project }));
    await supabase
      .from('requirements')
      .update({ impl_status: 'No Repo', impl_confidence: null, impl_checked_at: new Date().toISOString() })
      .eq('id', requirement.id);
    return;
  }

  const { data: repoCtx, error: repoError } = await supabase
    .from('repo_contexts')
    .select('*')
    .eq('project_id', requirement.project_id)
    .single();

  if (repoError) {
    console.error('[ERROR] [webhooks:implCheck] Failed to load repo context', JSON.stringify({ projectId: requirement.project_id, error: repoError.message }));
  }

  if (!repoCtx || repoCtx.status !== 'ready') {
    console.info('[INFO] [webhooks:implCheck] Repo context not ready, setting Unknown', JSON.stringify({ requirementId: requirement.id, status: repoCtx?.status }));
    await supabase
      .from('requirements')
      .update({ impl_status: 'Unknown', impl_confidence: 0.1, impl_checked_at: new Date().toISOString() })
      .eq('id', requirement.id);
    return;
  }

  const { data: dbQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('requirement_id', requirement.id);

  const questionIds = (dbQuestions || []).map((q: { id: string }) => q.id);
  let dbAnswers: Array<{ question_id: string; text: string; author: string }> = [];
  if (questionIds.length > 0) {
    const { data: ansData } = await supabase
      .from('answers')
      .select('question_id, text, author')
      .in('question_id', questionIds);
    dbAnswers = ansData || [];
  }

  const questions = (dbQuestions || [])
    .filter((q: { is_hidden: boolean | null }) => !q.is_hidden)
    .map((q: { id: string; text: string; status: string }) => ({
      text: q.text,
      status: q.status,
      answers: dbAnswers
        .filter(a => a.question_id === q.id)
        .map(a => ({ text: a.text, author: a.author })),
    }));

  try {
    const result = await classifyImplementation({
      requirementTitle: requirement.title,
      requirementDescription: requirement.description ?? undefined,
      questions,
      repoContext: {
        fileTree: repoCtx.file_tree || [],
        keyFiles: repoCtx.key_files || {},
        recentCommits: repoCtx.recent_commits || [],
        analysis: repoCtx.analysis as RepoAnalysis | null,
      },
    });

    await supabase
      .from('requirements')
      .update({
        impl_status: result.status,
        impl_confidence: result.confidence,
        impl_checked_at: new Date().toISOString(),
      })
      .eq('id', requirement.id);

    console.info(
      '[INFO] [webhooks:implCheck] Check complete',
      JSON.stringify({ requirementId: requirement.id, status: result.status, confidence: result.confidence }),
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [webhooks:implCheck] Classification failed, setting Unknown',
      JSON.stringify({ requirementId: requirement.id, error: message }),
    );

    await supabase
      .from('requirements')
      .update({ impl_status: 'Unknown', impl_confidence: 0.0, impl_checked_at: new Date().toISOString() })
      .eq('id', requirement.id);
  }
}
