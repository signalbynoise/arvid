import { Router } from 'express';
import { createUserClient } from '../supabase';
import { generateSummary, SummaryGenerationInput } from '../openrouter';
import { fetchRequirementContext, toFigmaDesignContexts } from '../context';
import { sendSlackNotification } from '../lib/slackNotifier';
import { generateShortId } from '../lib/shortId';

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

  if (context.requirement.impl_status === 'Implemented') {
    console.info(
      '[INFO] [summaries:generate] Requirement is implemented, skipping regeneration',
      JSON.stringify({ requirementId }),
    );
    const { data: existing } = await db
      .from('summaries')
      .select('*')
      .eq('requirement_id', requirementId)
      .single();
    if (existing) return res.status(200).json(existing);
    return res.status(200).json({ skipped: true, reason: 'Requirement is implemented' });
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
    repoContext: context.repoContext,
    dbContext: context.dbContext,
    figmaDesigns: toFigmaDesignContexts(context.figmaLinks),
  };

  try {
    const generated = await generateSummary(input);

    const summaryId = `s-${requirementId}-${Date.now()}`;

    const { data: reqRow } = await db
      .from('requirements')
      .select('short_id')
      .eq('id', requirementId)
      .single();
    const summaryShortId = await generateShortId(db, 'summaries', 'S');

    const { data: upserted, error: upsertError } = await db
      .from('summaries')
      .upsert(
        {
          id: summaryId,
          requirement_id: requirementId,
          short_id: summaryShortId,
          synthesis: generated.synthesis,
          core_objective: generated.core_objective,
          architecture: generated.architecture,
          constraints: generated.constraints,
          unverified_risks: generated.unverified_risks,
          completeness: generated.completeness,
          completeness_reasoning: generated.completeness_reasoning,
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

    const { error: reqUpdateError } = await db
      .from('requirements')
      .update({ completeness: generated.completeness })
      .eq('id', requirementId);

    if (reqUpdateError) {
      console.warn(
        '[WARN] [summaries:generate] Failed to sync completeness to requirement',
        JSON.stringify({ requirementId, error: reqUpdateError.message }),
      );
    }

    console.info(
      '[INFO] [summaries:generate] Summary generated and saved',
      JSON.stringify({ requirementId, summaryId: upserted.id }),
    );

    if (context.requirement.project_id) {
      sendSlackNotification({
        projectId: context.requirement.project_id,
        eventType: 'summary_generated',
        title: context.requirement.title,
        summary: `Summary generated with ${generated.completeness}% completeness`,
        entityId: upserted.id,
        db,
      });
    }

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

summariesRouter.post('/notify-cursor/:requirementId', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { requirementId } = req.params;

  const { data: requirement } = await db
    .from('requirements')
    .select('title, project_id')
    .eq('id', requirementId)
    .single();

  if (requirement?.project_id) {
    sendSlackNotification({
      projectId: requirement.project_id,
      eventType: 'sent_to_cursor',
      title: requirement.title,
      summary: 'Specification sent to Cursor for implementation',
      entityId: requirementId,
      db,
    });
  }

  res.status(204).send();
});
