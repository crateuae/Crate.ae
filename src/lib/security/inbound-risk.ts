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
  // "Vendor invitation / supplier registration" — the usual opening of the registration-fee scam.
  { re: /\b(vendor\s+(invitation|registration|enrol?ment)|supplier\s+(registration|invitation)|registration\s+fee|pre-?qualification\s+fee)\b/i, key: 'lure_vendor' },
]

// Large UAE organisations whose names are borrowed by vendor-registration scams. A mention
// from any domain other than the real one is a strong signal.
const UAE_BRANDS: Array<{ re: RegExp; domains: string[] }> = [
  { re: /\bekfc\b|emirates\s+flight\s+catering/i, domains: ['ekfc.com', 'emirates.com'] },
  { re: /\bemirates\s+(airline|group)\b/i, domains: ['emirates.com'] },
  { re: /\badnoc\b/i, domains: ['adnoc.ae'] },
  { re: /\bdewa\b/i, domains: ['dewa.gov.ae'] },
  { re: /\betihad\b/i, domains: ['etihad.com', 'etihad.ae'] },
  { re: /\bemaar\b/i, domains: ['emaar.ae', 'emaar.com'] },
  { re: /\b(expo\s*2020|expo\s*city)\b/i, domains: ['expocitydubai.com'] },
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
  for (const b of UAE_BRANDS) {
    if (b.re.test(hay) && domain && !b.domains.some(d => domain === d || domain.endsWith(`.${d}`))) { score += 3; reasons.add('brand_impersonation'); break }
  }
  // A "request for quotation / product information" from a domain with no business on it,
  // with nothing else said, is the opening line of the fake-buyer scam.
  if (/\b(request\s+for\s+(quotation|product\s+information)|order\s+rfq|new\s+order\s+request|web\s+quote)\b/i.test(input.subject || '') && !(input.body || '').trim()) { score += 1; reasons.add('generic_rfq') }

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
