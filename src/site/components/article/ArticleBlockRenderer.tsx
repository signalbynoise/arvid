import React, { useMemo } from 'react';
import { marked } from 'marked';

const renderer = new marked.Renderer();
const originalLinkRenderer = renderer.link.bind(renderer);
renderer.link = function (token) {
  const html = originalLinkRenderer(token);
  return html.replace('<a ', '<a target="_blank" rel="noopener noreferrer" ');
};

marked.setOptions({ renderer });

interface ArticleContentProps {
  content: string;
}

export function ArticleContent({ content }: ArticleContentProps) {
  const html = useMemo(() => {
    if (!content) return '';
    return marked.parse(content) as string;
  }, [content]);

  return (
    <div
      className="flex flex-col gap-6 text-body text-text-tertiary [&_h1]:text-h1 [&_h1]:text-text-primary [&_h2]:text-h2 [&_h2]:text-text-primary [&_h2]:mt-4 [&_h3]:text-h3 [&_h3]:text-text-primary [&_h3]:mt-2 [&_p]:leading-relaxed [&_strong]:text-text-primary [&_a]:link-default [&_code]:rounded-standard [&_code]:bg-surface-panel [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-caption [&_pre]:rounded-card [&_pre]:bg-surface-panel [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_img]:rounded-card [&_blockquote]:border-l-2 [&_blockquote]:border-border-default [&_blockquote]:pl-4 [&_blockquote]:text-text-quaternary [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1 [&_ul]:pl-6 [&_ul]:list-disc [&_ol]:flex [&_ol]:flex-col [&_ol]:gap-1 [&_ol]:pl-6 [&_ol]:list-decimal"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
