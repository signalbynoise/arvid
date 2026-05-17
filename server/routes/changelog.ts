import { Router } from 'express';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin';
import { runChangelogGeneration } from '../jobs/changelogGenerator';

export const changelogRouter = Router();

changelogRouter.use(requireSuperAdmin);

changelogRouter.post('/generate', async (_req, res) => {
  console.info('[INFO] [changelog:trigger] Manual changelog generation requested');

  res.status(202).json({ status: 'started', message: 'Changelog generation started in the background' });

  try {
    const result = await runChangelogGeneration();
    console.info('[INFO] [changelog:trigger] Manual generation complete', JSON.stringify(result));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ERROR] [changelog:trigger] Manual generation failed', JSON.stringify({ error: message }));
  }
});
