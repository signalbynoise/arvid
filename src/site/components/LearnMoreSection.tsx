import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { PageGrid } from './PageGrid';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

export function LearnMoreSection() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);

  useEffect(() => {
    publicGet<ArticleRow[]>('/api/articles?type=article&limit=3')
      .then(setArticles)
      .catch((err) => {
        console.warn('[warn] [LearnMoreSection] Failed to fetch articles', {
          message: err instanceof Error ? err.message : String(err),
        });
      });
  }, []);

  if (articles.length === 0) return null;

  return (
    <PageGrid as="section" className="w-full">
      <h2 className="col-span-full text-h2 text-text-primary">
        Learn more about Arvid
      </h2>

      {articles.map((article) => (
        <a
          key={article.slug}
          href={`/articles/${article.slug}`}
          className="col-span-full md:col-span-6 lg:col-span-4 group relative flex h-100 flex-col gap-8 overflow-hidden rounded-card bg-surface-panel px-5 pt-10"
        >
          <div className="flex flex-col gap-2">
            <p className="text-btn text-text-primary">
              {article.title}
            </p>
            <p className="text-btn text-text-tertiary">
              {article.excerpt ?? ''}
            </p>
          </div>

          <div className="mt-auto h-65 w-full rounded-t-card bg-surface-frost-10 transition-colors group-hover:bg-surface-frost-12" />
        </a>
      ))}

      <a
        href="/articles"
        className="col-span-full flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-btn text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        Browse all articles about Arvid
        <ArrowUpRight size={ICON_SIZE.xs} />
      </a>
    </PageGrid>
  );
}
