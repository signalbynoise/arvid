import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';

export interface ReadMoreArticle {
  title: string;
  description: string;
  slug: string;
}

interface ArticleReadMoreProps {
  articles: ReadMoreArticle[];
}

export function ArticleReadMore({ articles }: ArticleReadMoreProps) {
  return (
    <section className="flex flex-col gap-10">
      <h2 className="text-[24px] font-[var(--fw-regular)] leading-normal text-text-primary">
        Read more about Arvid
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <a
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="group flex flex-col gap-10 overflow-hidden rounded-card bg-surface-panel pt-10"
          >
            <div className="flex flex-col gap-2 px-6">
              <p className="text-[14px] font-[var(--fw-medium)] text-text-primary">
                {article.title}
              </p>
              <p className="text-[14px] font-[var(--fw-regular)] text-text-tertiary">
                {article.description}
              </p>
            </div>

            <div className="mt-auto h-[260px] w-full rounded-t-card bg-surface-frost-10 transition-colors group-hover:bg-surface-frost-12" />
          </a>
        ))}
      </div>

      <a
        href="/articles"
        className="flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-[12px] font-[var(--fw-medium)] text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        Browse all articles about Arvid
        <ArrowUpRight size={ICON_SIZE.xs} />
      </a>
    </section>
  );
}
