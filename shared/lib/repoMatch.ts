/**
 * Normalizes a Git repository reference to `owner/repo` format.
 * Handles URLs like `https://github.com/owner/repo`,
 * `git@github.com:owner/repo.git`, and plain `owner/repo`.
 */
export function normalizeRepo(raw: string): string {
  let normalized = raw.trim();
  normalized = normalized.replace(/\.git$/, '');
  normalized = normalized.replace(/^https?:\/\/github\.com\//, '');
  normalized = normalized.replace(/^git@github\.com:/, '');
  normalized = normalized.replace(/\/$/, '');
  return normalized.toLowerCase();
}

export function repoMatches(renderRepo: string | null | undefined, githubFullName: string | null | undefined): boolean {
  if (!renderRepo || !githubFullName) return false;
  return normalizeRepo(renderRepo) === normalizeRepo(githubFullName);
}
