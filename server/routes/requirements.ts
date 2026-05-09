import { Router } from 'express';
import { createUserClient, supabase } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateRequirementBodySchema, UpdateRequirementBodySchema } from '../../shared/schemas';
import { enhanceRequirement, classifyImplementation } from '../openrouter';
import { computeAccordanceScore } from '../../shared/schemas/implCheck';
import type { RepoAnalysis } from '../../shared/schemas/repoContext';
import type { DbAnalysis } from '../../shared/schemas/dbContext';
import { nextShortId } from '../lib/shortId';
import { sendSlackNotification } from '../lib/slackNotifier';

export const requirementsRouter = Router();

requirementsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  let query = db
    .from('requirements')
    .select('*')
    .order('created_at', { ascending: true });

  if (req.query.project_id) {
    query = query.eq('project_id', req.query.project_id as string);
  }

  if (req.query.include_deactivated !== 'true') {
    query = query.eq('is_deactivated', false);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });

  const reqIds = (data || []).map((r: { id: string }) => r.id);
  if (reqIds.length > 0) {
    const { data: summaries } = await db
      .from('summaries')
      .select('requirement_id, completeness')
      .in('requirement_id', reqIds);

    if (summaries && summaries.length > 0) {
      const completenessMap = new Map(
        summaries.map((s: { requirement_id: string; completeness: number }) => [s.requirement_id, s.completeness]),
      );
      for (const r of data!) {
        const summaryVal = completenessMap.get(r.id);
        if (summaryVal !== undefined) {
          r.completeness = summaryVal;
        }
      }
    }
  }

  res.json(data);
});

requirementsRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('requirements')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

requirementsRouter.post('/', validateBody(CreateRequirementBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const projectId = req.body.project_id;
  const shortId = projectId
    ? await nextShortId(db, 'requirements', 'R', 'project_id', projectId)
    : `R${String(Date.now()).slice(-2)}`;
  const { data, error } = await db
    .from('requirements')
    .insert({ ...req.body, short_id: shortId, created_at: req.body.created_at || new Date().toISOString(), created_by: req.user!.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (data.project_id) {
    sendSlackNotification({
      projectId: data.project_id,
      eventType: 'requirement_created',
      title: data.title,
      summary: `New requirement added to project`,
      entityId: data.id,
      db,
    });
  }

  res.status(201).json(data);
});

requirementsRouter.patch('/:id', validateBody(UpdateRequirementBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('requirements')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

requirementsRouter.post('/enhance', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { text, project_id } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required and must be at least 3 characters' });
  }

  try {
    let context: { projectName?: string; existingRequirements?: string[]; repoContext?: RepoAnalysis; dbContext?: DbAnalysis } | undefined;

    if (project_id) {
      const { data: project } = await db
        .from('projects')
        .select('name')
        .eq('id', project_id)
        .single();

      const { data: existingReqs } = await db
        .from('requirements')
        .select('title')
        .eq('project_id', project_id)
        .order('created_at', { ascending: true });

      const { data: repoCtx } = await db
        .from('repo_contexts')
        .select('analysis')
        .eq('project_id', project_id)
        .eq('status', 'ready')
        .single();

      const { data: dbCtx } = await db
        .from('db_contexts')
        .select('analysis')
        .eq('project_id', project_id)
        .eq('status', 'ready')
        .single();

      context = {
        projectName: project?.name,
        existingRequirements: (existingReqs || []).map((r: { title: string }) => r.title),
        repoContext: repoCtx?.analysis as RepoAnalysis | undefined,
        dbContext: dbCtx?.analysis as DbAnalysis | undefined,
      };

      console.info(
        '[INFO] [requirements:enhance] Context loaded',
        JSON.stringify({ projectId: project_id, projectName: context.projectName, existingCount: context.existingRequirements?.length, hasRepoContext: !!context.repoContext, hasDbContext: !!context.dbContext }),
      );
    }

    const result = await enhanceRequirement(text.trim(), context);
    res.json({ title: result.title, description: result.description });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [requirements:enhance] Enhancement failed', JSON.stringify({ error: message }));
    res.status(500).json({ error: `Enhancement failed: ${message}` });
  }
});

requirementsRouter.post('/:id/check-implementation', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const requirementId = req.params.id;

  console.info(
    '[INFO] [requirements:checkImplementation] Starting check',
    JSON.stringify({ requirementId }),
  );

  const { data: requirement, error: reqError } = await db
    .from('requirements')
    .select('*')
    .eq('id', requirementId)
    .single();

  if (reqError || !requirement) {
    return res.status(404).json({ error: 'Requirement not found' });
  }

  if (!requirement.project_id) {
    const now = new Date().toISOString();
    await supabase
      .from('requirements')
      .update({ impl_status: 'No Repo', impl_confidence: null, impl_checked_at: now })
      .eq('id', requirementId);

    return res.json({ impl_status: 'No Repo', impl_confidence: null, impl_checked_at: now });
  }

  const { data: project } = await db
    .from('projects')
    .select('github_repo_full_name')
    .eq('id', requirement.project_id)
    .single();

  if (!project?.github_repo_full_name) {
    const now = new Date().toISOString();
    await supabase
      .from('requirements')
      .update({ impl_status: 'No Repo', impl_confidence: null, impl_checked_at: now })
      .eq('id', requirementId);

    return res.json({ impl_status: 'No Repo', impl_confidence: null, impl_checked_at: now });
  }

  const { data: repoCtx } = await db
    .from('repo_contexts')
    .select('*')
    .eq('project_id', requirement.project_id)
    .single();

  if (!repoCtx || repoCtx.status !== 'ready') {
    const now = new Date().toISOString();
    await supabase
      .from('requirements')
      .update({ impl_status: 'Unknown', impl_confidence: 0.1, impl_checked_at: now })
      .eq('id', requirementId);

    return res.json({ impl_status: 'Unknown', impl_confidence: 0.1, impl_checked_at: now });
  }

  const { data: dbQuestions } = await db
    .from('questions')
    .select('*')
    .eq('requirement_id', requirementId);

  const questionIds = (dbQuestions || []).map((q: { id: string }) => q.id);
  let dbAnswers: Array<{ question_id: string; text: string; author: string }> = [];
  if (questionIds.length > 0) {
    const { data: ansData } = await db
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

  const { data: summaryRow } = await db
    .from('summaries')
    .select('core_objective, architecture, constraints, unverified_risks')
    .eq('requirement_id', requirementId)
    .single();

  const summary = summaryRow ? {
    coreObjective: summaryRow.core_objective,
    architecture: summaryRow.architecture,
    constraints: summaryRow.constraints,
    unverifiedRisks: summaryRow.unverified_risks,
  } : undefined;

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
      summary,
    });

    const implAnalysis = computeAccordanceScore(result);
    const now = new Date().toISOString();
    await supabase
      .from('requirements')
      .update({
        impl_status: result.status,
        impl_confidence: result.confidence,
        impl_checked_at: now,
        impl_evidence: result.evidence,
        impl_analysis: implAnalysis,
      })
      .eq('id', requirementId);

    console.info(
      '[INFO] [requirements:checkImplementation] Check complete',
      JSON.stringify({ requirementId, status: result.status, confidence: result.confidence, accordanceScore: implAnalysis?.accordance_score }),
    );

    res.json({ impl_status: result.status, impl_confidence: result.confidence, impl_checked_at: now, impl_evidence: result.evidence, impl_analysis: implAnalysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [requirements:checkImplementation] Check failed',
      JSON.stringify({ requirementId, error: message }),
    );

    const now = new Date().toISOString();
    await supabase
      .from('requirements')
      .update({ impl_status: 'Unknown', impl_confidence: 0.0, impl_checked_at: now })
      .eq('id', requirementId);

    res.status(500).json({ error: `Implementation check failed: ${message}` });
  }
});

requirementsRouter.patch('/:id/deactivate', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('requirements')
    .update({ is_deactivated: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

requirementsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { error } = await db
    .from('requirements')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
