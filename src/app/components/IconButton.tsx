import React from 'react';

interface IconButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function IconButton({ onClick, title, children, className = '' }: IconButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`p-1 rounded-standard text-text-quaternary hover:text-text-primary hover:bg-surface-frost-10 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
