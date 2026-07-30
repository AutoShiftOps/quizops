import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let clientPromise: Promise<SupabaseClient> | null = null;

async function fetchConfig(): Promise<{ supabaseUrl: string; supabaseAnon: string }> {
  const res = await fetch('/api/config');
  if (!res.ok) {
    throw new Error('Failed to load Supabase config from /api/config');
  }
  return res.json();
}

// Lazily creates a singleton Supabase client using keys fetched from
// /api/config, since env vars are server-only (not NEXT_PUBLIC_*).
export async function getSupabaseClient(): Promise<SupabaseClient> {
  if (client) return client;
  if (!clientPromise) {
    clientPromise = fetchConfig().then(({ supabaseUrl, supabaseAnon }) => {
      client = createClient(supabaseUrl, supabaseAnon);
      return client;
    });
  }
  return clientPromise;
}
