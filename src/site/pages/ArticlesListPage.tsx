import React, { useEffect, useState, useMemo } from 'react';
import { TopNav } from '../components/TopNav';
import { PageGrid } from '../components/PageGrid';
import { SiteSearchInput } from '../components/SiteSearchInput';
import { ArticleCard } from '../components/article/ArticleCard';
import { CtaSection } from '../components/CtaSection';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

const FEATURED_COUNT = 3;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ArticlesListPage() {
  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  const filtered = useMemo(() => {
    if (!search.trim()) return articles;
    const query = search.toLowerCase();
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(query) ||
        (a.excerpt ?? '').toLowerCase().includes(query),
    );
  }, [articles, search]);

  const featured = filtered.slice(0, FEATURED_COUNT);
  const rest = filtered.slice(FEATURED_COUNT);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary antialiased">
      <TopNav />

      <PageGrid className="pt-30">
        <div className="col-span-full flex flex-col gap-6">
          <h1 className="text-h2 text-text-primary">Articles</h1>
          <SiteSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search articles about Arvid"
          />
        </div>

        {loading ? (
          <p className="col-span-full mt-10 text-body text-text-tertiary">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="col-span-full mt-10 text-body text-text-tertiary">
            {search ? 'No articles match your search.' : 'No articles yet.'}
          </p>
        ) : (
          <>
            <div className="col-span-full mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featured.map((article) => (
                <ArticleCard
                  key={article.slug}
                  title={article.title}
                  excerpt={article.excerpt ?? ''}
                  slug={article.slug}
                  date={formatDate(article.published_at)}
                  author={article.author ?? undefined}
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
                    variant="compact"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </PageGrid>

      <div className="pt-60">
        <CtaSection />
      </div>
    </div>
  );
}
