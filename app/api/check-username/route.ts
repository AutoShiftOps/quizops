import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/serverSupabase';
import { isUsernameTaken } from '@/lib/publisher';

export async function GET(req: NextRequest) {
  const authed = await getAuthenticatedUser(req);
  if (!authed) {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  const username = req.nextUrl.searchParams.get('username') ?? '';
  const taken = await isUsernameTaken(authed.supabase, username);

  return NextResponse.json({ available: !taken });
}
