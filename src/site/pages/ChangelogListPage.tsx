import React from 'react';
import { ContentListPage } from '../components/ContentListPage';
import type { ArticleRow } from '../../../shared/schemas/article';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderChangelogs(entries: ArticleRow[]) {
  return (
    <div className="col-span-full mt-10 flex flex-col gap-8 max-w-article-content">
      {entries.map((entry) => (
        <a
          key={entry.slug}
          href={`/changelog/${entry.slug}`}
          className="group flex flex-col gap-3 rounded-card border border-border-subtle p-6 transition-colors hover:border-border-default hover:bg-surface-frost-05"
        >
          <time className="text-caption-sm text-text-tertiary">
            {formatDate(entry.published_at)}
          </time>
          <span className="text-caption-lg text-text-primary group-hover:text-text-secondary transition-colors">
            {entry.title}
          </span>
          {entry.excerpt && (
            <span className="text-body text-text-tertiary line-clamp-2">
              {entry.excerpt}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

export function ChangelogListPage() {
  return (
    <ContentListPage
      title="Changelog"
      listProps={{
        emptyMessage: 'No changelog entries yet.',
        fetchUrl: '/api/articles?type=changelog',
        renderItems: renderChangelogs,
      }}
    />
  );
}
