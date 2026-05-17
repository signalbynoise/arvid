import cron from 'node-cron';
import { CHANGELOG_CRON_SCHEDULE } from './changelogConfig';
import { runChangelogGeneration } from './changelogGenerator';
import { runAccountDeletions } from './accountDeletion';

const ACCOUNT_DELETION_CRON = '0 3 * * *';

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

  cron.schedule(ACCOUNT_DELETION_CRON, async () => {
    console.info('[INFO] [jobs:cron] Account deletion sweep triggered');
    try {
      const result = await runAccountDeletions();
      console.info('[INFO] [jobs:cron] Account deletion sweep finished', JSON.stringify(result));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('[ERROR] [jobs:cron] Account deletion sweep failed', JSON.stringify({ error: message }));
    }
  });

  console.info(`[INFO] [jobs:init] Scheduled jobs registered (changelog: ${CHANGELOG_CRON_SCHEDULE}, accountDeletion: ${ACCOUNT_DELETION_CRON})`);
}
