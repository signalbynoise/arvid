import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';
import { ContentListPage } from '../components/ContentListPage';
import { ShareSidebar } from '../components/article/ShareSidebar';
import { ArticleContent } from '../components/article/ArticleBlockRenderer';
import { RecentChangelogsSidebar } from '../components/changelog/RecentChangelogsSidebar';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

export function ChangelogPage() {
  const { slug } = useParams<{ slug: string }>();
  const [entry, setEntry] = useState<ArticleRow | null>(null);
  const [recent, setRecent] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setError(null);

    Promise.all([
      publicGet<ArticleRow>(`/api/articles/${slug}`),
      publicGet<ArticleRow[]>('/api/articles?type=changelog&limit=10'),
    ])
      .then(([entryData, recentData]) => {
        setEntry(entryData);
        setRecent(recentData);
      })
      .catch((err) => {
        const message = err instanceof Error ? err.message : 'Failed to load changelog';
        setError(message);
        console.error('[error] [ChangelogPage:fetch]', { slug, message });
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const pageUrl = `${window.location.origin}/changelog/${slug ?? ''}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(pageUrl).then(
      () => { /* success */ },
      (err: unknown) => {
        console.warn('[ChangelogPage:copyLink] clipboard write failed', { err, pageUrl });
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

  if (error || !entry) {
    return (
      <ContentListPage title="Changelog not found">
        <p className="text-body text-text-tertiary">{error ?? 'Changelog not found'}</p>
        <a href="/changelog" className="text-caption link-default">
          Browse all updates
        </a>
      </ContentListPage>
    );
  }

  return (
    <ContentListPage
      title={entry.title}
      subtitle={
        <p className="text-btn text-text-tertiary">
          {entry.published_at
            ? new Date(entry.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
            : ''}
        </p>
      }
      leftPanel={<RecentChangelogsSidebar entries={recent} currentSlug={slug ?? ''} />}
      rightPanel={<ShareSidebar articleUrl={pageUrl} />}
    >
      <ArticleContent content={entry.content} />

      <AnimateIcon animateOnHover asChild>
        <button
          type="button"
          onClick={handleCopyLink}
          className="site-btn-secondary"
        >
          Copy link
          <ChevronRight size={16} />
        </button>
      </AnimateIcon>
    </ContentListPage>
  );
}
