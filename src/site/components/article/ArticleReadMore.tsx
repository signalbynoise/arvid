import React from 'react';
import { ArrowUpRight } from 'lucide-react';
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

      <a href="/articles" className="site-btn-secondary site-btn-md">
        Browse all articles about Arvid
        <ArrowUpRight size={14} />
      </a>
    </section>
  );
}
