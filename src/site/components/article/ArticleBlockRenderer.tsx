import React from 'react';

export interface ArticleBlock {
  type: 'paragraph' | 'image';
  content?: string;
  src?: string;
  alt?: string;
}

interface ArticleBlockRendererProps {
  block: ArticleBlock;
}

export function ArticleBlockRenderer({ block }: ArticleBlockRendererProps) {
  if (block.type === 'image') {
    return (
      <div className="h-[400px] w-full rounded-card bg-surface-frost-10" />
    );
  }

  return (
    <p className="text-[16px] font-[var(--fw-regular)] leading-[24px] text-text-tertiary">
      {block.content}
    </p>
  );
}
