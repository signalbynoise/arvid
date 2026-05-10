import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../../constants/icons';
import { ARTICLE_LAYOUT } from '../../constants/article';

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
    <aside
      className="sticky flex flex-col items-end gap-6"
      style={{ top: ARTICLE_LAYOUT.stickyOffsetTop }}
    >
      <p className="text-[14px] font-[var(--fw-regular)] text-text-tertiary">
        Share
      </p>

      <button
        type="button"
        onClick={handleCopyLink}
        className="flex items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-[12px] font-[var(--fw-medium)] text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        Copy article link
        <ArrowUpRight size={ICON_SIZE.xs} />
      </button>
    </aside>
  );
}
