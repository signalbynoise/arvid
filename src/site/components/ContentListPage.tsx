import React, { useEffect, useState } from 'react';
import { TopNav } from './TopNav';
import { PageGrid } from './PageGrid';
import { CtaSection } from './CtaSection';
import { publicGet } from '../lib/api';
import type { ArticleRow } from '../../../shared/schemas/article';

interface ListPatternProps {
  emptyMessage: string;
  fetchUrl: string;
  filterFn?: (items: ArticleRow[]) => ArticleRow[];
  renderItems: (items: ArticleRow[]) => React.ReactNode;
}

interface ContentListPageProps {
  title: string;
  subtitle?: React.ReactNode;
  leftPanel?: React.ReactNode;
  rightPanel?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
  listProps?: ListPatternProps;
}

export function ContentListPage({
  title,
  subtitle,
  leftPanel,
  rightPanel,
  footer,
  children,
  listProps,
}: ContentListPageProps) {
  const [items, setItems] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(!!listProps);

  useEffect(() => {
    if (!listProps) return;
    publicGet<ArticleRow[]>(listProps.fetchUrl)
      .then((data) => (listProps.filterFn ? listProps.filterFn(data) : data))
      .then(setItems)
      .catch((err) => {
        console.error(`[error] [ContentListPage:${title}] Failed to fetch`, {
          message: err instanceof Error ? err.message : String(err),
        });
      })
      .finally(() => setLoading(false));
  }, [listProps?.fetchUrl]);

  const hasPanel = leftPanel != null || rightPanel != null;

  let bodyContent: React.ReactNode;
  if (children) {
    bodyContent = children;
  } else if (listProps) {
    bodyContent = loading ? (
      <p className="col-span-full mt-10 text-body text-text-tertiary">Loading...</p>
    ) : items.length === 0 ? (
      <p className="col-span-full mt-10 text-body text-text-tertiary">{listProps.emptyMessage}</p>
    ) : (
      listProps.renderItems(items)
    );
  }

  return (
    <div className="min-h-screen bg-surface-base text-text-primary antialiased">
      <TopNav />

      <PageGrid className="pt-30">
        {hasPanel ? (
          <>
            <div className="col-span-full flex justify-between gap-10">
              <div className="hidden w-article-sidebar shrink-0 lg:block" aria-hidden="true" />
              <div className="flex w-full max-w-article-content flex-col gap-6">
                <h1 className="text-h2 text-text-primary">{title}</h1>
                {subtitle}
              </div>
              <div className="hidden w-article-sidebar shrink-0 lg:block" aria-hidden="true" />
            </div>

            <div className="col-span-full flex items-stretch justify-between gap-10">
              {leftPanel && (
                <div className="hidden shrink-0 lg:block">{leftPanel}</div>
              )}
              <div className="flex w-full max-w-article-content flex-col gap-10">
                {bodyContent}
              </div>
              {rightPanel && (
                <div className="hidden shrink-0 lg:block">{rightPanel}</div>
              )}
            </div>
          </>
        ) : (
          <>
            {title && (
              <div className="col-span-full flex flex-col gap-6">
                <h1 className="text-h2 text-text-primary">{title}</h1>
                {subtitle}
              </div>
            )}
            {bodyContent}
          </>
        )}
      </PageGrid>

      {footer && (
        <PageGrid className="pt-60">
          <div className="col-span-full">{footer}</div>
        </PageGrid>
      )}

      <div className="pt-60">
        <CtaSection />
      </div>
    </div>
  );
}
