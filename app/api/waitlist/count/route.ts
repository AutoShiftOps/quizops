import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Without this, Next.js statically prerenders this GET handler once at
// build time (it has no dynamic APIs to trigger dynamic rendering
// automatically) and serves that frozen snapshot forever — defeating the
// entire point of a live counter. force-dynamic makes it re-run per
// request. The counter is a trust signal on the pricing page — a stale
// count (e.g. showing 1 when there are actually 2 signups) undermines
// credibility more than the extra DB read costs, so no-store below skips
// edge/CDN caching entirely rather than tolerating any staleness window.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const { count } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json(
    { count: count || 0 },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
