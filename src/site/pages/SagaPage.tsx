import React, { useEffect, useState, useCallback } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ContentListPage } from '../components/ContentListPage';
import { ArticleContent } from '../components/article/ArticleBlockRenderer';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

const SAGA_SLUG = 'saga';

export function SagaPage() {
  const [article, setArticle] = useState<ArticleRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    publicGet<ArticleRow>(`/api/articles/${SAGA_SLUG}`)
      .then(setArticle)
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load page';
        setError(message);
        console.error('[error] [SagaPage:fetch]', { message });
      })
      .finally(() => setLoading(false));
  }, []);

  const pageUrl = `${window.location.origin}/saga`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(pageUrl).then(
      () => { /* success */ },
      (err: unknown) => {
        console.warn('[SagaPage:copyLink] clipboard write failed', { err, pageUrl });
      },
    );
  }, [pageUrl]);

  if (loading) {
    return (
      <ContentListPage title="Loading...">
        <p className="text-body text-text-tertiary">Loading...</p>
      </ContentListPage>
    );
  }

  if (error || !article) {
    return (
      <ContentListPage title="Page not found">
        <p className="text-body text-text-tertiary">{error ?? 'Page not found'}</p>
        <a href="/" className="text-caption link-default">Back to home</a>
      </ContentListPage>
    );
  }

  const formattedDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';
  const byline = `${formattedDate}${article.author ? ` by ${article.author}` : ''}`;

  return (
    <ContentListPage title="">
      <div className="col-span-full flex justify-center">
        <div className="flex w-full max-w-article-content flex-col gap-10">
          <div className="flex flex-col gap-6">
            <h1 className="text-h2 text-text-primary">{article.title}</h1>
            <p className="text-btn text-text-tertiary">{byline}</p>
          </div>

          <ArticleContent content={article.content} />

          <button
            type="button"
            onClick={handleCopyLink}
            className="site-btn-secondary site-btn-md"
          >
            Copy article link
            <ArrowUpRight size={14} />
          </button>

          <p className="text-btn text-text-tertiary">{byline}</p>
        </div>
      </div>
    </ContentListPage>
  );
}
