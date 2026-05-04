import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const ARTICLES = [
  {
    title: 'Arvid knows your code',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
  },
  {
    title: 'Arvid knows your code',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
  },
  {
    title: 'Arvid knows your code',
    description:
      'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
  },
];

export function LearnMoreSection() {
  return (
    <section className="w-full px-6">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-10">
        <h2 className="text-[24px] font-[var(--fw-regular)] leading-normal text-text-primary">
          Learn more about Arvid
        </h2>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
          {ARTICLES.map((article, index) => (
            <div
              key={index}
              className="relative flex h-[400px] flex-col gap-8 overflow-hidden rounded-card bg-surface-panel px-5 pt-10"
            >
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-[var(--fw-medium)] text-text-primary">
                  {article.title}
                </p>
                <p className="text-[12px] font-[var(--fw-regular)] text-text-tertiary">
                  {article.description}
                </p>
              </div>

              <div className="mt-auto h-[260px] w-full rounded-t-card bg-surface-frost-10" />
            </div>
          ))}
        </div>

        <a
          href="#"
          className="flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-[12px] font-[var(--fw-medium)] text-text-primary transition-colors hover:bg-surface-frost-15"
        >
          Browse all articles about Arvid
          <ArrowUpRight size={12} />
        </a>
      </div>
    </section>
  );
}
