import type { SupabaseClient } from '@supabase/supabase-js';
import type { RepoAnalysis, FileTreeEntry, CommitEntry } from '../shared/schemas/repoContext';
import type { DbAnalysis, DbTable, DbRelationship, DbFunction, EdgeFunction } from '../shared/schemas/dbContext';

export type SuggestionDisposition = 'pending' | 'accepted' | 'rejected';

export interface PriorSuggestion {
  text: string;
  importance: string;
  category: string;
  disposition: SuggestionDisposition;
}

export interface RequirementFullContext {
  requirement: {
    id: string;
    title: string;
    description?: string;
    owner: string;
    source: string;
    clarity: string;
    risk: string;
    project_id?: string;
    clarity_score?: number;
    risk_score?: number;
    clarity_reasoning?: string;
    risk_reasoning?: string;
  };
  projectName?: string;
  siblingRequirements: string[];
  questions: {
    id: string;
    text: string;
    status: string;
    importance: string;
    category: string;
    author?: string;
    answers: { text: string; author: string; isCurrent: boolean }[];
  }[];
  suggestionHistory: PriorSuggestion[];
  repoContext?: RepoAnalysis;
  repoFileTree?: FileTreeEntry[];
  repoKeyFiles?: Record<string, string>;
  repoRecentCommits?: CommitEntry[];
  dbContext?: DbAnalysis;
  dbTables?: DbTable[];
  dbRelationships?: DbRelationship[];
  dbFunctions?: DbFunction[];
  dbEdgeFunctions?: EdgeFunction[];
}

export async function fetchRequirementContext(db: SupabaseClient, requirementId: string): Promise<RequirementFullContext | null> {
  const { data: requirement, error: reqError } = await db
    .from('requirements')
    .select('*')
    .eq('id', requirementId)
    .single();

  if (reqError || !requirement) return null;

  let projectName: string | undefined;
  let siblingRequirements: string[] = [];
  let repoContext: RepoAnalysis | undefined;
  let repoFileTree: FileTreeEntry[] | undefined;
  let repoKeyFiles: Record<string, string> | undefined;
  let repoRecentCommits: CommitEntry[] | undefined;
  let dbContext: DbAnalysis | undefined;
  let dbTables: DbTable[] | undefined;
  let dbRelationships: DbRelationship[] | undefined;
  let dbFunctions: DbFunction[] | undefined;
  let dbEdgeFunctions: EdgeFunction[] | undefined;

  if (requirement.project_id) {
    const { data: project } = await db
      .from('projects')
      .select('name')
      .eq('id', requirement.project_id)
      .single();

    projectName = project?.name;

    const { data: siblings } = await db
      .from('requirements')
      .select('title')
      .eq('project_id', requirement.project_id)
      .neq('id', requirementId)
      .order('created_at', { ascending: true });

    siblingRequirements = (siblings || []).map((r: { title: string }) => r.title);

    const { data: repoCtx, error: repoErr } = await db
      .from('repo_contexts')
      .select('analysis, file_tree, key_files, recent_commits')
      .eq('project_id', requirement.project_id)
      .eq('status', 'ready')
      .single();

    if (repoErr) {
      console.debug(
        `[DEBUG] [context:repoContext] No repo context found`,
        JSON.stringify({ projectId: requirement.project_id, error: repoErr.message }),
      );
    }

    if (repoCtx) {
      if (repoCtx.analysis) {
        repoContext = repoCtx.analysis as RepoAnalysis;
      }
      if (repoCtx.file_tree) {
        repoFileTree = repoCtx.file_tree as FileTreeEntry[];
      }
      if (repoCtx.key_files) {
        repoKeyFiles = repoCtx.key_files as Record<string, string>;
      }
      if (repoCtx.recent_commits) {
        repoRecentCommits = repoCtx.recent_commits as CommitEntry[];
      }
      console.info(
        `[INFO] [context:repoContext] Repo context loaded`,
        JSON.stringify({
          projectId: requirement.project_id,
          languages: repoContext?.languages?.length,
          fileTreeSize: repoFileTree?.length,
          keyFilesCount: repoKeyFiles ? Object.keys(repoKeyFiles).length : 0,
          commitsCount: repoRecentCommits?.length,
        }),
      );
    }

    const { data: dbCtx, error: dbErr } = await db
      .from('db_contexts')
      .select('analysis, tables, relationships, functions, edge_functions')
      .eq('project_id', requirement.project_id)
      .eq('status', 'ready')
      .single();

    if (dbErr) {
      console.debug(
        `[DEBUG] [context:dbContext] No DB context found`,
        JSON.stringify({ projectId: requirement.project_id, error: dbErr.message }),
      );
    }

    if (dbCtx) {
      if (dbCtx.analysis) {
        dbContext = dbCtx.analysis as DbAnalysis;
      }
      if (dbCtx.tables) {
        dbTables = dbCtx.tables as DbTable[];
      }
      if (dbCtx.relationships) {
        dbRelationships = dbCtx.relationships as DbRelationship[];
      }
      if (dbCtx.functions) {
        dbFunctions = dbCtx.functions as DbFunction[];
      }
      if (dbCtx.edge_functions) {
        dbEdgeFunctions = dbCtx.edge_functions as EdgeFunction[];
      }
      console.info(
        `[INFO] [context:dbContext] DB context loaded`,
        JSON.stringify({
          projectId: requirement.project_id,
          tableCount: dbTables?.length,
          relationshipCount: dbRelationships?.length,
          functionCount: dbFunctions?.length,
          edgeFunctionCount: dbEdgeFunctions?.length,
        }),
      );
    }
  }

  const { data: dbQuestions } = await db
    .from('questions')
    .select('*')
    .eq('requirement_id', requirementId)
    .order('created_at', { ascending: true });

  const questionIds = (dbQuestions || []).map((q: { id: string }) => q.id);
  let dbAnswers: Array<{ id: string; question_id: string; text: string; author: string; is_current: boolean }> = [];

  if (questionIds.length > 0) {
    const { data: ansData } = await db
      .from('answers')
      .select('*')
      .in('question_id', questionIds);

    dbAnswers = ansData || [];
  }

  const questions = (dbQuestions || [])
    .filter((q: { is_hidden: boolean | null }) => !q.is_hidden)
    .map((q: { id: string; text: string; status: string; importance: string; category: string; author: string | null; is_suggested: boolean | null }) => ({
      id: q.id,
      text: q.text,
      status: q.status,
      importance: q.importance,
      category: q.category,
      author: q.author ?? undefined,
      answers: dbAnswers
        .filter(a => a.question_id === q.id)
        .map(a => ({
          text: a.text,
          author: a.author,
          isCurrent: a.is_current,
        })),
    }));

  const suggestionHistory: PriorSuggestion[] = (dbQuestions || [])
    .filter((q: { type: string | null }) => q.type === 'Auto-generated')
    .map((q: { text: string; importance: string; category: string; is_suggested: boolean | null; is_hidden: boolean | null }): PriorSuggestion => {
      let disposition: SuggestionDisposition;
      if (q.is_hidden) {
        disposition = 'rejected';
      } else if (q.is_suggested) {
        disposition = 'pending';
      } else {
        disposition = 'accepted';
      }
      return { text: q.text, importance: q.importance, category: q.category, disposition };
    });

  return {
    requirement: {
      id: requirement.id,
      title: requirement.title,
      description: requirement.description ?? undefined,
      owner: requirement.owner,
      source: requirement.source,
      clarity: requirement.clarity,
      risk: requirement.risk,
      project_id: requirement.project_id ?? undefined,
      clarity_score: requirement.clarity_score ?? undefined,
      risk_score: requirement.risk_score ?? undefined,
      clarity_reasoning: requirement.clarity_reasoning ?? undefined,
      risk_reasoning: requirement.risk_reasoning ?? undefined,
    },
    projectName,
    siblingRequirements,
    questions,
    suggestionHistory,
    repoContext,
    repoFileTree,
    repoKeyFiles,
    repoRecentCommits,
    dbContext,
    dbTables,
    dbRelationships,
    dbFunctions,
    dbEdgeFunctions,
  };
}
