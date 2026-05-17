import cron from 'node-cron';
import { CHANGELOG_CRON_SCHEDULE } from './changelogConfig';
import { runChangelogGeneration } from './changelogGenerator';

export function startScheduledJobs(): void {
  cron.schedule(CHANGELOG_CRON_SCHEDULE, async () => {
    console.info('[INFO] [jobs:cron] Daily changelog generation triggered');
    try {
      const result = await runChangelogGeneration();
      console.info('[INFO] [jobs:cron] Changelog generation finished', JSON.stringify(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ERROR] [jobs:cron] Changelog generation failed', JSON.stringify({ error: message }));
    }
  });

  console.info(`[INFO] [jobs:init] Scheduled jobs registered (changelog: ${CHANGELOG_CRON_SCHEDULE})`);
}
