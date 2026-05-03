import { Router } from 'express';
import { createUserClient } from '../supabase';
import { generateSummary, SummaryGenerationInput } from '../openrouter';
import { fetchRequirementContext } from '../context';

export const summariesRouter = Router();

summariesRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  let query = db
    .from('summaries')
    .select('*');

  if (req.query.requirement_id) {
    query = query.eq('requirement_id', req.query.requirement_id as string);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

summariesRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('summaries')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

summariesRouter.post('/generate/:requirementId', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { requirementId } = req.params;

  console.info(
    `[INFO] [summaries:generate] Starting summary generation`,
    JSON.stringify({ requirementId }),
  );

  const context = await fetchRequirementContext(db, requirementId);

  if (!context) {
    return res.status(404).json({ error: `Requirement ${requirementId} not found` });
  }

  const input: SummaryGenerationInput = {
    requirement: {
      title: context.requirement.title,
      description: context.requirement.description,
      owner: context.requirement.owner,
      source: context.requirement.source,
      clarity: context.requirement.clarity,
      risk: context.requirement.risk,
    },
    questions: context.questions.map(q => ({
      text: q.text,
      status: q.status,
      importance: q.importance,
      category: q.category,
      author: q.author,
      answers: q.answers,
    })),
  };

  try {
    const generated = await generateSummary(input);

    const summaryId = `s-${requirementId}-${Date.now()}`;

    const { data: upserted, error: upsertError } = await db
      .from('summaries')
      .upsert(
        {
          id: summaryId,
          requirement_id: requirementId,
          synthesis: generated.synthesis,
          core_objective: generated.core_objective,
          architecture: generated.architecture,
          constraints: generated.constraints,
          unverified_risks: generated.unverified_risks,
          model: 'x-ai/grok-4.1-fast',
          generated_at: new Date().toISOString(),
        },
        { onConflict: 'requirement_id' },
      )
      .select()
      .single();

    if (upsertError) {
      console.error(
        '[ERROR] [summaries:generate] Failed to upsert summary',
        JSON.stringify({ error: upsertError.message }),
      );
      return res.status(500).json({ error: upsertError.message });
    }

    console.info(
      '[INFO] [summaries:generate] Summary generated and saved',
      JSON.stringify({ requirementId, summaryId: upserted.id }),
    );

    res.status(201).json(upserted);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [summaries:generate] Generation failed',
      JSON.stringify({ requirementId, error: message }),
    );
    res.status(500).json({ error: `Summary generation failed: ${message}` });
  }
});
