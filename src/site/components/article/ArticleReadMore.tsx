import React from 'react';
import { AnimateIcon } from '@/components/animate-ui/icons/icon';
import { ChevronRight } from '@/components/animate-ui/icons/chevron-right';
import { ArticleCard } from './ArticleCard';

export interface ReadMoreArticle {
  title: string;
  description: string;
  slug: string;
}

interface ArticleReadMoreProps {
  articles: ReadMoreArticle[];
}

export function ArticleReadMore({ articles }: ArticleReadMoreProps) {
  return (
    <section className="flex flex-col gap-10">
      <h2 className="text-h2 text-text-primary">
        Read more about Arvid
      </h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <ArticleCard
            key={article.slug}
            title={article.title}
            excerpt={article.description}
            slug={article.slug}
            variant="compact"
          />
        ))}
      </div>

      <AnimateIcon animateOnHover asChild>
        <a href="/articles" className="site-btn-secondary">
          Browse all articles about Arvid
          <ChevronRight size={16} />
        </a>
      </AnimateIcon>
    </section>
  );
}
