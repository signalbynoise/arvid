import React from 'react';
import { ArrowUpRight } from 'lucide-react';

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
        className="site-btn-secondary site-btn-md"
      >
        Copy article link
        <ArrowUpRight size={14} />
      </button>
    </aside>
  );
}
