import React from 'react';
import type { ArticleBlock } from '../../../../shared/schemas/article';

export type { ArticleBlock };

interface ArticleBlockRendererProps {
  block: ArticleBlock;
}

export function ArticleBlockRenderer({ block }: ArticleBlockRendererProps) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="text-body text-text-tertiary">
          {block.content}
        </p>
      );

    case 'image':
      if (block.src) {
        return (
          <img
            src={block.src}
            alt={block.alt ?? ''}
            className="w-full rounded-card"
          />
        );
      }
      return (
        <div className="h-100 w-full rounded-card bg-surface-frost-10" />
      );

    case 'heading': {
      const level = block.level ?? 2;
      const Tag = `h${Math.min(Math.max(level, 1), 6)}` as keyof JSX.IntrinsicElements;
      const headingClass = level <= 2 ? 'text-h2' : 'text-h3';
      return (
        <Tag className={`${headingClass} text-text-primary`}>
          {block.content}
        </Tag>
      );
    }

    case 'code':
      return (
        <pre className="overflow-x-auto rounded-card bg-surface-panel p-4">
          <code className="text-caption text-text-secondary">
            {block.content}
          </code>
        </pre>
      );

    case 'list':
      return (
        <ul className="flex list-disc flex-col gap-1 pl-6 text-body text-text-tertiary">
          {block.items?.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    default:
      return null;
  }
}
