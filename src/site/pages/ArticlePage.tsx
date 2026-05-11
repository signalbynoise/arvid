import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';
import { TopNav } from '../components/TopNav';
import { PageGrid } from '../components/PageGrid';
import { CtaSection } from '../components/CtaSection';
import { PopularArticlesSidebar } from '../components/article/PopularArticlesSidebar';
import { ShareSidebar } from '../components/article/ShareSidebar';
import { ArticleReadMore } from '../components/article/ArticleReadMore';
import { ArticleContent } from '../components/article/ArticleBlockRenderer';
import { publicGet } from '../lib/api';
import { MDA_REGISTRY } from '../lib/mdaRegistry';
import type { ArticleRow } from '../../../shared/schemas/article';

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [popular, setPopular] = useState<ArticleRow[]>([]);
  const [readMore, setReadMore] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    Promise.all([
      publicGet<ArticleRow>(`/api/articles/${slug}`),
      publicGet<ArticleRow[]>('/api/articles?limit=5'),
      publicGet<ArticleRow[]>('/api/articles?limit=6'),
    ])
      .then(([articleData, popularData, readMoreData]) => {
        setArticle(articleData);
        setPopular(popularData.filter((a) => a.slug !== slug));
        setReadMore(readMoreData.filter((a) => a.slug !== slug));
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load article';
        setError(message);
        console.error('[error] [ArticlePage:fetch]', { slug, message });
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const articleUrl = `${window.location.origin}/articles/${slug ?? ''}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(articleUrl).then(
      () => { /* success */ },
      (err: unknown) => {
        console.warn('[ArticlePage:copyLink] clipboard write failed', { err, articleUrl });
      },
    );
  }, [articleUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary antialiased">
        <TopNav />
        <div className="flex items-center justify-center pt-40">
          <p className="text-body text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary antialiased">
        <TopNav />
        <div className="flex flex-col items-center justify-center gap-4 pt-40">
          <p className="text-body text-text-tertiary">{error ?? 'Article not found'}</p>
          <a href="/articles" className="text-caption link-default">
            Browse all articles
          </a>
        </div>
      </div>
    );
  }

  const MdaComponent = article.mini_demo_id ? MDA_REGISTRY[article.mini_demo_id]?.component : null;

  return (
    <div className="min-h-screen bg-surface-base text-text-primary antialiased">
      <TopNav />

      <PageGrid className="pt-30">
        <div className="col-span-full flex items-stretch justify-between gap-10">
          <div className="hidden lg:block">
            <PopularArticlesSidebar
              articles={popular.map((a) => ({ title: a.title, slug: a.slug }))}
            />
          </div>

          <article className="flex w-full max-w-article-content flex-col gap-10">
            <header className="flex flex-col gap-6">
              <h1 className="text-h2 text-text-primary">
                {article.title}
              </h1>
              <p className="text-btn text-text-tertiary">
                {article.published_at
                  ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : ''}
                {article.author ? ` by ${article.author}` : ''}
              </p>
            </header>

            {MdaComponent && (
              <div className="overflow-hidden rounded-card bg-surface-frost-05">
                <Suspense fallback={<div className="h-100 w-full rounded-card bg-surface-frost-10" />}>
                  <MdaComponent />
                </Suspense>
              </div>
            )}

            <ArticleContent content={article.content} />

            <AnimateIcon animateOnHover asChild>
              <button
                type="button"
                onClick={handleCopyLink}
                className="site-btn-secondary"
              >
                Copy article link
                <ChevronRight size={16} />
              </button>
            </AnimateIcon>

            <p className="text-btn text-text-tertiary">
              {article.published_at
                ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : ''}
              {article.author ? ` by ${article.author}` : ''}
            </p>
          </article>

          <div className="hidden lg:block">
            <ShareSidebar articleUrl={articleUrl} />
          </div>
        </div>
      </PageGrid>

      <PageGrid className="pt-60">
        <div className="col-span-full">
          <ArticleReadMore
            articles={readMore.map((a) => ({
              title: a.title,
              description: a.excerpt ?? '',
              slug: a.slug,
            }))}
          />
        </div>
      </PageGrid>

      <div className="pt-30">
        <CtaSection />
      </div>
    </div>
  );
}
