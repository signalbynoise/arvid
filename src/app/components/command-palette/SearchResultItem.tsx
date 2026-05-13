import { Command } from 'cmdk';
import type { SearchResult } from '../../types';

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
}

export function SearchResultItem({ result, onSelect }: SearchResultItemProps) {
  return (
    <Command.Item
      value={`search-${result.entityId}`}
      onSelect={() => onSelect(result)}
      className="flex gap-4 items-start px-4 py-3 cursor-pointer transition-colors data-[selected=true]:bg-surface-frost-08"
    >
      {result.shortId && (
        <span className="shrink-0 text-[11px] font-[var(--fw-medium)] text-text-empty pt-[3px]">
          {result.shortId}
        </span>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <span className="text-caption-lg text-text-primary truncate">
          {result.label}
        </span>
        {result.snippet && (
          <span
            className="text-[12px] font-[var(--fw-regular)] text-text-tertiary truncate [&_b]:text-text-primary [&_b]:font-[var(--fw-medium)]"
            dangerouslySetInnerHTML={{ __html: result.snippet }}
          />
        )}
        {result.author && (
          <span className="text-[11px] font-[var(--fw-regular)] text-text-tertiary">
            {result.author}
          </span>
        )}
      </div>
    </Command.Item>
  );
}
