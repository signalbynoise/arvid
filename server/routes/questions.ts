import { Router } from 'express';
import { createUserClient } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateQuestionBodySchema, UpdateQuestionBodySchema } from '../../shared/schemas';
import { suggestQuestions, classifyQuestion, computeQuestionDepth } from '../openrouter';
import { fetchRequirementContext, toFigmaDesignContexts } from '../context';
import { generateShortId } from '../lib/shortId';
import { sendSlackNotification } from '../lib/slackNotifier';
import { isSemanticallyDuplicate } from '../lib/textSimilarity';

const suggestingInProgress = new Set<string>();

export const questionsRouter = Router();

questionsRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  let query = db
    .from('questions')
    .select('*')
    .order('created_at', { ascending: true });

  if (req.query.requirement_id) {
    query = query.eq('requirement_id', req.query.requirement_id as string);
  }

  if (req.query.include_deactivated !== 'true') {
    query = query.eq('is_deactivated', false);
  }

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

questionsRouter.get('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('questions')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: error.message });
  res.json(data);
});

questionsRouter.post('/', validateBody(CreateQuestionBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const shortId = await generateShortId(db, 'questions', 'Q');
  const { data, error } = await db
    .from('questions')
    .insert({ ...req.body, short_id: shortId, created_by: req.user!.id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  const { data: requirement } = await db
    .from('requirements')
    .select('project_id, title')
    .eq('id', req.body.requirement_id)
    .single();

  if (requirement?.project_id) {
    sendSlackNotification({
      projectId: requirement.project_id,
      eventType: 'question_posed',
      title: data.text,
      summary: `New question on requirement "${requirement.title}"`,
      entityId: data.id,
      db,
    });
  }

  res.status(201).json(data);
});

questionsRouter.post('/classify', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { text, requirement_id } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length < 3) {
    return res.status(400).json({ error: 'text is required' });
  }
  if (!requirement_id) {
    return res.status(400).json({ error: 'requirement_id is required' });
  }

  const fullContext = await fetchRequirementContext(db, requirement_id);

  const classifyContext = fullContext ? {
    requirement: fullContext.requirement,
    projectName: fullContext.projectName,
    siblingRequirements: fullContext.siblingRequirements,
    existingQuestions: fullContext.questions.map(q => ({
      text: q.text,
      status: q.status,
      importance: q.importance,
      category: q.category,
      answers: q.answers.map(a => ({ text: a.text, author: a.author })),
    })),
    repoContext: fullContext.repoContext,
    dbContext: fullContext.dbContext,
    figmaDesigns: toFigmaDesignContexts(fullContext.figmaLinks),
  } : null;

  try {
    const result = await classifyQuestion(text.trim(), classifyContext);
    res.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[ERROR] [questions:classify] Classification failed', JSON.stringify({ error: message }));
    res.json({ importance: 'Important', category: 'Scope' });
  }
});

questionsRouter.post('/suggest/:requirementId', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { requirementId } = req.params;

  if (suggestingInProgress.has(requirementId)) {
    console.info(
      '[INFO] [questions:suggest] Suggestion already in progress, skipping',
      JSON.stringify({ requirementId }),
    );
    return res.status(200).json([]);
  }

  suggestingInProgress.add(requirementId);

  console.info(
    '[INFO] [questions:suggest] Generating suggested questions',
    JSON.stringify({ requirementId }),
  );

  const context = await fetchRequirementContext(db, requirementId);

  if (!context) {
    suggestingInProgress.delete(requirementId);
    return res.status(404).json({ error: `Requirement ${requirementId} not found` });
  }

  if (context.requirement.impl_status === 'Implemented') {
    suggestingInProgress.delete(requirementId);
    console.info(
      '[INFO] [questions:suggest] Requirement is implemented, skipping suggestions',
      JSON.stringify({ requirementId }),
    );
    return res.status(200).json([]);
  }

  try {
    const existingQuestionsForDepth = context.questions.map(q => ({
      text: q.text,
      status: q.status,
      importance: q.importance,
      category: q.category,
      answers: q.answers.map(a => ({ text: a.text, author: a.author })),
    }));

    const depthTier = computeQuestionDepth(existingQuestionsForDepth, context.suggestionHistory);

    console.info(
      '[INFO] [questions:suggest] Computed question depth',
      JSON.stringify({ requirementId, tier: depthTier.tier, label: depthTier.label, reasoning: depthTier.reasoning }),
    );

    const figmaDesigns = toFigmaDesignContexts(context.figmaLinks);

    const suggestions = await suggestQuestions({
      requirementTitle: context.requirement.title,
      requirementDescription: context.requirement.description,
      projectName: context.projectName,
      existingRequirements: context.siblingRequirements,
      existingQuestions: existingQuestionsForDepth,
      suggestionHistory: context.suggestionHistory,
      repoContext: context.repoContext,
      repoFileTree: context.repoFileTree,
      repoKeyFiles: context.repoKeyFiles,
      repoRecentCommits: context.repoRecentCommits,
      dbContext: context.dbContext,
      figmaDesigns,
      clarityScore: context.requirement.clarity_score,
      riskScore: context.requirement.risk_score,
      clarityReasoning: context.requirement.clarity_reasoning,
      riskReasoning: context.requirement.risk_reasoning,
      depthTier,
    });

    const allExistingTexts: string[] = [
      ...context.suggestionHistory.map(s => s.text),
      ...context.questions.map(q => q.text),
    ];

    const exactTexts = new Set(
      allExistingTexts.map(t => t.toLowerCase().trim()),
    );

    const dedupedSuggestions = suggestions.filter(s => {
      const normalized = s.text.toLowerCase().trim();

      if (exactTexts.has(normalized)) {
        console.debug(
          '[DEBUG] [questions:suggest] Filtered exact duplicate',
          JSON.stringify({ text: s.text.substring(0, 60) }),
        );
        return false;
      }

      const fuzzyMatch = isSemanticallyDuplicate(s.text, allExistingTexts);
      if (fuzzyMatch) {
        console.debug(
          '[DEBUG] [questions:suggest] Filtered semantic duplicate',
          JSON.stringify({ new: s.text.substring(0, 60), existing: fuzzyMatch.substring(0, 60) }),
        );
        return false;
      }

      exactTexts.add(normalized);
      allExistingTexts.push(s.text);
      return true;
    });

    if (dedupedSuggestions.length === 0) {
      console.info(
        '[INFO] [questions:suggest] No new suggestions after dedup',
        JSON.stringify({ requirementId, rawCount: suggestions.length }),
      );
      suggestingInProgress.delete(requirementId);
      return res.status(200).json([]);
    }

    const shortIds = await Promise.all(
      dedupedSuggestions.map(() => generateShortId(db, 'questions', 'Q')),
    );

    const rows = dedupedSuggestions.map((s, i) => ({
      id: `qs-${requirementId}-${Date.now()}-${i}`,
      requirement_id: requirementId,
      short_id: shortIds[i],
      text: s.text,
      importance: s.importance,
      category: s.category,
      status: 'Unanswered',
      type: 'Auto-generated',
      is_suggested: true,
      is_hidden: false,
      author: 'Arvid',
      author_team: 'Arvid',
      created_at: new Date().toISOString(),
    }));

    const { data: inserted, error: insertError } = await db
      .from('questions')
      .insert(rows)
      .select();

    if (insertError) {
      console.error(
        '[ERROR] [questions:suggest] Failed to insert suggestions',
        JSON.stringify({ error: insertError.message }),
      );
      suggestingInProgress.delete(requirementId);
      return res.status(500).json({ error: insertError.message });
    }

    console.info(
      '[INFO] [questions:suggest] Suggestions created',
      JSON.stringify({ requirementId, count: inserted?.length }),
    );

    suggestingInProgress.delete(requirementId);
    res.status(201).json(inserted);
  } catch (err) {
    suggestingInProgress.delete(requirementId);
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(
      '[ERROR] [questions:suggest] Generation failed',
      JSON.stringify({ requirementId, error: message }),
    );
    res.status(500).json({ error: `Suggestion generation failed: ${message}` });
  }
});

questionsRouter.patch('/:id', validateBody(UpdateQuestionBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('questions')
    .update(req.body)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

questionsRouter.patch('/:id/deactivate', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { data, error } = await db
    .from('questions')
    .update({ is_deactivated: true })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

questionsRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { error } = await db
    .from('questions')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
