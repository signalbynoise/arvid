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
      <div className="h-100 w-full rounded-card bg-surface-frost-10" />
    );
  }

  return (
    <p className="text-body text-text-tertiary">
      {block.content}
    </p>
  );
}
