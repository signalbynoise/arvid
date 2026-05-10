import { Router } from 'express';
import { supabase } from '../supabase';

export const articlesPublicRouter = Router();

articlesPublicRouter.get('/', async (req, res) => {
  const type = req.query.type as string | undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;

  let query = supabase
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (type) {
    query = query.eq('type', type);
  }

  if (limit && Number.isFinite(limit) && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[error] [articles:list] Failed to fetch published articles', { message: error.message });
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

articlesPublicRouter.get('/:slug', async (req, res) => {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', req.params.slug)
    .eq('status', 'published')
    .single();

  if (error) {
    console.warn('[warn] [articles:getBySlug] Article not found', { slug: req.params.slug, message: error.message });
    return res.status(404).json({ error: 'Article not found' });
  }

  res.json(data);
});
