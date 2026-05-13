import { Router } from 'express';
import { createUserClient } from '../supabase';

export const searchRouter = Router();

const MAX_QUERY_LENGTH = 500;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

searchRouter.get('/', async (req, res) => {
  const rawQuery = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  if (!rawQuery) {
    return res.json([]);
  }

  const query = rawQuery.slice(0, MAX_QUERY_LENGTH);
  const limit = Math.min(
    Math.max(1, parseInt(req.query.limit as string, 10) || DEFAULT_LIMIT),
    MAX_LIMIT,
  );
  const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

  const db = createUserClient(req.accessToken!);

  const { data, error } = await db.rpc('search_entities', {
    p_query: query,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) {
    console.error(
      '[ERROR] [search:query] RPC failed',
      JSON.stringify({ query, error: error.message }),
    );
    return res.status(500).json({ error: error.message });
  }

  return res.json(data ?? []);
});
