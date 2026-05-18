import React from 'react';
import { ArrowUpRight } from 'lucide-react';

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

      <a href="/articles" className="site-btn-secondary site-btn-md">
        All articles
        <ArrowUpRight size={14} />
      </a>
    </aside>
  );
}
