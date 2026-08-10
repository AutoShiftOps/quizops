import { createClient } from '@supabase/supabase-js';

// Service-role client — bypasses RLS entirely. Server-side only (API routes
// under app/api/), never imported by client components. Needed for the
// waitlist insert since there's no signed-in user whose auth.uid() an RLS
// policy could check against.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
