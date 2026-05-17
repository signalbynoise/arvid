import React from 'react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';
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

      <AnimateIcon animateOnHover asChild>
        <a href="/changelog" className="site-btn-secondary">
          All updates
          <ChevronRight size={16} />
        </a>
      </AnimateIcon>
    </aside>
  );
}
