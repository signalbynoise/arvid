interface ArticleCardProps {
  title: string;
  excerpt: string;
  slug: string;
  date?: string;
  author?: string;
  variant?: 'featured' | 'compact';
}

export function ArticleCard({ title, excerpt, slug, date, author, variant = 'compact' }: ArticleCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <a
      href={`/articles/${slug}`}
      className="group flex flex-col gap-4 rounded-card bg-surface-panel px-6 py-10"
    >
      <div className="flex flex-col gap-2">
        <p className="text-caption-lg text-text-primary">{title}</p>
        {(date || author) && (
          <p className="text-btn text-text-tertiary">
            {date}{author ? ` by ${author}` : ''}
          </p>
        )}
      </div>
      <p className="line-clamp-3 text-caption-lg text-text-tertiary">{excerpt}</p>

      {isFeatured && (
        <div className="mt-auto h-65 w-full rounded-t-card bg-surface-frost-10 transition-colors group-hover:bg-surface-frost-12" />
      )}
    </a>
  );
}
