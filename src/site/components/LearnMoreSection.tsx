import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { PageGrid } from './PageGrid';

const ARTICLES = [
  {
    title: 'Arvid knows your code',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code',
  },
  {
    title: 'Arvid knows your code',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code-2',
  },
  {
    title: 'Arvid knows your code',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code-3',
  },
];

export function LearnMoreSection() {
  return (
    <PageGrid as="section" className="w-full">
      <h2 className="col-span-full text-h2 text-text-primary">
        Learn more about Arvid
      </h2>

      {ARTICLES.map((article) => (
        <a
          key={article.slug}
          href={`/articles/${article.slug}`}
          className="col-span-full md:col-span-6 lg:col-span-4 group relative flex h-100 flex-col gap-8 overflow-hidden rounded-card bg-surface-panel px-5 pt-10"
        >
          <div className="flex flex-col gap-2">
            <p className="text-btn text-text-primary">
              {article.title}
            </p>
            <p className="text-btn text-text-tertiary">
              {article.description}
            </p>
          </div>

          <div className="mt-auto h-65 w-full rounded-t-card bg-surface-frost-10 transition-colors group-hover:bg-surface-frost-12" />
        </a>
      ))}

      <a
        href="/articles"
        className="col-span-full flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-btn text-text-primary transition-colors hover:bg-surface-frost-15"
      >
        Browse all articles about Arvid
        <ArrowUpRight size={ICON_SIZE.xs} />
      </a>
    </PageGrid>
  );
}
