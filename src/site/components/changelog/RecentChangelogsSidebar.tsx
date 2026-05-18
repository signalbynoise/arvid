import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import type { ArticleRow } from '../../../../shared/schemas/article';

interface RecentChangelogsSidebarProps {
  entries: ArticleRow[];
  currentSlug: string;
}

export function RecentChangelogsSidebar({ entries, currentSlug }: RecentChangelogsSidebarProps) {
  const others = entries.filter((e) => e.slug !== currentSlug);

  return (
    <aside className="sticky top-40 flex w-article-sidebar flex-col gap-6">
      <p className="text-caption-lg text-text-tertiary">Recent Updates</p>

      {others.map((entry) => (
        <a
          key={entry.slug}
          href={`/changelog/${entry.slug}`}
          className="text-btn leading-normal text-text-primary transition-colors hover:text-text-secondary"
        >
          {entry.published_at
            ? new Date(entry.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : entry.title}
        </a>
      ))}

      <a href="/changelog" className="site-btn-secondary site-btn-md">
        All updates
        <ArrowUpRight size={14} />
      </a>
    </aside>
  );
}
