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
      className={`flex items-center justify-center px-1 text-text-quaternary hover:text-text-primary transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
