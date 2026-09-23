import { NextRequest, NextResponse } from 'next/server';
import { blogLocale, listPosts } from '@/lib/blog';

/** Public content, the same as dopplervpn.org/blog: no initData, cached at the edge. */
const HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  'X-Robots-Tag': 'noindex',
};

export async function GET(req: NextRequest) {
  const locale = blogLocale(req.nextUrl.searchParams.get('locale'));
  try {
    const posts = await listPosts(locale);
    return NextResponse.json({ locale, posts }, { headers: HEADERS });
  } catch (error: unknown) {
    console.error('Blog list error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
