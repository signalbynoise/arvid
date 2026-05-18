import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PageGrid } from './PageGrid';
import { ArticleCard } from './article/ArticleCard';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function LearnMoreSection() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);

  useEffect(() => {
    publicGet<ArticleRow[]>('/api/articles?type=article&limit=4')
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

      <div className="col-span-full grid grid-cols-1 gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard
            key={article.slug}
            title={article.title}
            excerpt={article.excerpt ?? ''}
            slug={article.slug}
            date={formatDate(article.published_at)}
            author={article.author ?? undefined}
            miniDemoId={article.mini_demo_id}
            variant="featured"
          />
        ))}
      </div>

      <a href="/articles" className="site-btn-secondary site-btn-md col-span-full">
        Browse all articles about Arvid
        <ArrowUpRight size={14} />
      </a>
    </PageGrid>
  );
}
