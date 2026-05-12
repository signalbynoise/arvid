import { Router } from 'express';
import { createUserClient, supabase, supabaseAdmin } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateRequirementBodySchema, UpdateRequirementBodySchema } from '../../shared/schemas';
import { enhanceRequirement, classifyImplementation } from '../openrouter';
import type { FigmaDesignContext } from '../openrouter';
import { computeAccordanceScore } from '../../shared/schemas/implCheck';
import type { RepoAnalysis, FileTreeEntry, CommitEntry } from '../../shared/schemas/repoContext';
import type { DbAnalysis } from '../../shared/schemas/dbContext';
import { parseFigmaUrl } from '../../shared/figmaUrl';
import { getFileNodes, getImages, extractDesignSummary } from '../lib/figmaClient';
import { GitHubClient } from '../lib/githubClient';
import { analyzeRepo } from '../analysis/repoAnalyzer';
import { generateShortId } from '../lib/shortId';
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
  const figmaLinks: string[] | undefined = req.body.figma_links;
  const shortId = await generateShortId(db, 'requirements', 'R');

  const { figma_links: _stripFigma, ...insertBody } = req.body;
  const { data, error } = await db
    .from('requirements')
    .insert({ ...insertBody, short_id: shortId, created_at: req.body.created_at || new Date().toISOString(), created_by: req.user!.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  if (Array.isArray(figmaLinks) && figmaLinks.length > 0) {
    persistFigmaLinks(data.id, figmaLinks, req.user!.id, req.accessToken!);
  }

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

function enrichFigmaLinks(requirementId: string, figmaLinks: string[], userId: string): void {
  (async () => {
    try {
      const { data: connection } = await supabaseAdmin
        .from('figma_connections')
        .select('access_token')
        .eq('user_id', userId)
        .single();

      if (!connection) {
        console.warn('[WARN] [requirements:enrichFigmaLinks] No Figma connection found', JSON.stringify({ userId }));
        return;
      }

      const grouped = new Map<string, Array<{ url: string; nodeId: string | null }>>();
      for (const url of figmaLinks) {
        const parsed = parseFigmaUrl(url);
        if (!parsed) continue;
        const group = grouped.get(parsed.fileKey) || [];
        group.push({ url, nodeId: parsed.nodeId });
        grouped.set(parsed.fileKey, group);
      }

      for (const [fileKey, entries] of grouped) {
        const nodeIds = entries.map(e => e.nodeId).filter((id): id is string => id !== null);
        if (nodeIds.length === 0) continue;

        const [nodesRes, imagesRes] = await Promise.all([
          getFileNodes(connection.access_token, fileKey, nodeIds),
          getImages(connection.access_token, fileKey, nodeIds),
        ]);

        for (const entry of entries) {
          const nodeData = entry.nodeId ? nodesRes.nodes[entry.nodeId] : null;
          const thumbnailUrl = entry.nodeId ? imagesRes.images[entry.nodeId] ?? null : null;

          if (nodeData?.document || thumbnailUrl) {
            await supabaseAdmin
              .from('requirement_figma_links')
              .update({
                node_name: nodeData?.document?.name ?? null,
                thumbnail_url: thumbnailUrl,
                structural_summary: nodeData?.document ? extractDesignSummary(nodeData.document) : null,
                fetched_at: new Date().toISOString(),
              })
              .eq('requirement_id', requirementId)
              .eq('figma_url', entry.url);
          }
        }
      }

      console.info(
        '[INFO] [requirements:enrichFigmaLinks] Figma links enriched',
        JSON.stringify({ requirementId, linkCount: figmaLinks.length }),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(
        '[ERROR] [requirements:enrichFigmaLinks] Enrichment failed',
        JSON.stringify({ requirementId, error: message }),
      );
    }
  })();
}

function persistFigmaLinks(requirementId: string, figmaLinks: string[], userId: string, accessToken: string): void {
  (async () => {
    const db = createUserClient(accessToken);

    for (const url of figmaLinks) {
      const parsed = parseFigmaUrl(url);
      if (!parsed) continue;

      const { error: insertError } = await db
        .from('requirement_figma_links')
        .insert({
          requirement_id: requirementId,
          figma_url: url,
          file_key: parsed.fileKey,
          node_id: parsed.nodeId,
        });

      if (insertError) {
        console.error(
          '[ERROR] [requirements:persistFigmaLinks] Insert failed',
          JSON.stringify({ requirementId, url, error: insertError.message }),
        );
        continue;
      }
    }

    enrichFigmaLinks(requirementId, figmaLinks, userId);
  })();
}

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

// --- Figma design links for a requirement ---

requirementsRouter.get('/:id/figma-links', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('requirement_figma_links')
    .select('*')
    .eq('requirement_id', req.params.id)
    .order('created_at', { ascending: true });

  if (error) return res.status(400).json({ error: error.message });
  res.json(data ?? []);
});

requirementsRouter.post('/:id/figma-links', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { figma_url } = req.body as { figma_url?: string };

  if (!figma_url || typeof figma_url !== 'string') {
    return res.status(400).json({ error: 'figma_url is required' });
  }

  const parsed = parseFigmaUrl(figma_url);
  if (!parsed) {
    return res.status(400).json({ error: 'Invalid Figma URL' });
  }

  const { data, error } = await db
    .from('requirement_figma_links')
    .insert({
      requirement_id: req.params.id,
      figma_url,
      file_key: parsed.fileKey,
      node_id: parsed.nodeId,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  enrichFigmaLinks(req.params.id, [figma_url], req.user!.id);

  res.status(201).json(data);
});

requirementsRouter.delete('/:id/figma-links/:linkId', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { error } = await db
    .from('requirement_figma_links')
    .delete()
    .eq('id', req.params.linkId)
    .eq('requirement_id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.json({ deleted: true });
});

requirementsRouter.post('/enhance', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { text, project_id, figma_links } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required and must be at least 3 characters' });
  }

  try {
    let context: { projectName?: string; existingRequirements?: string[]; repoContext?: RepoAnalysis; dbContext?: DbAnalysis; figmaDesigns?: FigmaDesignContext[] } | undefined;

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

    if (Array.isArray(figma_links) && figma_links.length > 0) {
      const figmaDesigns = await resolveFigmaDesignsForAI(req.user!.id, figma_links);
      if (figmaDesigns.length > 0) {
        context = { ...context, figmaDesigns };
        console.info(
          '[INFO] [requirements:enhance] Figma designs loaded',
          JSON.stringify({ designCount: figmaDesigns.length }),
        );
      }
    }

    const result = await enhanceRequirement(text.trim(), context);
    res.json({ title: result.title, description: result.description });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [requirements:enhance] Enhancement failed', JSON.stringify({ error: message }));
    res.status(500).json({ error: `Enhancement failed: ${message}` });
  }
});

async function resolveFigmaDesignsForAI(userId: string, figmaLinks: string[]): Promise<FigmaDesignContext[]> {
  const { data: connection } = await supabase
    .from('figma_connections')
    .select('access_token')
    .eq('user_id', userId)
    .single();

  if (!connection) return [];

  const designs: FigmaDesignContext[] = [];

  const grouped = new Map<string, Array<{ nodeId: string | null }>>();
  for (const url of figmaLinks) {
    const parsed = parseFigmaUrl(url);
    if (!parsed) continue;
    const group = grouped.get(parsed.fileKey) || [];
    group.push({ nodeId: parsed.nodeId });
    grouped.set(parsed.fileKey, group);
  }

  for (const [fileKey, entries] of grouped) {
    const nodeIds = entries.map(e => e.nodeId).filter((id): id is string => id !== null);
    if (nodeIds.length === 0) continue;

    try {
      const nodesRes = await getFileNodes(connection.access_token, fileKey, nodeIds);

      for (const entry of entries) {
        const nodeData = entry.nodeId ? nodesRes.nodes[entry.nodeId] : null;
        if (!nodeData?.document) continue;

        designs.push({
          nodeName: nodeData.document.name,
          structuralSummary: extractDesignSummary(nodeData.document),
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.warn(
        '[WARN] [requirements:resolveFigmaDesignsForAI] Failed to fetch Figma data',
        JSON.stringify({ fileKey, error: message }),
      );
    }
  }

  return designs;
}

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

  const { data: projectFull } = await db
    .from('projects')
    .select('github_repo_default_branch, user_id')
    .eq('id', requirement.project_id)
    .single();

  const branch = projectFull?.github_repo_default_branch || 'main';

  const { data: ghConnection } = await supabase
    .from('github_connections')
    .select('access_token')
    .eq('user_id', projectFull?.user_id ?? '')
    .single();

  if (ghConnection?.access_token) {
    console.info('[INFO] [requirements:checkImplementation] Refreshing repo context from GitHub', JSON.stringify({ projectId: requirement.project_id }));
    try {
      const ghClient = new GitHubClient({ token: ghConnection.access_token });
      const [owner, repo] = project.github_repo_full_name.split('/');

      const treeData = await ghClient.request<{
        tree: Array<{ path: string; type: string; size?: number }>;
      }>(`/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

      const fileTree: FileTreeEntry[] = treeData.tree.map(item => ({
        path: item.path,
        type: item.type === 'tree' ? 'tree' : 'blob',
        size: item.size,
      }));

      const commitsData = await ghClient.request<Array<{
        sha: string;
        commit: { message: string; author: { name: string; date: string } };
      }>>(`/repos/${owner}/${repo}/commits?per_page=50&sha=${branch}`);

      const recentCommits: CommitEntry[] = commitsData.map(c => ({
        sha: c.sha,
        message: c.commit.message.split('\n')[0],
        author: c.commit.author.name,
        date: c.commit.author.date,
      }));

      const contextId = `rc-${requirement.project_id}`;
      const existingKeyFiles = (await supabase
        .from('repo_contexts')
        .select('key_files')
        .eq('project_id', requirement.project_id)
        .single()).data?.key_files || {};

      const repoAnalysis = analyzeRepo(fileTree, existingKeyFiles, recentCommits);

      const upsertHierarchy = fileTree
        .filter(f => f.path.includes('workspace') || f.path.includes('team'))
        .map(f => f.path);
      console.debug(
        '[DEBUG] [requirements:checkImplementation] About to upsert file_tree',
        JSON.stringify({
          projectId: requirement.project_id,
          totalEntries: fileTree.length,
          hierarchyFiles: upsertHierarchy,
        }),
      );

      const { error: upsertErr } = await supabase
        .from('repo_contexts')
        .upsert({
          id: contextId,
          project_id: requirement.project_id,
          user_id: req.user!.id,
          file_tree: fileTree,
          recent_commits: recentCommits,
          analysis: repoAnalysis,
          status: 'ready',
          fetched_at: new Date().toISOString(),
        }, { onConflict: 'project_id' });

      if (upsertErr) {
        console.error('[ERROR] [requirements:checkImplementation] Upsert failed', JSON.stringify({ error: upsertErr }));
      }

      console.info('[INFO] [requirements:checkImplementation] Repo context refreshed', JSON.stringify({ projectId: requirement.project_id, files: fileTree.length, commits: recentCommits.length }));
    } catch (refreshErr) {
      console.warn('[WARN] [requirements:checkImplementation] Failed to refresh repo context, using cached version', JSON.stringify({ error: refreshErr instanceof Error ? refreshErr.message : 'Unknown' }));
    }
  }

  const { data: repoCtx } = await db
    .from('repo_contexts')
    .select('*')
    .eq('project_id', requirement.project_id)
    .single();

  const dbFileTree = repoCtx?.file_tree || [];
  const dbHierarchy = dbFileTree
    .filter((f: FileTreeEntry) => f.path.includes('workspace') || f.path.includes('team'))
    .map((f: FileTreeEntry) => f.path);
  console.debug(
    '[DEBUG] [requirements:checkImplementation] DB file_tree read',
    JSON.stringify({
      requirementId,
      totalEntries: dbFileTree.length,
      hierarchyFiles: dbHierarchy,
    }),
  );

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

  console.debug(
    '[DEBUG] [requirements:checkImplementation] Summary context',
    JSON.stringify({
      requirementId,
      hasSummary: !!summary,
      summaryFields: summary ? {
        hasObjective: !!summary.coreObjective,
        hasArchitecture: !!summary.architecture,
        hasConstraints: !!summary.constraints,
        hasRisks: !!summary.unverifiedRisks,
      } : null,
    }),
  );

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

    console.debug(
      '[DEBUG] [requirements:checkImplementation] LLM accordance fields',
      JSON.stringify({
        requirementId,
        objective_met: result.objective_met,
        architecture_met: result.architecture_met,
        constraints_met: result.constraints_met,
        risks_addressed: result.risks_addressed,
      }),
    );

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
      JSON.stringify({
        requirementId,
        status: result.status,
        confidence: result.confidence,
        accordanceScore: implAnalysis?.accordance_score ?? null,
        accordanceDetail: implAnalysis ? {
          objective: implAnalysis.objective_met,
          architecture: implAnalysis.architecture_met,
          constraints: implAnalysis.constraints_met,
          risks: implAnalysis.risks_addressed,
        } : 'no summary available',
      }),
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
