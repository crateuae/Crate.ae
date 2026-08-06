// ─────────────────────────────────────────────────────────────────────────────
// Lightweight, dependency-free phishing/spam heuristic for inbound emails shown in
// the CRM. It is NOT a verdict engine — it surfaces REASON KEYS so the owner
// decides. The dashboard only ever shows the PLAIN TEXT of an inbound email;
// body_html is never rendered in the browser (remote images / tracking pixels are
// themselves a vector), so we strip it to text server-side here.
// ─────────────────────────────────────────────────────────────────────────────

// TLDs disproportionately abused for phishing/throwaway senders.
const RISKY_TLDS = new Set(['cfd', 'zip', 'mov', 'click', 'top', 'xyz', 'icu', 'sbs', 'cyou', 'rest', 'buzz', 'quest', 'work', 'monster'])

const LURES: { re: RegExp; key: string }[] = [
  { re: /\b(salary|payslip|salary\s*sheet|payroll)\b/i, key: 'lure_salary' },
  { re: /\b(invoice|overdue|due\s*invoices?|payment\s*reminder|unpaid|outstanding)\b/i, key: 'lure_invoice' },
  { re: /\b(verify|confirm|update|reactivate)\s+(your\s+)?(account|password|details|payment|billing)\b/i, key: 'lure_verify' },
  { re: /\b(password|credentials|log[\s-]?in|sign[\s-]?in\s+here)\b/i, key: 'lure_credentials' },
  { re: /\b(urgent|immediately|within\s+24\s*hours|final\s+notice|account\s+suspended|will\s+be\s+closed)\b/i, key: 'lure_urgency' },
  { re: /\b(gift\s*card|wire\s*transfer|bitcoin|crypto|western\s*union|bank\s*transfer\s+now)\b/i, key: 'lure_money' },
  { re: /\b(click\s+here|open\s+the\s+attachment|download\s+now|view\s+document)\b/i, key: 'lure_click' },
]

export type InboundRisk = { level: 'high' | 'medium' | 'low'; reasons: string[] }

export function assessInboundRisk(input: { from_email?: string | null; subject?: string | null; body?: string | null }): InboundRisk {
  const reasons = new Set<string>()
  let score = 0
  const from = (input.from_email || '').toLowerCase().trim()
  const domain = from.split('@')[1] || ''
  const tld = domain.split('.').pop() || ''
  const label = domain.split('.')[0] || ''
  const hay = `${input.subject || ''}\n${input.body || ''}`

  if (RISKY_TLDS.has(tld)) { score += 3; reasons.add('risky_tld') }
  if (label.length >= 16 && !label.includes('-')) { score += 1; reasons.add('unusual_domain') }

  for (const l of LURES) if (l.re.test(hay)) { score += 2; reasons.add(l.key) }

  if (/https?:\/\/\d{1,3}(\.\d{1,3}){3}/i.test(hay)) { score += 2; reasons.add('ip_url') }
  if (/\b(bit\.ly|tinyurl|t\.co|goo\.gl|cutt\.ly|is\.gd|rebrand\.ly)\b/i.test(hay)) { score += 1; reasons.add('short_url') }
  if (/crate/i.test(input.subject || '') && domain && !/crate\.ae$/i.test(domain)) { score += 1; reasons.add('brand_spoof') }

  const level = score >= 4 ? 'high' : score >= 2 ? 'medium' : 'low'
  return { level, reasons: [...reasons] }
}

/** Strip HTML to readable text, server-side, so no remote content is ever fetched by the browser. */
export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&#39;/g, "'").replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}
