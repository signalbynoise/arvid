import { Router } from 'express';
import { createUserClient } from '../supabase';
import { validateBody } from '../middleware/validateBody';
import { CreateCardAssigneeBodySchema } from '../../shared/schemas';

export const cardAssigneesRouter = Router();

cardAssigneesRouter.get('/', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  let query = db.from('card_assignees').select('*');

  if (req.query.entity_type && req.query.entity_id) {
    query = query
      .eq('entity_type', req.query.entity_type as string)
      .eq('entity_id', req.query.entity_id as string);
  } else if (req.query.project_id) {
    const projectId = req.query.project_id as string;

    const { data: reqIds } = await db
      .from('requirements')
      .select('id')
      .eq('project_id', projectId);

    if (!reqIds || reqIds.length === 0) {
      return res.json([]);
    }

    const requirementIds = reqIds.map((r: { id: string }) => r.id);

    const { data: questionIds } = await db
      .from('questions')
      .select('id')
      .in('requirement_id', requirementIds);

    const qIds = (questionIds || []).map((q: { id: string }) => q.id);

    const { data: answerIds } = qIds.length > 0
      ? await db.from('answers').select('id').in('question_id', qIds)
      : { data: [] };

    const aIds = (answerIds || []).map((a: { id: string }) => a.id);

    const allEntityIds = [...requirementIds, ...qIds, ...aIds];
    if (allEntityIds.length === 0) {
      return res.json([]);
    }

    query = query.in('entity_id', allEntityIds);
  } else {
    return res.status(400).json({ error: 'Provide entity_type+entity_id or project_id' });
  }

  const { data, error } = await query.order('assigned_at', { ascending: true });
  if (error) {
    if (error.code === '42P01') {
      return res.json([]);
    }
    return res.status(500).json({ error: error.message });
  }
  res.json(data);
});

cardAssigneesRouter.post('/', validateBody(CreateCardAssigneeBodySchema), async (req, res) => {
  const db = createUserClient(req.accessToken!);
  const { entity_type, entity_id, user_id } = req.body;

  console.info(
    '[INFO] [cardAssignees:assign] Assigning user',
    JSON.stringify({ entityType: entity_type, entityId: entity_id, userId: user_id }),
  );

  const { data, error } = await db
    .from('card_assignees')
    .insert({ entity_type, entity_id, user_id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'User already assigned' });
    }
    if (error.code === '42P01') {
      return res.status(503).json({ error: 'Card assignees feature not yet available. Please apply the migration.' });
    }
    return res.status(400).json({ error: error.message });
  }

  res.status(201).json(data);
});

cardAssigneesRouter.delete('/:id', async (req, res) => {
  const db = createUserClient(req.accessToken!);

  console.info(
    '[INFO] [cardAssignees:unassign] Removing assignment',
    JSON.stringify({ assigneeId: req.params.id }),
  );

  const { error } = await db
    .from('card_assignees')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(400).json({ error: error.message });
  res.status(204).end();
});
