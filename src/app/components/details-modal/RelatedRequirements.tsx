import React from 'react';
import { Link2 } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';

interface SimilarItem {
  id: string;
  shortId: string | null;
  title: string;
  score: number;
}

interface RelatedRequirementsProps {
  similarities: SimilarItem[];
  onSelect: (id: string) => void;
}

export function RelatedRequirements({ similarities, onSelect }: RelatedRequirementsProps) {
  if (similarities.length === 0) return null;

  return (
    <div className="space-y-2">
        {similarities.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className="w-full flex items-center justify-between p-3 rounded-card bg-surface-frost-02 border border-border-default hover:border-border-focus transition-all text-left"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-7 w-7 rounded-full bg-surface-frost-08 flex items-center justify-center shrink-0">
                <Link2 size={ICON_SIZE.xs} className="text-text-tertiary" />
              </div>
              <div className="min-w-0">
                <span className="block text-label text-text-quaternary">
                  {s.shortId ?? s.id.slice(0, 6)}
                </span>
                <p className="text-caption-lg text-text-primary truncate">{s.title}</p>
              </div>
            </div>
            <span className="text-label text-text-tertiary px-2 py-0.5 bg-surface-frost-04 rounded-pill shrink-0">
              {Math.round(s.score * 100)}%
            </span>
          </button>
        ))}
    </div>
  );
}
