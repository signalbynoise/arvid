import { supabaseAdmin } from './supabase';
import { generateEmbeddings, contentHash, embeddingInput } from './embeddings';
import type { SimilarRequirementRow } from '../shared/schemas/similarity';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const SIMILARITY_THRESHOLD = 0.55;
const MAX_SIMILAR = 5;

interface RequirementRow {
  id: string;
  short_id: string | null;
  title: string;
  description: string | null;
  project_id: string;
}

interface EmbeddingRow {
  requirement_id: string;
  content_hash: string;
}

interface CacheRow {
  requirement_id: string;
  similar_requirements: SimilarRequirementRow[];
  computed_at: string;
}

function isCacheFresh(computedAt: string): boolean {
  return Date.now() - new Date(computedAt).getTime() < CACHE_TTL_MS;
}

async function ensureEmbeddings(requirements: RequirementRow[]): Promise<void> {
  if (requirements.length === 0) return;

  const reqIds = requirements.map(r => r.id);
  const { data: existing } = await supabaseAdmin
    .from('requirement_embeddings')
    .select('requirement_id, content_hash')
    .in('requirement_id', reqIds);

  const existingMap = new Map(
    (existing as EmbeddingRow[] || []).map(e => [e.requirement_id, e.content_hash]),
  );

  const stale: RequirementRow[] = [];
  for (const req of requirements) {
    const hash = contentHash(req.title, req.description);
    if (existingMap.get(req.id) !== hash) {
      stale.push(req);
    }
  }

  if (stale.length === 0) return;

  console.log(`[INFO] [similarity:ensureEmbeddings] Generating embeddings for ${stale.length} stale/missing requirements`);

  const texts = stale.map(r => embeddingInput(r.title, r.description));
  const vectors = await generateEmbeddings(texts);

  for (let i = 0; i < stale.length; i++) {
    const req = stale[i];
    const vectorStr = `[${vectors[i].join(',')}]`;
    const hash = contentHash(req.title, req.description);

    const { error } = await supabaseAdmin
      .from('requirement_embeddings')
      .upsert({
        requirement_id: req.id,
        embedding: vectorStr,
        content_hash: hash,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'requirement_id' });

    if (error) {
      console.error(`[ERROR] [similarity:ensureEmbeddings] Failed to upsert embedding for ${req.id}: ${error.message}`);
    }
  }
}

async function computeSimilarity(
  targetId: string,
  projectId: string,
): Promise<SimilarRequirementRow[]> {
  const { data, error } = await supabaseAdmin.rpc('match_similar_requirements', {
    target_id: targetId,
    target_project_id: projectId,
    similarity_threshold: SIMILARITY_THRESHOLD,
    match_count: MAX_SIMILAR,
  });

  if (error) {
    console.error(`[ERROR] [similarity:compute] RPC failed for ${targetId}: ${error.message}`);
    return [];
  }

  return (data || []).map((row: { id: string; short_id: string | null; title: string; score: number }) => ({
    id: row.id,
    short_id: row.short_id,
    title: row.title,
    score: Math.round(row.score * 1000) / 1000,
  }));
}

export async function getSimilarForRequirement(
  requirementId: string,
  projectId: string,
): Promise<SimilarRequirementRow[]> {
  const { data: cached } = await supabaseAdmin
    .from('similarity_cache')
    .select('similar_requirements, computed_at')
    .eq('requirement_id', requirementId)
    .single();

  if (cached && isCacheFresh((cached as CacheRow).computed_at)) {
    console.log(`[DEBUG] [similarity:get] Cache hit for ${requirementId}`);
    return (cached as CacheRow).similar_requirements;
  }

  const { data: allReqs } = await supabaseAdmin
    .from('requirements')
    .select('id, short_id, title, description, project_id')
    .eq('project_id', projectId)
    .eq('is_deactivated', false);

  if (!allReqs || allReqs.length < 2) return [];

  await ensureEmbeddings(allReqs as RequirementRow[]);

  const similar = await computeSimilarity(requirementId, projectId);

  const { error: cacheError } = await supabaseAdmin
    .from('similarity_cache')
    .upsert({
      requirement_id: requirementId,
      project_id: projectId,
      similar_requirements: similar,
      computed_at: new Date().toISOString(),
    }, { onConflict: 'requirement_id' });

  if (cacheError) {
    console.error(`[WARN] [similarity:get] Failed to write cache for ${requirementId}: ${cacheError.message}`);
  }

  return similar;
}

export async function getProjectSimilarities(
  projectId: string,
): Promise<Record<string, SimilarRequirementRow[]>> {
  const { data: allReqs } = await supabaseAdmin
    .from('requirements')
    .select('id, short_id, title, description, project_id')
    .eq('project_id', projectId)
    .eq('is_deactivated', false);

  if (!allReqs || allReqs.length < 2) {
    return Object.fromEntries((allReqs || []).map((r: { id: string }) => [r.id, []]));
  }

  await ensureEmbeddings(allReqs as RequirementRow[]);

  const { data: cached } = await supabaseAdmin
    .from('similarity_cache')
    .select('requirement_id, similar_requirements, computed_at')
    .eq('project_id', projectId);

  const cacheMap = new Map(
    (cached as CacheRow[] || [])
      .filter(c => isCacheFresh(c.computed_at))
      .map(c => [c.requirement_id, c.similar_requirements]),
  );

  const result: Record<string, SimilarRequirementRow[]> = {};
  const toCompute: string[] = [];

  for (const req of allReqs as RequirementRow[]) {
    const hit = cacheMap.get(req.id);
    if (hit) {
      result[req.id] = hit;
    } else {
      toCompute.push(req.id);
    }
  }

  if (toCompute.length > 0) {
    console.log(`[INFO] [similarity:project] Computing similarities for ${toCompute.length}/${allReqs.length} requirements`);
  }

  for (const reqId of toCompute) {
    const similar = await computeSimilarity(reqId, projectId);
    result[reqId] = similar;

    await supabaseAdmin
      .from('similarity_cache')
      .upsert({
        requirement_id: reqId,
        project_id: projectId,
        similar_requirements: similar,
        computed_at: new Date().toISOString(),
      }, { onConflict: 'requirement_id' });
  }

  return result;
}
