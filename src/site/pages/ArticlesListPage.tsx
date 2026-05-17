import React from 'react';
import { ContentListPage } from '../components/ContentListPage';
import { ArticleCard } from '../components/article/ArticleCard';
import type { ArticleRow } from '../../../shared/schemas/article';

const FEATURED_COUNT = 4;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function renderArticles(articles: ArticleRow[]) {
  const featured = articles.slice(0, FEATURED_COUNT);
  const rest = articles.slice(FEATURED_COUNT);

  return (
    <>
      <div className="col-span-full mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        {featured.map((article) => (
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

      {rest.length > 0 && (
        <div className="col-span-full mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {rest.map((article) => (
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
      )}
    </>
  );
}

export function ArticlesListPage() {
  return (
    <ContentListPage
      title="Articles"
      emptyMessage="No articles yet."
      fetchUrl="/api/articles"
      filterFn={(data) => data.filter((a) => a.type !== 'changelog')}
      renderItems={renderArticles}
    />
  );
}
