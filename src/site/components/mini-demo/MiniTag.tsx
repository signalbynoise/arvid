import React from 'react';

interface MiniTagProps {
  children: React.ReactNode;
}

export function MiniTag({ children }: MiniTagProps) {
  return <span className="text-[6px] px-1 py-0.5 bg-surface-frost-05 border border-border-subtle rounded-micro text-text-quaternary">{children}</span>;
}

interface MiniTagListProps {
  tags: string[];
}

export function MiniTagList({ tags }: MiniTagListProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {tags.map(tag => <MiniTag key={tag}>{tag}</MiniTag>)}
    </div>
  );
}
