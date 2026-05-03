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
      className={`p-1 rounded-[4px] text-[#62666d] hover:text-[#f7f8f8] hover:bg-[rgba(255,255,255,0.1)] transition-colors ${className}`}
    >
      {children}
    </button>
  );
}
