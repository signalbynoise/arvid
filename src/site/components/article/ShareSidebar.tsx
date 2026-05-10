import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';

interface ShareSidebarProps {
  articleUrl: string;
  onCopyResult?: (success: boolean) => void;
}

export function ShareSidebar({ articleUrl, onCopyResult }: ShareSidebarProps) {
  function handleCopyLink() {
    navigator.clipboard.writeText(articleUrl).then(
      () => onCopyResult?.(true),
      () => onCopyResult?.(false),
    );
  }

  return (
    <aside className="sticky top-40 flex flex-col items-end gap-6">
      <p className="text-caption-lg text-text-tertiary">
        Share
      </p>

      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-btn text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        Copy article link
        <ArrowUpRight size={ICON_SIZE.xs} />
      </button>
    </aside>
  );
}
