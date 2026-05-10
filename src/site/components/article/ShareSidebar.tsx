import React from 'react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';

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

      <AnimateIcon animateOnHover asChild>
        <button
          type="button"
          onClick={handleCopyLink}
          className="site-btn-secondary"
        >
          Copy article link
          <ChevronRight size={16} />
        </button>
      </AnimateIcon>
    </aside>
  );
}
