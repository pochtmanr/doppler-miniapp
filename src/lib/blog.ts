import 'server-only';
import { supabasePublic } from '@/lib/supabase-public';

/**
 * Locales with real rows in blog_post_translations. Copied from doppler-web
 * src/i18n/blog-locales.ts; change it there first. Mini App locales outside this
 * list (uk, it, pl, nl, ro) read the English blog, as the site redirects them.
 */
export const BLOG_LOCALES = [
  'en', 'es', 'pt', 'ru', 'fr', 'he', 'zh', 'de', 'fa', 'tr', 'ar',
  'hi', 'vi', 'id', 'ms', 'th', 'ja', 'tl', 'ur', 'sw', 'ko',
] as const;

const BLOG_LOCALE_SET = new Set<string>(BLOG_LOCALES);
const LIST_LIMIT = 20;
const SLUG = /^[a-z0-9][a-z0-9-]{0,200}$/;

/** One locale for a whole list: the reader's if the blog has it, English otherwise. */
export function blogLocale(lang: string | null): string {
  return lang && BLOG_LOCALE_SET.has(lang) ? lang : 'en';
}

export function validSlug(slug: string): boolean {
  return SLUG.test(slug);
}

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
  /** The locale actually served; differs from the request when it fell back to English. */
  locale: string;
}

type Translation = { locale: string; title: string; excerpt: string; image_alt: string | null; content?: string };
type Row = { slug: string; image_url: string | null; published_at: string | null; blog_post_translations: Translation[] };

/** Newest published posts in one locale. Never selects `content`: the list stays a few KB. */
export async function listPosts(locale: string): Promise<BlogListItem[]> {
  const { data, error } = await supabasePublic
    .from('blog_posts')
    .select('slug, image_url, published_at, blog_post_translations!inner(locale, title, excerpt, image_alt)')
    .eq('status', 'published')
    .eq('blog_post_translations.locale', locale)
    .order('published_at', { ascending: false })
    .order('slug')
    .limit(LIST_LIMIT);
  if (error) throw error;
  return ((data ?? []) as Row[]).map((row) => {
    const tr = row.blog_post_translations[0];
    return {
      slug: row.slug,
      title: tr.title,
      excerpt: tr.excerpt,
      imageUrl: row.image_url,
      imageAlt: tr.image_alt,
      publishedAt: row.published_at,
    };
  });
}

async function fetchPost(slug: string, locale: string): Promise<BlogPost | null> {
  const { data, error } = await supabasePublic
    .from('blog_posts')
    .select('slug, image_url, published_at, blog_post_translations!inner(locale, title, excerpt, image_alt, content)')
    .eq('slug', slug)
    .eq('status', 'published')
    .eq('blog_post_translations.locale', locale)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Row;
  const tr = row.blog_post_translations[0];
  return {
    slug: row.slug,
    title: tr.title,
    excerpt: tr.excerpt,
    imageUrl: row.image_url,
    imageAlt: tr.image_alt,
    publishedAt: row.published_at,
    content: tr.content ?? '',
    locale: tr.locale,
  };
}

/** A post in the reader's locale, or in English when that translation is missing. */
export async function getPost(slug: string, locale: string): Promise<BlogPost | null> {
  const post = await fetchPost(slug, locale);
  if (post || locale === 'en') return post;
  return fetchPost(slug, 'en');
}
