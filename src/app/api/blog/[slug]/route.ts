import { NextRequest, NextResponse } from 'next/server';
import { blogLocale, getPost, validSlug } from '@/lib/blog';

const HEADERS = {
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  'X-Robots-Tag': 'noindex',
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!validSlug(slug)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: HEADERS });
  }
  try {
    const post = await getPost(slug, blogLocale(req.nextUrl.searchParams.get('locale')));
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404, headers: HEADERS });
    return NextResponse.json(post, { headers: HEADERS });
  } catch (error: unknown) {
    console.error('Blog post error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
