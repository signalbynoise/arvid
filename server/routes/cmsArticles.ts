import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { createUserClient, supabase } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateArticleBodySchema, UpdateArticleBodySchema } from '../../shared/schemas';
import { generateArticle } from '../openrouter';
import type { GenerateArticleResult } from '../openrouter';
import type { RepoAnalysis, FileTreeEntry, CommitEntry } from '../../shared/schemas/repoContext';
import type { DbAnalysis, DbTable, DbRelationship } from '../../shared/schemas/dbContext';

import { requireSuperAdmin } from '../middleware/requireSuperAdmin';

// --- Generation job tracking ---

type GenerationJobStatus = 'pending' | 'running' | 'completed' | 'failed';

interface GenerationJob {
  id: string;
  title: string;
  type: string;
  status: GenerationJobStatus;
  result: GenerateArticleResult | null;
  error: string | null;
  createdAt: number;
}

const generationJobs = new Map<string, GenerationJob>();

const JOB_TTL_MS = 30 * 60 * 1000;

function pruneStaleJobs(): void {
  const cutoff = Date.now() - JOB_TTL_MS;
  for (const [id, job] of generationJobs) {
    if (job.createdAt < cutoff) {
      generationJobs.delete(id);
    }
  }
}

export const cmsArticlesRouter = Router();

cmsArticlesRouter.use(requireSuperAdmin);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

// --- Generate routes (must be registered before /:id catch-all) ---

cmsArticlesRouter.post('/generate', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { title, type, direction } = req.body;

  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' });
  }

  const directionText = typeof direction === 'string' ? direction.trim() : undefined;

  pruneStaleJobs();

  const articleType = type === 'feature' || type === 'docs' ? type : 'article';
  const jobId = crypto.randomUUID();

  const job: GenerationJob = {
    id: jobId,
    title,
    type: articleType,
    status: 'pending',
    result: null,
    error: null,
    createdAt: Date.now(),
  };
  generationJobs.set(jobId, job);

  res.status(202).json({ jobId });

  job.status = 'running';

  try {
    const { data: existingArticles } = await db
      .from('articles')
      .select('title, slug, type, excerpt, tags')
      .order('created_at', { ascending: false });

    const catalog = (existingArticles ?? []).map((a) => ({
      title: a.title,
      slug: a.slug,
      type: a.type,
      excerpt: a.excerpt,
      tags: a.tags,
    }));

    const { data: repoRow, error: repoErr } = await supabase
      .from('repo_contexts')
      .select('analysis, file_tree, key_files, recent_commits')
      .eq('status', 'ready')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .single();

    if (repoErr) {
      console.debug('[debug] [cms:articles:generate] No repo context found', { error: repoErr.message });
    }

    const { data: dbRow, error: dbErr } = await supabase
      .from('db_contexts')
      .select('analysis, tables, relationships')
      .eq('status', 'ready')
      .order('fetched_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (dbErr) {
      console.debug('[debug] [cms:articles:generate] No DB context found', { error: dbErr.message });
    }

    const repoAnalysis = repoRow?.analysis as RepoAnalysis | undefined;
    const repoFileTree = repoRow?.file_tree as FileTreeEntry[] | undefined;
    const repoKeyFiles = repoRow?.key_files as Record<string, string> | undefined;
    const repoRecentCommits = repoRow?.recent_commits as CommitEntry[] | undefined;
    const dbAnalysis = dbRow?.analysis as DbAnalysis | undefined;
    const dbTables = dbRow?.tables as DbTable[] | undefined;
    const dbRelationships = dbRow?.relationships as DbRelationship[] | undefined;

    console.info('[info] [cms:articles:generate] Starting AI article generation', {
      jobId, title, type: articleType, existingCount: catalog.length,
      hasDirection: Boolean(directionText),
      directionPreview: directionText ? directionText.substring(0, 120) : null,
    });

    console.debug('[debug] [cms:articles:generate] Repo context detail', {
      jobId,
      hasAnalysis: Boolean(repoAnalysis),
      fileTreeCount: repoFileTree?.length ?? 0,
      keyFileNames: repoKeyFiles ? Object.keys(repoKeyFiles) : null,
      recentCommitCount: repoRecentCommits?.length ?? 0,
      languages: repoAnalysis?.languages?.slice(0, 3) ?? null,
      frameworks: repoAnalysis?.frameworks ?? null,
      patterns: repoAnalysis?.patterns ?? null,
    });

    console.debug('[debug] [cms:articles:generate] DB context detail', {
      jobId,
      hasAnalysis: Boolean(dbAnalysis),
      tableCount: dbTables?.length ?? 0,
      tableNames: dbTables?.filter((t) => t.schema === 'public').slice(0, 15).map((t) => t.name) ?? null,
      relationshipCount: dbRelationships?.length ?? 0,
    });

    const result = await generateArticle({
      title,
      type: articleType,
      direction: directionText,
      existingArticles: catalog,
      repoContext: repoAnalysis,
      repoFileTree,
      repoKeyFiles,
      repoRecentCommits,
      dbContext: dbAnalysis,
      dbTables,
      dbRelationships,
    });

    job.status = 'completed';
    job.result = result;
    console.info('[info] [cms:articles:generate] Article generated', { jobId, title, contentLength: result.content.length });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Generation failed';
    job.status = 'failed';
    job.error = message;
    console.error('[error] [cms:articles:generate] Failed', { jobId, title, message });
  }
});

cmsArticlesRouter.get('/generate/:jobId', (req, res) => {
  const job = generationJobs.get(req.params.jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired' });
  }

  if (job.status === 'completed') {
    res.json({ status: job.status, result: job.result });
    generationJobs.delete(job.id);
    return;
  }

  if (job.status === 'failed') {
    res.json({ status: job.status, error: job.error });
    generationJobs.delete(job.id);
    return;
  }

  res.json({ status: job.status });
});

// --- CRUD routes ---

cmsArticlesRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const type = req.query.type as string | undefined;
  const status = req.query.status as string | undefined;

  let query = db
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[error] [cms:articles:list] Failed to list articles', { message: error.message });
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

cmsArticlesRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  const { data, error } = await db
    .from('articles')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) {
    console.warn('[warn] [cms:articles:get] Article not found', { id: req.params.id, message: error.message });
    return res.status(404).json({ error: 'Article not found' });
  }

  res.json(data);
});

cmsArticlesRouter.post('/', validateBody(CreateArticleBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const userId = req.user!.id;

  const slug = req.body.slug || slugify(req.body.title);

  const { data: existing } = await db
    .from('articles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: 'An article with this slug already exists' });
  }

  const now = new Date().toISOString();
  const isPublished = req.body.status === 'published';

  const { data, error } = await db
    .from('articles')
    .insert({
      title: req.body.title,
      slug,
      type: req.body.type,
      status: req.body.status ?? 'draft',
      content: req.body.content ?? '',
      excerpt: req.body.excerpt ?? null,
      tags: req.body.tags ?? [],
      meta_description: req.body.meta_description ?? null,
      mini_demo_id: req.body.mini_demo_id ?? null,
      author: req.body.author ?? null,
      cover_image_url: req.body.cover_image_url ?? null,
      published_at: isPublished ? now : null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error('[error] [cms:articles:create] Failed to create article', { message: error.message });
    return res.status(400).json({ error: error.message });
  }

  console.info('[info] [cms:articles:create] Article created', { id: data.id, slug });
  res.status(201).json(data);
});

cmsArticlesRouter.patch('/:id', validateBody(UpdateArticleBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);

  if (req.body.slug) {
    const { data: existing } = await db
      .from('articles')
      .select('id')
      .eq('slug', req.body.slug)
      .neq('id', req.params.id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: 'An article with this slug already exists' });
    }
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (req.body.title !== undefined) updates.title = req.body.title;
  if (req.body.slug !== undefined) updates.slug = req.body.slug;
  if (req.body.type !== undefined) updates.type = req.body.type;
  if (req.body.content !== undefined) updates.content = req.body.content;
  if (req.body.excerpt !== undefined) updates.excerpt = req.body.excerpt;
  if (req.body.tags !== undefined) updates.tags = req.body.tags;
  if (req.body.meta_description !== undefined) updates.meta_description = req.body.meta_description;
  if (req.body.mini_demo_id !== undefined) updates.mini_demo_id = req.body.mini_demo_id;
  if (req.body.author !== undefined) updates.author = req.body.author;
  if (req.body.cover_image_url !== undefined) updates.cover_image_url = req.body.cover_image_url;

  if (req.body.status !== undefined) {
    updates.status = req.body.status;
    if (req.body.status === 'published') {
      const { data: current } = await db
        .from('articles')
        .select('status')
        .eq('id', req.params.id)
        .single();

      if (current && current.status !== 'published') {
        updates.published_at = new Date().toISOString();
      }
    } else {
      updates.published_at = null;
    }
  }

  const { data, error } = await db
    .from('articles')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('[error] [cms:articles:update] Failed to update article', { id: req.params.id, message: error.message });
    return res.status(400).json({ error: error.message });
  }

  console.info('[info] [cms:articles:update] Article updated', { id: req.params.id });
  res.json(data);
});

cmsArticlesRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  const { error } = await db
    .from('articles')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    console.error('[error] [cms:articles:delete] Failed to delete article', { id: req.params.id, message: error.message });
    return res.status(400).json({ error: error.message });
  }

  console.info('[info] [cms:articles:delete] Article deleted', { id: req.params.id });
  res.status(204).end();
});
