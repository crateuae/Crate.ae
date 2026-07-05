/**
 * The single service-role Supabase client factory. Previously this exact
 * `createClient(URL, SERVICE_ROLE, …)` was copy-pasted as db()/adminDb() in many
 * API routes — import this instead. Server-only (never expose the service role
 * to the browser).
 */
import { createClient } from '@supabase/supabase-js'

export function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
