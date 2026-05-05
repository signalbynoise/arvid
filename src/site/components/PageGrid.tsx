interface PageGridProps {
  children: React.ReactNode;
  className?: string;
  as?: keyof React.JSX.IntrinsicElements;
}

export function PageGrid({ children, className, as: Tag = 'div' }: PageGridProps) {
  return <Tag className={`page-grid ${className ?? ''}`}>{children}</Tag>;
}
