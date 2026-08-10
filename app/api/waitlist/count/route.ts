import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Without this, Next.js statically prerenders this GET handler once at
// build time (it has no dynamic APIs to trigger dynamic rendering
// automatically) and serves that frozen snapshot forever — defeating the
// entire point of a live counter. force-dynamic makes it re-run per
// request; the Cache-Control header below still lets the edge cache each
// response for 60s.
export const dynamic = 'force-dynamic';

export async function GET() {
  const { count } = await supabaseAdmin
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  return NextResponse.json(
    { count: count || 0 },
    { headers: { 'Cache-Control': 's-maxage=60' } }
  );
}
