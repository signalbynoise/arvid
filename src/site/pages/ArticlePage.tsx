import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ContentListPage } from '../components/ContentListPage';
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
        setPopular(popularData.filter((a) => a.slug !== slug && a.type !== 'changelog'));
        setReadMore(readMoreData.filter((a) => a.slug !== slug && a.type !== 'changelog'));
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
      <ContentListPage title="Loading...">
        <p className="text-body text-text-tertiary">Loading...</p>
      </ContentListPage>
    );
  }

  if (error || !article) {
    return (
      <ContentListPage title="Article not found">
        <p className="text-body text-text-tertiary">{error ?? 'Article not found'}</p>
        <a href="/articles" className="text-caption link-default">
          Browse all articles
        </a>
      </ContentListPage>
    );
  }

  const MdaComponent = article.mini_demo_id ? MDA_REGISTRY[article.mini_demo_id]?.component : null;

  return (
    <ContentListPage
      title={article.title}
      subtitle={
        <p className="text-btn text-text-tertiary">
          {article.published_at
            ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : ''}
          {article.author ? ` by ${article.author}` : ''}
        </p>
      }
      leftPanel={
        <PopularArticlesSidebar
          articles={popular.map((a) => ({ title: a.title, slug: a.slug }))}
        />
      }
      rightPanel={<ShareSidebar articleUrl={articleUrl} />}
      footer={
        <ArticleReadMore
          articles={readMore.map((a) => ({
            title: a.title,
            description: a.excerpt ?? '',
            slug: a.slug,
          }))}
        />
      }
    >
      {MdaComponent && (
        <div className="overflow-hidden rounded-card bg-surface-frost-05">
          <Suspense fallback={<div className="h-100 w-full rounded-card bg-surface-frost-10" />}>
            <MdaComponent />
          </Suspense>
        </div>
      )}

      <ArticleContent content={article.content} />

      <button
        type="button"
        onClick={handleCopyLink}
        className="site-btn-secondary site-btn-md"
      >
        Copy article link
        <ArrowUpRight size={14} />
      </button>

      <p className="text-btn text-text-tertiary">
        {article.published_at
          ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          : ''}
        {article.author ? ` by ${article.author}` : ''}
      </p>
    </ContentListPage>
  );
}
