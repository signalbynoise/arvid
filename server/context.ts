import { supabase } from './supabase';

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
}

export async function fetchRequirementContext(requirementId: string): Promise<RequirementFullContext | null> {
  const { data: requirement, error: reqError } = await supabase
    .from('requirements')
    .select('*')
    .eq('id', requirementId)
    .single();

  if (reqError || !requirement) return null;

  let projectName: string | undefined;
  let siblingRequirements: string[] = [];

  if (requirement.project_id) {
    const { data: project } = await supabase
      .from('projects')
      .select('name')
      .eq('id', requirement.project_id)
      .single();

    projectName = project?.name;

    const { data: siblings } = await supabase
      .from('requirements')
      .select('title')
      .eq('project_id', requirement.project_id)
      .neq('id', requirementId)
      .order('created_at', { ascending: true });

    siblingRequirements = (siblings || []).map((r: { title: string }) => r.title);
  }

  const { data: dbQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('requirement_id', requirementId)
    .order('created_at', { ascending: true });

  const questionIds = (dbQuestions || []).map((q: { id: string }) => q.id);
  let dbAnswers: Array<{ id: string; question_id: string; text: string; author: string; is_current: boolean }> = [];

  if (questionIds.length > 0) {
    const { data: ansData } = await supabase
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
    },
    projectName,
    siblingRequirements,
    questions,
  };
}
