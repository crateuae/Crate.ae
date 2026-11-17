/**
 * Single definition of "who is the admin" for server code, plus the guard that server
 * actions and privileged route handlers call before doing anything with the service role.
 */
import { createClient } from '@/lib/supabase/server'

export const ADMIN_EMAIL = 'crateuae@gmail.com'

export function isAdminUser(user: { email?: string | null; email_confirmed_at?: string | null } | null | undefined): boolean {
  return !!user && user.email === ADMIN_EMAIL && !!user.email_confirmed_at
}

/** Throws unless the current cookie session belongs to the confirmed admin. */
export async function requireAdmin(): Promise<void> {
  const sb = await createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!isAdminUser(user)) throw new Error('unauthorized')
}
