import { supabaseAdmin } from '../supabase';
import { CHANGELOG_REPO } from './changelogConfig';
import { fetchCommitsSince } from './changelog/fetchCommits';
import { categorizeCommits, buildFallbackMarkdown } from './changelog/categorizeCommits';
import { summarizeCommits } from './changelog/summarize';

const MODULE = 'changelog';

export async function runChangelogGeneration(): Promise<{ published: boolean; commitCount: number }> {
  console.info(`[INFO] [${MODULE}:run] Starting changelog generation for ${CHANGELOG_REPO}`);

  const { data: lastChangelog } = await supabaseAdmin
    .from('articles')
    .select('published_at')
    .eq('type', 'changelog')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const since = lastChangelog?.published_at ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  console.info(`[INFO] [${MODULE}:run] Fetching commits since ${since}`);

  const commits = await fetchCommitsSince(since);

  if (commits.length === 0) {
    console.info(`[INFO] [${MODULE}:run] No new commits, skipping`);
    return { published: false, commitCount: 0 };
  }

  console.info(`[INFO] [${MODULE}:run] Found ${commits.length} commits`);

  const categorized = categorizeCommits(commits);
  const today = new Date().toISOString().slice(0, 10);
  const slug = `changelog-${today}`;
  const title = `Changelog — ${today}`;

  let content: string;
  let excerpt: string;

  try {
    const summary = await summarizeCommits(categorized, today);
    content = summary.content;
    excerpt = summary.excerpt;
    console.info(`[INFO] [${MODULE}:run] AI summary generated`, JSON.stringify({ contentLength: content.length }));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[WARN] [${MODULE}:run] AI summarization failed, using fallback`, JSON.stringify({ error: message }));
    content = buildFallbackMarkdown(categorized);
    excerpt = `${commits.length} changes to Arvid on ${today}`;
  }

  const now = new Date().toISOString();

  const { error: upsertError } = await supabaseAdmin
    .from('articles')
    .upsert(
      {
        title,
        slug,
        type: 'changelog' as const,
        status: 'published' as const,
        content,
        excerpt,
        tags: ['changelog'],
        published_at: now,
        updated_at: now,
        author: 'Arvid',
      },
      { onConflict: 'slug' },
    );

  if (upsertError) {
    console.error(`[ERROR] [${MODULE}:run] Upsert failed`, JSON.stringify({ slug, error: upsertError.message }));
    throw new Error(`Changelog upsert failed for ${slug}: ${upsertError.message}`);
  }

  console.info(`[INFO] [${MODULE}:run] Changelog published`, JSON.stringify({ slug, commitCount: commits.length }));
  return { published: true, commitCount: commits.length };
}
