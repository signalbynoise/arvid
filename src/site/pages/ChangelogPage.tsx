import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';
import { TopNav } from '../components/TopNav';
import { PageGrid } from '../components/PageGrid';
import { CtaSection } from '../components/CtaSection';
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
      <div className="min-h-screen bg-surface-base text-text-primary antialiased">
        <TopNav />
        <div className="flex items-center justify-center pt-40">
          <p className="text-body text-text-tertiary">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !entry) {
    return (
      <div className="min-h-screen bg-surface-base text-text-primary antialiased">
        <TopNav />
        <div className="flex flex-col items-center justify-center gap-4 pt-40">
          <p className="text-body text-text-tertiary">{error ?? 'Changelog not found'}</p>
          <a href="/changelog" className="text-caption link-default">
            Browse all updates
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-text-primary antialiased">
      <TopNav />

      <PageGrid className="pt-30">
        <div className="col-span-full flex items-stretch justify-between gap-10">
          <div className="hidden lg:block">
            <RecentChangelogsSidebar entries={recent} currentSlug={slug ?? ''} />
          </div>

          <article className="flex w-full max-w-article-content flex-col gap-10">
            <header className="flex flex-col gap-6">
              <h1 className="text-h2 text-text-primary">
                {entry.title}
              </h1>
              <p className="text-btn text-text-tertiary">
                {entry.published_at
                  ? new Date(entry.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                  : ''}
              </p>
            </header>

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
          </article>

          <div className="hidden lg:block">
            <ShareSidebar articleUrl={pageUrl} />
          </div>
        </div>
      </PageGrid>

      <div className="pt-30">
        <CtaSection />
      </div>
    </div>
  );
}
