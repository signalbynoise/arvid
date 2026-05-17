import React, { useEffect, useState } from 'react';
import { TopNav } from './TopNav';
import { PageGrid } from './PageGrid';
import { CtaSection } from './CtaSection';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

interface ContentListPageProps {
  title: string;
  emptyMessage: string;
  fetchUrl: string;
  filterFn?: (items: ArticleRow[]) => ArticleRow[];
  renderItems: (items: ArticleRow[]) => React.ReactNode;
}

export function ContentListPage({ title, emptyMessage, fetchUrl, filterFn, renderItems }: ContentListPageProps) {
  const [items, setItems] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    publicGet<ArticleRow[]>(fetchUrl)
      .then((data) => (filterFn ? filterFn(data) : data))
      .then(setItems)
      .catch((err) => {
        console.error(`[error] [ContentListPage:${title}] Failed to fetch`, {
          message: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => setLoading(false));
  }, [fetchUrl]);

  return (
    <div className="min-h-screen bg-surface-base text-text-primary antialiased">
      <TopNav />

      <PageGrid className="pt-30">
        <div className="col-span-full">
          <h1 className="text-h2 text-text-primary">{title}</h1>
        </div>

        {loading ? (
          <p className="col-span-full mt-10 text-body text-text-tertiary">Loading...</p>
        ) : items.length === 0 ? (
          <p className="col-span-full mt-10 text-body text-text-tertiary">
            {emptyMessage}
          </p>
        ) : (
          renderItems(items)
        )}
      </PageGrid>

      <div className="pt-60">
        <CtaSection />
      </div>
    </div>
  );
}
