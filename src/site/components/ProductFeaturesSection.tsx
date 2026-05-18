import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { PageGrid } from './PageGrid';
import { ArticleCard } from './article/ArticleCard';

const FEATURES = [
  {
    title: 'Arvid loves Linear',
    excerpt:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'arvid-loves-linear',
    href: '/features',
  },
  {
    title: 'Arvid talks to Slack',
    excerpt:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'arvid-talks-to-slack',
    href: '/features',
  },
];

export function ProductFeaturesSection() {
  return (
    <PageGrid as="section" className="w-full">
      <h2 className="col-span-full text-h2 text-text-primary">
        Arvid can do a lot
      </h2>

      <div className="col-span-full grid grid-cols-1 gap-6 md:grid-cols-2">
        {FEATURES.map((feature) => (
          <ArticleCard
            key={feature.slug}
            title={feature.title}
            excerpt={feature.excerpt}
            slug={feature.slug}
            href={feature.href}
            variant="featured"
          />
        ))}
      </div>

      <a href="/articles" className="site-btn-secondary site-btn-md col-span-full">
        Browse all articles about Arvid
        <ArrowUpRight size={14} />
      </a>
    </PageGrid>
  );
}
