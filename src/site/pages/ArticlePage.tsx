import React, { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ICON_SIZE } from '../../constants/icons';
import { TopNav } from '../components/TopNav';
import { CtaSection } from '../components/CtaSection';
import { PopularArticlesSidebar } from '../components/article/PopularArticlesSidebar';
import { ShareSidebar } from '../components/article/ShareSidebar';
import { ArticleReadMore } from '../components/article/ArticleReadMore';
import { ArticleBlockRenderer } from '../components/article/ArticleBlockRenderer';
import type { ArticleBlock } from '../components/article/ArticleBlockRenderer';
import type { PopularArticle } from '../components/article/PopularArticlesSidebar';
import type { ReadMoreArticle } from '../components/article/ArticleReadMore';

interface ArticleData {
  title: string;
  date: string;
  author: string;
  location: string;
  blocks: ArticleBlock[];
}

const PLACEHOLDER_ARTICLE: ArticleData = {
  title: 'Arvid does not care so much about well written issues for your backlog.',
  date: 'April 5 2026',
  author: 'Arvid',
  location: 'Stockholm, Sweden',
  blocks: [
    {
      type: 'paragraph',
      content:
        'Arvid is dedicated to constructing the comprehensive knowledge graph that every team has been eagerly anticipating. This essential resource integrates diverse data points into a unified framework, enabling seamless access to critical information across departments.',
    },
    { type: 'image', src: '', alt: 'Article illustration' },
    {
      type: 'paragraph',
      content:
        'Building on that foundation, Arvid is now focused on expanding the knowledge graph to include real-time data updates and advanced analytics. This next phase will enhance cross-team collaboration even further, providing dynamic insights that help everyone stay ahead and innovate faster.',
    },
    {
      type: 'paragraph',
      content:
        "Building on this foundation, Arvid is now focusing on enhancing the graph's real-time updating capabilities. This will ensure that teams always have the most current data at their fingertips, further improving decision-making speed and accuracy. Additionally, plans are underway to incorporate advanced analytics tools, allowing users to uncover deeper insights and trends within the integrated data. With these developments, the knowledge graph will become an even more powerful asset, driving collaboration and innovation to new heights across the organization.",
    },
    {
      type: 'paragraph',
      content:
        "Building on this foundation, Arvid is now focusing on enhancing the graph's real-time updating capabilities. This will ensure that teams always have the most current data at their fingertips, further improving decision-making speed and accuracy. Additionally, plans are underway to incorporate advanced analytics tools, allowing users to uncover deeper insights and trends within the integrated data. With these developments, the knowledge graph will become an even more powerful asset, driving collaboration and innovation to new heights across the organization.",
    },
    {
      type: 'paragraph',
      content:
        "Building on this foundation, Arvid is now focusing on enhancing the graph's real-time updating capabilities. This will ensure that teams always have the most current data at their fingertips, further improving decision-making speed and accuracy. Additionally, plans are underway to incorporate advanced analytics tools, allowing users to uncover deeper insights and trends within the integrated data. With these developments, the knowledge graph will become an even more powerful asset, driving collaboration and innovation to new heights across the organization.",
    },
  ],
};

const POPULAR_ARTICLES: PopularArticle[] = [
  { title: 'Arvid does not care so much about well written issues for the backlog.', slug: 'well-written-issues' },
  { title: 'How Arvid builds the knowledge graph your team needs.', slug: 'knowledge-graph' },
  { title: 'Real-time updates: why speed matters for engineering teams.', slug: 'real-time-updates' },
  { title: 'Connecting your tools to a single source of truth.', slug: 'single-source-of-truth' },
  { title: 'Why context is more important than perfect requirements.', slug: 'context-over-requirements' },
];

const READ_MORE_ARTICLES: ReadMoreArticle[] = [
  {
    title: 'Arvid knows your code',
    description: 'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code',
  },
  {
    title: 'Arvid knows your code',
    description: 'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code-2',
  },
  {
    title: 'Arvid knows your code',
    description: 'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code-3',
  },
  {
    title: 'Arvid knows your code',
    description: 'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code-4',
  },
  {
    title: 'Arvid knows your code',
    description: 'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code-5',
  },
  {
    title: 'Arvid knows your code',
    description: 'Login with GitHub, or connect your repo and let Arvid learn your codebase to understand the full context.',
    slug: 'knows-your-code-6',
  },
];

export function ArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const article = PLACEHOLDER_ARTICLE;
  const articleUrl = `${window.location.origin}/articles/${slug ?? ''}`;

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(articleUrl).then(
      () => { /* success — could surface a toast in the future */ },
      (err: unknown) => {
        console.warn('[ArticlePage:copyLink] clipboard write failed', { err, articleUrl });
      },
    );
  }, [articleUrl]);

  return (
    <div className="min-h-screen bg-black text-text-primary antialiased">
      <TopNav />

      <div className="mx-auto max-w-article-content px-6 pt-30 lg:max-w-grid lg:px-10">
        <header className="flex max-w-article-content flex-col gap-6">
          <h1 className="text-h2 text-text-primary">
            {article.title}
          </h1>
          <p className="text-btn text-text-tertiary">
            {article.date} by {article.author}, {article.location}
          </p>
        </header>

        <div className="mt-10 flex items-stretch justify-between gap-10">
          <div className="hidden lg:block">
            <PopularArticlesSidebar articles={POPULAR_ARTICLES} />
          </div>

          <article className="flex w-full max-w-article-content flex-col gap-10">
            {article.blocks.map((block, index) => (
              <ArticleBlockRenderer key={index} block={block} />
            ))}

            <button
              type="button"
              onClick={handleCopyLink}
              className="flex w-fit items-center gap-1 rounded-pill bg-surface-frost-10 px-4 py-2 text-btn text-text-primary transition-colors hover:bg-surface-frost-15"
            >
              Copy article link
              <ArrowUpRight size={ICON_SIZE.xs} />
            </button>

            <p className="text-btn text-text-tertiary">
              {article.date} by {article.author}, {article.location}
            </p>
          </article>

          <div className="hidden lg:block">
            <ShareSidebar articleUrl={articleUrl} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-article-content px-6 pt-60 lg:max-w-grid lg:px-10">
        <ArticleReadMore articles={READ_MORE_ARTICLES} />
      </div>

      <div className="pt-30">
        <CtaSection />
      </div>
    </div>
  );
}
