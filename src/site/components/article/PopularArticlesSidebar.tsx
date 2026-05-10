import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';

export interface PopularArticle {
  title: string;
  slug: string;
}

interface PopularArticlesSidebarProps {
  articles: PopularArticle[];
}

export function PopularArticlesSidebar({ articles }: PopularArticlesSidebarProps) {
  return (
    <aside className="sticky top-40 flex w-article-sidebar flex-col gap-6">
      <p className="text-caption-lg text-text-tertiary">
        Popular Articles
      </p>

      {articles.map((article) => (
        <a
          key={article.slug}
          href={`/articles/${article.slug}`}
          className="text-btn leading-normal text-text-primary transition-colors hover:text-text-secondary"
        >
          {article.title}
        </a>
      ))}

      <a
        href="/articles"
        className="flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-btn text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        All articles
        <ArrowUpRight size={ICON_SIZE.xs} />
      </a>
    </aside>
  );
}
