'use client';

import { useEffect, useState } from 'react';

export interface BlogListItem {
  slug: string;
  title: string;
  excerpt: string;
  imageUrl: string | null;
  imageAlt: string | null;
  publishedAt: string | null;
}

export interface BlogPost extends BlogListItem {
  content: string;
  locale: string;
}

export type BlogList = { locale: string; posts: BlogListItem[] };

/** One request per session: the home preview and the reader share the list. */
const lists = new Map<string, Promise<BlogList>>();

function loadList(lang: string): Promise<BlogList> {
  let pending = lists.get(lang);
  if (!pending) {
    pending = fetch(`/api/blog?locale=${encodeURIComponent(lang)}`).then(async (res) => {
      if (!res.ok) throw new Error('blog');
      return (await res.json()) as BlogList;
    });
    // A failed load must not stick: the next caller tries again.
    pending.catch(() => lists.delete(lang));
    lists.set(lang, pending);
  }
  return pending;
}

export function loadPost(slug: string, lang: string): Promise<BlogPost | null> {
  return fetch(`/api/blog/${encodeURIComponent(slug)}?locale=${encodeURIComponent(lang)}`).then(async (res) => {
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('post');
    return (await res.json()) as BlogPost;
  });
}

export type ListState = { state: 'loading' } | { state: 'error' } | { state: 'ready'; list: BlogList };

/** The blog list for `lang`, fetched once `enabled` turns true (after the account loads). */
export function useBlogList(lang: string, enabled: boolean, attempt = 0): ListState {
  const [result, setResult] = useState<ListState>({ state: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let live = true;
    setResult({ state: 'loading' });
    loadList(lang)
      .then((list) => live && setResult({ state: 'ready', list }))
      .catch(() => live && setResult({ state: 'error' }));
    return () => {
      live = false;
    };
  }, [lang, enabled, attempt]);
  return result;
}
