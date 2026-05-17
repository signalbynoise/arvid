import type { GitHubCommit } from './fetchCommits';

export interface CategorizedCommits {
  features: string[];
  fixes: string[];
  refactors: string[];
  docs: string[];
  chores: string[];
  other: string[];
}

const CATEGORY_PATTERNS: Array<{ pattern: RegExp; category: keyof CategorizedCommits }> = [
  { pattern: /^feat(\(.+\))?[!:]/, category: 'features' },
  { pattern: /^fix(\(.+\))?[!:]/, category: 'fixes' },
  { pattern: /^refactor(\(.+\))?[!:]/, category: 'refactors' },
  { pattern: /^docs(\(.+\))?[!:]/, category: 'docs' },
  { pattern: /^(chore|build|ci|test|style|perf)(\(.+\))?[!:]/, category: 'chores' },
];

export function categorizeCommits(commits: GitHubCommit[]): CategorizedCommits {
  const result: CategorizedCommits = {
    features: [],
    fixes: [],
    refactors: [],
    docs: [],
    chores: [],
    other: [],
  };

  for (const commit of commits) {
    const firstLine = commit.commit.message.split('\n')[0].trim();
    const matched = CATEGORY_PATTERNS.find((p) => p.pattern.test(firstLine));
    const category = matched?.category ?? 'other';
    const cleaned = firstLine.replace(/^[a-z]+(\(.+\))?[!:]?\s*/, '');
    result[category].push(cleaned || firstLine);
  }

  return result;
}

const CATEGORY_LABELS: Record<keyof CategorizedCommits, string> = {
  features: 'New Features',
  fixes: 'Bug Fixes',
  refactors: 'Refactoring',
  docs: 'Documentation',
  chores: 'Maintenance',
  other: 'Other Changes',
};

export function buildFallbackMarkdown(categorized: CategorizedCommits): string {
  const sections: string[] = [];

  for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
    const items = categorized[key as keyof CategorizedCommits];
    if (items.length > 0) {
      sections.push(`### ${label}\n\n${items.map((c) => `- ${c}`).join('\n')}`);
    }
  }

  return sections.join('\n\n');
}
