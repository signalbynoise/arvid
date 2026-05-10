import React, { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { TopNav } from '../components/TopNav';
import { CtaSection } from '../components/CtaSection';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

export function ArticlesListPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicGet<ArticleRow[]>('/api/articles')
      .then(setArticles)
      .catch((err) => {
        console.error('[error] [ArticlesListPage] Failed to fetch articles', {
          message: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-black text-text-primary antialiased">
      <TopNav />

      <div className="mx-auto max-w-article-content px-6 pt-30 lg:max-w-grid lg:px-10">
        <h1 className="text-h1 text-text-primary">Articles</h1>

        {loading ? (
          <p className="mt-10 text-body text-text-tertiary">Loading...</p>
        ) : articles.length === 0 ? (
          <p className="mt-10 text-body text-text-tertiary">No articles yet.</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <a
                key={article.slug}
                href={`/articles/${article.slug}`}
                className="group flex flex-col gap-10 overflow-hidden rounded-card bg-surface-panel pt-10"
              >
                <div className="flex flex-col gap-2 px-6">
                  <p className="text-caption-lg text-text-primary">
                    {article.title}
                  </p>
                  <p className="text-caption-lg text-text-tertiary">
                    {article.excerpt ?? ''}
                  </p>
                </div>

                <div className="mt-auto h-65 w-full rounded-t-card bg-surface-frost-10 transition-colors group-hover:bg-surface-frost-12" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="pt-30">
        <CtaSection />
      </div>
    </div>
  );
}
