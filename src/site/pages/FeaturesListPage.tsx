import React from 'react';
import { ContentListPage } from '../components/ContentListPage';
import { ArticleCard } from '../components/article/ArticleCard';
import type { ArticleRow } from '../../../shared/schemas/article';

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderFeatures(articles: ArticleRow[]) {
  return (
    <div className="col-span-full mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard
          key={article.slug}
          title={article.title}
          excerpt={article.excerpt ?? ''}
          slug={article.slug}
          date={formatDate(article.published_at)}
          author={article.author ?? undefined}
          miniDemoId={article.mini_demo_id}
          variant="compact"
        />
      ))}
    </div>
  );
}

export function FeaturesListPage() {
  return (
    <ContentListPage
      title="Features"
      listProps={{
        emptyMessage: 'No feature articles yet.',
        fetchUrl: '/api/articles?type=feature',
        renderItems: renderFeatures,
      }}
    />
  );
}
