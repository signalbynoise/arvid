import { useEffect, useRef, useCallback } from 'react';
import { Command } from 'cmdk';
import { Loader2 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { useStore, selectSearchResults, selectSearchStatus, selectSearchHasMore } from '../../store';
import { SearchResultItem } from './SearchResultItem';
import type { SearchResult } from '../../types';

interface SearchResultGroupProps {
  onSelectResult: (result: SearchResult) => void;
}

export function SearchResultGroup({ onSelectResult }: SearchResultGroupProps) {
  const results = useStore(selectSearchResults);
  const status = useStore(selectSearchStatus);
  const hasMore = useStore(selectSearchHasMore);
  const loadMore = useStore(s => s.loadMoreSearchResults);

  const sentinelRef = useRef<HTMLDivElement>(null);

  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0]?.isIntersecting && hasMore && status !== 'loading') {
        loadMore();
      }
    },
    [hasMore, status, loadMore],
  );

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(handleIntersect, { threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [handleIntersect]);

  if (status === 'idle') return null;

  const isLoading = status === 'loading';
  const isEmpty = status === 'ready' && results.length === 0;

  return (
    <Command.Group
      heading={
        <div className="flex items-center justify-between">
          <span>Search Results</span>
          {status === 'ready' && results.length > 0 && (
            <span className="text-text-empty">
              {results.length}{hasMore ? '+' : ''} {results.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>
      }
      className="[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-[var(--fw-medium)] [&_[cmdk-group-heading]]:text-text-quaternary [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest"
    >
      {results.map(result => (
        <SearchResultItem
          key={result.entityId}
          result={result}
          onSelect={onSelectResult}
        />
      ))}

      {isEmpty && (
        <div className="py-6 text-center text-caption text-text-quaternary">
          No matching results.
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={ICON_SIZE.md} className="animate-spin text-text-quaternary" />
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </Command.Group>
  );
}
