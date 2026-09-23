import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Anon client for public content (the blog). RLS lets anyone read published posts,
 * which is exactly what dopplervpn.org shows. Account data stays on supabaseAdmin.
 */
export const supabasePublic = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false } },
);
