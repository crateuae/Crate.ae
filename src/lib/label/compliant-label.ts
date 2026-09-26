// ═══════════════════════════════════════════════════════════════════════════
// Compliant-label ARTWORK generator — deterministic, zero AI/credit.
//
// Turns the data a compliance check already produced (product name, ingredients,
// allergens, dates, nutrition, net content, origin, additive flags) into a print-ready
// SVG label laid out with the UAE.S 9 mandatory sections (Arabic + English).
// Missing mandatory fields render as visible red placeholders so the importer
// knows exactly what to supply before printing. Output is a self-contained SVG
// string (scalable, print-ready; the UI can also rasterize it to PNG).
//
// Bidi rule that cost a whole afternoon: for an SVG <text> with direction="rtl" the
// "start" of the string is its RIGHT end. Right-aligned Arabic is therefore
// text-anchor="start" at the right margin — with "end" the text runs OFF the right edge.
// ═══════════════════════════════════════════════════════════════════════════

export interface LabelData {
  product_name?: string
  product_name_ar?: string | null
  product_class?: string
  net_content?: string | null
  country_of_origin?: string | null
  origin_ar?: string | null
  has_sulfites?: boolean
  ingredients?: string          // free text (EN or AR)
  ingredients_ar?: string | null
  allergens?: string | null     // e.g. "Contains: milk, egg. May contain traces of nuts."
  allergens_ar?: string | null  // e.g. "يحتوي على: حليب، بيض. قد يحتوي على آثار المكسرات."
  storage?: string | null
  production_date?: string | null
  expiry_date?: string | null
  importer?: string | null
  nutrition?: { columns: string[]; rows: { label: string; values: string[] }[] }
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const AR_RE = /[؀-ۿ]/
const hasAr = (s: unknown) => AR_RE.test(String(s ?? ''))
/** value class: Arabic-bearing values get the Arabic face and a slightly larger size */
const vcls = (s: unknown) => (hasAr(s) ? 'v ar' : 'v')

// Right-aligned Arabic run (see the bidi rule above).
const rtlAttrs = 'text-anchor="start" direction="rtl"'

// Naive word-wrap → tspans. `rtl` right-anchors each line at x (Arabic reads from x leftward).
function wrap(text: string, maxChars: number, x: number, y: number, lh: number, opts: { rtl?: boolean; cls?: string } = {}): { svg: string; lines: number } {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxChars && cur) { lines.push(cur); cur = w }
    else cur = (cur ? cur + ' ' : '') + w
  }
  if (cur) lines.push(cur)
  if (!lines.length) lines.push('')
  const attrs = opts.rtl ? rtlAttrs : 'text-anchor="start"'
  const svg = `<text x="${x}" y="${y}" ${attrs} class="${opts.cls || 'v'}">` +
    lines.map((ln, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : lh}">${esc(ln)}</tspan>`).join('') +
    `</text>`
  return { svg, lines: lines.length }
}

export function buildLabelSVG(d: LabelData): string {
  const W = 620, PAD = 28, R = W - PAD
  const parts: string[] = []
  let y = 56

  const missing = (label_ar: string) => `<tspan class="missing">— ${esc(label_ar)} —</tspan>`
  const val = (v: unknown, label_ar: string) => (v && String(v).trim()) ? esc(v) : missing(label_ar)
  // A right-aligned value row: grey bilingual label on the left, value on the right.
  // A long value (importer name + address, a bilingual storage line) drops under the label
  // and wraps, so it never runs into the label text.
  const row = (label: string, v: unknown, label_ar: string) => {
    parts.push(`<text x="${PAD}" y="${y}" class="lbl">${esc(label)}</text>`)
    const s = v && String(v).trim() ? String(v).trim() : ''
    if (s.length > 58) {
      // A bilingual value is split at " · " into one line per language, each right-aligned in
      // its own direction — word-wrapping a mixed string inside one rtl paragraph scrambles the
      // Latin run across lines.
      y += 22
      for (const seg of s.split(' · ').map(x => x.trim()).filter(Boolean)) {
        const ar = hasAr(seg)
        if (seg.length <= 84) {
          parts.push(ar
            ? `<text x="${R}" y="${y}" ${rtlAttrs} class="v ar">${esc(seg)}</text>`
            : `<text x="${R}" y="${y}" text-anchor="end" class="v">${esc(seg)}</text>`)
          y += ar ? 22 : 19
        } else {
          const w = ar ? wrap(seg, 66, R, y, 22, { rtl: true, cls: 'v ar' }) : wrap(seg, 84, PAD, y, 19, { cls: 'v' })
          parts.push(w.svg)
          y += w.lines * (ar ? 22 : 19)
        }
      }
      y += 10
      return
    }
    parts.push(`<text x="${R}" y="${y}" text-anchor="end" class="${vcls(v)}">${val(v, label_ar)}</text>`)
    y += 28
  }

  // Header — names (English left, Arabic right on its own line)
  parts.push(`<text x="${PAD}" y="${y}" class="name-en">${esc(d.product_name || 'Product name')}</text>`)
  parts.push(`<text x="${R}" y="${y + 32}" ${rtlAttrs} class="name-ar">${d.product_name_ar ? esc(d.product_name_ar) : missing('اسم المنتج')}</text>`)
  y += 56
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${R}" y2="${y}" class="rule"/>`)
  y += 26

  // Net content
  row('Net content / المحتوى الصافي:', d.net_content, 'الوزن/الحجم الصافي')
  y += 2

  // Ingredients — Arabic block (mandatory) then the English block, each in its own direction.
  parts.push(`<text x="${R}" y="${y}" ${rtlAttrs} class="hd-ar">المكوّنات</text>`)
  parts.push(`<text x="${PAD}" y="${y}" class="hd">Ingredients</text>`)
  y += 24
  const ingAr = d.ingredients_ar || (hasAr(d.ingredients) ? d.ingredients : null)
  const ingEn = d.ingredients && !hasAr(d.ingredients) ? d.ingredients : null
  if (ingAr) { const w = wrap(ingAr, 66, R, y, 22, { rtl: true, cls: 'v ar' }); parts.push(w.svg); y += w.lines * 22 + 6 }
  if (ingEn) { const w = wrap(ingEn, 84, PAD, y, 19, { cls: 'v' }); parts.push(w.svg); y += w.lines * 19 + 6 }
  if (!ingAr && !ingEn) { parts.push(`<text x="${R}" y="${y}" ${rtlAttrs} class="v ar">${missing('قائمة المكوّنات بالعربية')}</text>`); y += 26 }

  // Allergen declaration — the fixed "Contains …" pattern, highlighted.
  const alAr = d.allergens_ar || (hasAr(d.allergens) ? d.allergens : null)
  const alEn = d.allergens && !hasAr(d.allergens) ? d.allergens : null
  if (alAr || alEn) {
    y += 4
    const h = 12 + (alAr ? 22 : 0) + (alEn ? 20 : 0)
    parts.push(`<rect x="${PAD}" y="${y - 4}" width="${R - PAD}" height="${h}" class="warn"/>`)
    let yy = y + 14
    if (alAr) { parts.push(`<text x="${R - 8}" y="${yy}" ${rtlAttrs} class="warn-tx ar">${esc(alAr)}</text>`); yy += 22 }
    if (alEn) { parts.push(`<text x="${PAD + 8}" y="${yy}" class="warn-tx">${esc(alEn)}</text>`) }
    y += h + 8
  }

  // Nutrition table (if present)
  const n = d.nutrition
  if (n && n.rows && n.rows.length) {
    y += 8
    parts.push(`<text x="${PAD}" y="${y}" class="hd">Nutrition Facts</text>`)
    parts.push(`<text x="${R}" y="${y}" ${rtlAttrs} class="hd-ar">الحقائق الغذائية</text>`)
    y += 10
    const tx = PAD, tw = R - PAD, cols = Math.min(n.columns?.length || 1, 3)
    const rowH = 22
    const colW = (tw - 220) / cols
    parts.push(`<rect x="${tx}" y="${y}" width="${tw}" height="${rowH}" class="th"/>`)
    ;(n.columns || []).slice(0, cols).forEach((c, i) => {
      parts.push(`<text x="${tx + 220 + colW * i + colW / 2}" y="${y + 15}" text-anchor="middle" class="tv">${esc(c)}</text>`)
    })
    y += rowH
    n.rows.slice(0, 14).forEach((r, ri) => {
      if (ri % 2) parts.push(`<rect x="${tx}" y="${y}" width="${tw}" height="${rowH}" class="tr"/>`)
      parts.push(`<text x="${tx + 8}" y="${y + 15}" class="tv">${esc(r.label)}</text>`)
      ;(r.values || []).slice(0, cols).forEach((v, i) => {
        parts.push(`<text x="${tx + 220 + colW * i + colW / 2}" y="${y + 15}" text-anchor="middle" class="tv">${esc(v)}</text>`)
      })
      y += rowH
    })
    parts.push(`<rect x="${tx}" y="${y - rowH * (Math.min(n.rows.length, 14) + 1)}" width="${tw}" height="${rowH * (Math.min(n.rows.length, 14) + 1)}" class="tbox"/>`)
    y += 12
  }

  // Dates · storage · origin · importer
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${R}" y2="${y}" class="rule-soft"/>`); y += 26
  row('Production / تاريخ الإنتاج:', d.production_date, 'تاريخ الإنتاج')
  row('Expiry / تاريخ الانتهاء:', d.expiry_date, 'تاريخ الانتهاء')
  row('Storage / ظروف التخزين:', d.storage, 'ظروف التخزين')
  row('Country of origin / بلد المنشأ:', d.origin_ar || d.country_of_origin, 'بلد المنشأ')
  row('Importer / المستورد:', d.importer, 'اسم وعنوان المستورد')

  // Sulfite declaration
  if (d.has_sulfites) {
    parts.push(`<rect x="${PAD}" y="${y - 4}" width="${R - PAD}" height="26" class="warn"/>`)
    parts.push(`<text x="${R - 8}" y="${y + 13}" ${rtlAttrs} class="warn-tx ar">يحتوي على سلفايت (E220–E228)</text>`)
    parts.push(`<text x="${PAD + 8}" y="${y + 13}" class="warn-tx">Contains sulphites</text>`); y += 34
  }

  y += 6
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${R}" y2="${y}" class="rule-soft"/>`); y += 18
  parts.push(`<text x="${W / 2}" y="${y}" text-anchor="middle" class="foot">UAE.S GSO 9 template — verify all fields before printing · قالب مطابق للمواصفة، تحقّق قبل الطباعة</text>`)
  y += 24

  const H = Math.max(560, y + PAD)
  // Font stack: the site's Poppins/Noto Sans Arabic CSS variables when embedded in a page,
  // then the same faces by name, then Arial (which carries Arabic glyphs) for a standalone file.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="var(--font-en), Poppins, var(--font-ar), 'Noto Sans Arabic', Arial, sans-serif">
  <style>
    .ar{font-family:var(--font-ar),'Noto Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif}
    .name-en{font-size:24px;font-weight:800;fill:#111}
    .name-ar{font-size:24px;font-weight:700;fill:#111;font-family:var(--font-ar),'Noto Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif}
    .hd{font-size:13px;font-weight:800;fill:#c2410c;text-transform:uppercase;letter-spacing:.5px}
    .hd-ar{font-size:15px;font-weight:700;fill:#c2410c;font-family:var(--font-ar),'Noto Sans Arabic','Segoe UI',Tahoma,Arial,sans-serif}
    .lbl{font-size:12px;fill:#6b7280}
    .v{font-size:13px;fill:#111}
    .v.ar{font-size:14px}
    .missing{fill:#ef4444;font-style:italic}
    .foot{font-size:10px;fill:#9ca3af}
    .rule{stroke:#111;stroke-width:2}
    .rule-soft{stroke:#e5e7eb;stroke-width:1}
    .th{fill:#f3f4f6}.tr{fill:#fafafa}.tbox{fill:none;stroke:#e5e7eb;stroke-width:1}
    .tv{font-size:11px;fill:#374151}
    .warn{fill:#fef2f2;stroke:#fecaca;stroke-width:1}.warn-tx{font-size:12px;font-weight:700;fill:#b91c1c}
  </style>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="#fff" stroke="#111" stroke-width="1.5"/>
  ${parts.join('\n  ')}
</svg>`
}
