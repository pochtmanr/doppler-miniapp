'use client';

import type { Messages } from '@/lib/i18n';
import type { ListState } from '@/lib/blog-client';
import { formatDate } from './account-card';
import { FOCUS } from './ui/recipes';

const PREVIEW = 3;

const ROW = `flex w-full items-center gap-3 rounded-xl border border-overlay/10 bg-bg-secondary/20 px-4 py-3 text-start hover:border-accent-teal/30 transition-colors ${FOCUS}`;

function Chevron() {
  return (
    <svg className="w-4 h-4 shrink-0 text-text-tertiary rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** Home preview: the three newest posts in recipe-A rows, and a row into the full list. */
export function BlogSection({
  blog,
  lang,
  messages,
  onOpenPost,
  onOpenList,
}: {
  blog: ListState;
  lang: string;
  messages: Messages;
  onOpenPost: (slug: string) => void;
  onOpenList: () => void;
}) {
  const b = messages.blog;
  // An empty or failed blog is not worth a card on the home screen.
  if (blog.state === 'error' || (blog.state === 'ready' && blog.list.posts.length === 0)) return null;

  return (
    <section className="mt-10" aria-labelledby="blog-title">
      <h2 id="blog-title" className="text-xl font-semibold text-text-primary mb-4">{b.title}</h2>
      {blog.state === 'loading' ? (
        <div className="space-y-2" aria-hidden="true">
          {Array.from({ length: PREVIEW }, (_, i) => (
            <div key={i} className="h-[68px] rounded-xl border border-overlay/10 bg-bg-secondary/20" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {blog.list.posts.slice(0, PREVIEW).map((post) => (
            <button key={post.slug} type="button" onClick={() => onOpenPost(post.slug)} className={ROW}>
              <span className="min-w-0 flex-1" dir={blog.list.locale === lang ? undefined : 'auto'}>
                <span className="block text-sm font-medium text-text-primary line-clamp-2">{post.title}</span>
                {post.publishedAt && (
                  <span className="mt-0.5 block text-xs text-text-tertiary">{formatDate(post.publishedAt, lang)}</span>
                )}
              </span>
              <Chevron />
            </button>
          ))}
          <button type="button" onClick={onOpenList} className={`${ROW} justify-between`}>
            <span className="text-sm font-medium text-accent-teal">{b.all}</span>
            <Chevron />
          </button>
        </div>
      )}
    </section>
  );
}
