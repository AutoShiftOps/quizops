import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnon = process.env.SUPABASE_ANON_KEY;
  const appUrl =
    process.env.APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';

  if (!supabaseUrl || !supabaseAnon) {
    return NextResponse.json(
      { error: 'Supabase env vars not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { supabaseUrl, supabaseAnon, appUrl },
    { headers: { 'Cache-Control': 's-maxage=300' } }
  );
}
