import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { ARTICLE_LAYOUT } from '../../constants/article';

export interface PopularArticle {
  title: string;
  slug: string;
}

interface PopularArticlesSidebarProps {
  articles: PopularArticle[];
}

export function PopularArticlesSidebar({ articles }: PopularArticlesSidebarProps) {
  return (
    <aside
      className="sticky flex flex-col gap-6"
      style={{
        top: ARTICLE_LAYOUT.stickyOffsetTop,
        width: ARTICLE_LAYOUT.sidebarWidth,
      }}
    >
      <p className="text-[14px] font-[var(--fw-regular)] text-text-tertiary">
        Popular Articles
      </p>

      {articles.map((article) => (
        <a
          key={article.slug}
          href={`/articles/${article.slug}`}
          className="text-[12px] font-[var(--fw-medium)] leading-normal text-text-primary transition-colors hover:text-text-secondary"
        >
          {article.title}
        </a>
      ))}

      <a
        href="/articles"
        className="flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-[12px] font-[var(--fw-medium)] text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        All articles
        <ArrowUpRight size={ICON_SIZE.xs} />
      </a>
    </aside>
  );
}
