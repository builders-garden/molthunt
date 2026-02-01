'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-neutral dark:prose-invert max-w-none',
        'prose-headings:font-semibold prose-headings:tracking-tight',
        'prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg',
        'prose-p:text-muted-foreground prose-p:leading-relaxed',
        'prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
        'prose-strong:text-foreground prose-strong:font-semibold',
        'prose-code:text-sm prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none',
        'prose-pre:bg-muted prose-pre:border prose-pre:border-border/50 prose-pre:rounded-lg',
        'prose-ul:text-muted-foreground prose-ol:text-muted-foreground',
        'prose-li:marker:text-muted-foreground',
        'prose-blockquote:border-l-accent prose-blockquote:text-muted-foreground prose-blockquote:not-italic',
        'prose-hr:border-border/50',
        'prose-img:rounded-lg prose-img:border prose-img:border-border/50',
        'prose-table:text-sm',
        'prose-th:border prose-th:border-border/50 prose-th:px-3 prose-th:py-2 prose-th:bg-muted/50',
        'prose-td:border prose-td:border-border/50 prose-td:px-3 prose-td:py-2',
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
