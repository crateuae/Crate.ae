import crypto from 'node:crypto'

/** Token derived from the service-role key: lets one server route call another without a new env var. */
export function internalToken(): string {
  return crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'unset').update('crate-internal-call-v1').digest('hex')
}
