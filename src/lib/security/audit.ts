/**
 * Cheap security audit trail. Writes one structured line to the platform logs (always) and
 * a row to public.security_events (best effort: ignored until docs/sql/security_hardening.sql
 * has been run). Never throws, never logs secrets or request bodies.
 */
import { adminClient } from '@/lib/supabase/admin'

export type SecurityEvent =
  | 'admin_auth_denied' | 'dashboard_auth_denied' | 'privileged_denied' | 'cron_denied'
  | 'admin_action' | 'rate_limited' | 'bad_signature' | 'honeypot'

let windowStart = 0
let dbWrites = 0

export async function audit(event: SecurityEvent, info: { ip?: string; path?: string; actor?: string | null; detail?: string }): Promise<void> {
  const row = { event, ip: info.ip ?? null, path: (info.path ?? '').slice(0, 200), actor: info.actor ?? null, detail: (info.detail ?? '').slice(0, 300) }
  console.warn('[security]', JSON.stringify(row))
  // Cap database writes (a flood of bad requests must not become a flood of inserts).
  const now = Date.now()
  if (now - windowStart > 60_000) { windowStart = now; dbWrites = 0 }
  if (++dbWrites > 30) return
  try { await adminClient().from('security_events').insert(row) } catch { /* table may not exist yet */ }
}
