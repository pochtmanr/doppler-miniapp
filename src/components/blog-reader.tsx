'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Messages } from '@/lib/i18n';
import { loadPost, useBlogList, type BlogPost } from '@/lib/blog-client';
import { openExternal } from '@/lib/links';
import { formatDate } from './account-card';
import { BTN_FLAT, FOCUS } from './ui/recipes';

const SITE = 'https://www.dopplervpn.org';
const RTL_CONTENT = new Set(['ar', 'fa', 'he', 'ur']);
/** A link to another post on the site: /blog/<slug> or /<locale>/blog/<slug>. */
const POST_PATH = /^\/(?:[a-z]{2}(?:-[a-z]+)?\/)?blog\/([a-z0-9][a-z0-9-]*)\/?$/i;

/** Posts open with their own `# Title`; the reader already prints the title above the body. */
function withoutLeadingTitle(markdown: string): string {
  return markdown.replace(/^\s*#\s[^\n]*\n+/, '');
}

type Screen = { kind: 'list' } | { kind: 'post'; slug: string };
type PostState = { state: 'loading' } | { state: 'error' } | { state: 'missing' } | { state: 'ready'; post: BlogPost };

function resolveHref(href: string | undefined): URL | null {
  if (!href) return null;
  try {
    const url = new URL(href, SITE);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Glyph Terminal type for markdown, by hand (no typography plugin). Raw HTML stays
 * escaped (no rehype-raw) and react-markdown's default urlTransform drops javascript:.
 */
function markdownComponents(openSlug: (slug: string) => void): Components {
  return {
    h1: ({ children }) => <h2 className="font-display mt-8 mb-3 text-xl font-semibold text-text-primary">{children}</h2>,
    h2: ({ children }) => <h2 className="font-display mt-8 mb-3 text-xl font-semibold text-text-primary">{children}</h2>,
    h3: ({ children }) => <h3 className="font-display mt-6 mb-2 text-lg font-semibold text-text-primary">{children}</h3>,
    h4: ({ children }) => <h4 className="mt-5 mb-2 text-base font-semibold text-text-primary">{children}</h4>,
    p: ({ children }) => <p className="my-4 text-[15px] leading-7 text-text-muted">{children}</p>,
    ul: ({ children }) => <ul className="my-4 list-disc space-y-1.5 ps-5 text-[15px] leading-7 text-text-muted marker:text-accent-teal">{children}</ul>,
    ol: ({ children }) => <ol className="my-4 list-decimal space-y-1.5 ps-5 text-[15px] leading-7 text-text-muted marker:text-text-tertiary">{children}</ol>,
    li: ({ children }) => <li className="ps-1">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
    blockquote: ({ children }) => (
      <blockquote className="my-5 border-s-2 border-accent-teal/50 ps-4 text-text-muted italic">{children}</blockquote>
    ),
    hr: () => <hr className="my-8 border-overlay/10" />,
    code: ({ children, className }) =>
      className ? (
        <code className={className}>{children}</code>
      ) : (
        <code className="rounded bg-bg-secondary/80 px-1.5 py-0.5 font-mono text-[13px] text-text-primary">{children}</code>
      ),
    pre: ({ children }) => (
      <pre dir="ltr" className="my-5 overflow-x-auto rounded-xl border border-overlay/10 bg-bg-secondary/60 p-4 font-mono text-[13px] leading-6 text-text-primary">
        {children}
      </pre>
    ),
    table: ({ children }) => (
      <div className="my-5 overflow-x-auto rounded-xl border border-overlay/10">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="border-b border-overlay/10 bg-bg-secondary/40 px-3 py-2 text-start font-semibold text-text-primary">{children}</th>,
    td: ({ children }) => <td className="border-b border-overlay/5 px-3 py-2 align-top text-text-muted">{children}</td>,
    img: ({ src, alt }) => {
      const url = typeof src === 'string' ? resolveHref(src) : null;
      if (!url || url.protocol !== 'https:') return null;
      return <img src={url.href} alt={alt ?? ''} loading="lazy" className="my-5 max-w-full rounded-xl border border-overlay/10" />;
    },
    a: ({ href, children }) => {
      const url = resolveHref(href);
      if (!url) return <>{children}</>;
      const post = url.hostname.endsWith('dopplervpn.org') ? url.pathname.match(POST_PATH) : null;
      return (
        <a
          href={url.href}
          onClick={(e) => {
            // A plain navigation would replace the Mini App with no way back.
            e.preventDefault();
            if (post) openSlug(post[1].toLowerCase());
            else openExternal(url.href);
          }}
          className="text-accent-teal underline decoration-accent-teal/40 underline-offset-2"
        >
          {children}
        </a>
      );
    },
  };
}

function TopBar({ onBack, label, trailing }: { onBack: () => void; label: string; trailing?: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 -mx-4 mb-4 flex items-center justify-between gap-3 border-b border-overlay/10 bg-bg-primary/90 px-4 py-3 backdrop-blur">
      <button type="button" onClick={onBack} className={`flex items-center gap-1.5 text-sm font-medium text-text-primary ${FOCUS}`}>
        <svg className="w-4 h-4 rtl:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        {label}
      </button>
      {trailing}
    </div>
  );
}

/**
 * Full-screen blog reader over the home screen: the list, and a post rendered from the
 * same markdown dopplervpn.org serves. The page underneath keeps its scroll position.
 */
export function BlogReader({
  start,
  lang,
  messages,
  onClose,
}: {
  start: Screen;
  lang: string;
  messages: Messages;
  onClose: () => void;
}) {
  const b = messages.blog;
  const [stack, setStack] = useState<Screen[]>([start]);
  const [attempt, setAttempt] = useState(0);
  const [post, setPost] = useState<PostState>({ state: 'loading' });
  const scroller = useRef<HTMLDivElement>(null);
  const screen = stack[stack.length - 1];
  const list = useBlogList(lang, stack.some((s) => s.kind === 'list'), attempt);

  const back = useCallback(() => {
    if (stack.length > 1) setStack((s) => s.slice(0, -1));
    else onClose();
  }, [stack.length, onClose]);

  const openSlug = useCallback((slug: string) => setStack((s) => [...s, { kind: 'post', slug }]), []);
  const components = useRef(markdownComponents(openSlug)).current;

  // Telegram's header back arrow mirrors the on-screen Back while the reader is open.
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.BackButton || !tg.isVersionAtLeast?.('6.1')) return;
    tg.BackButton.onClick(back);
    tg.BackButton.show();
    return () => {
      tg.BackButton.offClick(back);
    };
  }, [back]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  useEffect(() => {
    scroller.current?.scrollTo(0, 0);
    if (screen.kind !== 'post') return;
    let live = true;
    setPost({ state: 'loading' });
    loadPost(screen.slug, lang)
      .then((p) => live && setPost(p ? { state: 'ready', post: p } : { state: 'missing' }))
      .catch(() => live && setPost({ state: 'error' }));
    return () => {
      live = false;
    };
  }, [screen, lang, attempt]);

  const retry = (
    <button type="button" onClick={() => setAttempt((n) => n + 1)} className={`${BTN_FLAT} mt-4`}>
      {b.retry}
    </button>
  );

  let body: ReactNode;
  if (screen.kind === 'list') {
    body =
      list.state === 'loading' ? (
        <p className="py-10 text-center text-sm text-text-muted" role="status">{messages.account.loading}</p>
      ) : list.state === 'error' ? (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted">{b.error}</p>
          {retry}
        </div>
      ) : list.list.posts.length === 0 ? (
        <p className="py-10 text-center text-sm text-text-muted">{b.empty}</p>
      ) : (
        <>
          <h1 className="font-display mb-5 text-2xl font-semibold text-text-primary">{b.title}</h1>
          <ul className="space-y-3" dir={RTL_CONTENT.has(list.list.locale) ? 'rtl' : 'ltr'} lang={list.list.locale}>
            {list.list.posts.map((item) => (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => openSlug(item.slug)}
                  className={`w-full overflow-hidden rounded-xl border border-overlay/10 bg-bg-secondary/20 text-start hover:border-accent-teal/30 transition-colors ${FOCUS}`}
                >
                  {item.imageUrl?.startsWith('https://') && (
                    <img src={item.imageUrl} alt={item.imageAlt ?? ''} loading="lazy" className="aspect-[1200/630] w-full object-cover" />
                  )}
                  <span className="block p-4">
                    <span className="block text-base font-semibold text-text-primary">{item.title}</span>
                    <span className="mt-1 block text-sm text-text-muted line-clamp-3">{item.excerpt}</span>
                    {item.publishedAt && (
                      <span className="mt-2 block text-xs text-text-tertiary">{formatDate(item.publishedAt, lang)}</span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      );
  } else {
    body =
      post.state === 'loading' ? (
        <p className="py-10 text-center text-sm text-text-muted" role="status">{messages.account.loading}</p>
      ) : post.state === 'missing' ? (
        <p className="py-10 text-center text-sm text-text-muted">{b.missing}</p>
      ) : post.state === 'error' ? (
        <div className="py-10 text-center">
          <p className="text-sm text-text-muted">{b.error}</p>
          {retry}
        </div>
      ) : (
        <article dir={RTL_CONTENT.has(post.post.locale) ? 'rtl' : 'ltr'} lang={post.post.locale}>
          {post.post.locale !== lang && lang !== 'en' && post.post.locale === 'en' && (
            <p className="mb-4 rounded-xl border border-overlay/10 bg-bg-secondary/40 px-4 py-2.5 text-xs text-text-muted" dir="auto">
              {b.englishOnly}
            </p>
          )}
          {post.post.imageUrl?.startsWith('https://') && (
            <img
              src={post.post.imageUrl}
              alt={post.post.imageAlt ?? ''}
              className="mb-5 aspect-[1200/630] w-full rounded-xl border border-overlay/10 object-cover"
            />
          )}
          <h1 className="font-display text-2xl font-semibold leading-tight text-text-primary">{post.post.title}</h1>
          {post.post.publishedAt && (
            <p className="mt-2 text-xs text-text-tertiary">{formatDate(post.post.publishedAt, lang)}</p>
          )}
          <Markdown remarkPlugins={[remarkGfm]} components={components}>
            {withoutLeadingTitle(post.post.content)}
          </Markdown>
          <button
            type="button"
            onClick={() => openExternal(`${SITE}/${post.post.locale}/blog/${post.post.slug}`)}
            className={`${BTN_FLAT} mt-6 w-full`}
          >
            {b.openWeb}
          </button>
        </article>
      );
  }

  return (
    <div
      ref={scroller}
      className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-bg-primary"
      role="dialog"
      aria-modal="true"
      aria-label={b.title}
    >
      <div className="mx-auto max-w-lg px-4 pb-10">
        <TopBar onBack={back} label={stack.length > 1 ? messages.miniapp.back : b.close} />
        {body}
      </div>
    </div>
  );
}
