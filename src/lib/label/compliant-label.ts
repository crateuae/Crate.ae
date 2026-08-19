// ═══════════════════════════════════════════════════════════════════════════
// Compliant-label ARTWORK generator — deterministic, zero AI/credit.
//
// Turns the data a compliance check already produced (product name, ingredients,
// dates, nutrition, net content, origin, additive flags) into a print-ready SVG
// label laid out with the UAE.S 9:2019 mandatory sections (Arabic + English).
// Missing mandatory fields render as visible grey placeholders so the importer
// knows exactly what to supply before printing. Output is a self-contained SVG
// string (scalable, print-ready; the UI can also rasterize it to PNG).
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
  storage?: string | null
  production_date?: string | null
  expiry_date?: string | null
  importer?: string | null
  nutrition?: { columns: string[]; rows: { label: string; values: string[] }[] }
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Naive word-wrap → tspans. `rtl` right-anchors each line at x.
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
  const anchor = opts.rtl ? 'end' : 'start'
  const dir = opts.rtl ? ' direction="rtl"' : ''
  const svg = `<text x="${x}" y="${y}" text-anchor="${anchor}"${dir} class="${opts.cls || 'v'}">` +
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

  // Header — names
  parts.push(`<text x="${PAD}" y="${y}" class="name-en">${esc(d.product_name || 'Product name')}</text>`)
  parts.push(`<text x="${R}" y="${y + 30}" text-anchor="end" direction="rtl" class="name-ar">${d.product_name_ar ? esc(d.product_name_ar) : missing('اسم المنتج')}</text>`)
  y += 54
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${R}" y2="${y}" class="rule"/>`)
  y += 26

  // Net content + class row
  parts.push(`<text x="${PAD}" y="${y}" class="lbl">Net content / المحتوى الصافي:</text>`)
  parts.push(`<text x="${R}" y="${y}" text-anchor="end" class="v">${val(d.net_content, 'الوزن/الحجم الصافي')}</text>`)
  y += 30

  // Ingredients (Arabic mandatory)
  parts.push(`<text x="${R}" y="${y}" text-anchor="end" direction="rtl" class="hd-ar">المكوّنات</text>`)
  parts.push(`<text x="${PAD}" y="${y}" class="hd">Ingredients</text>`)
  y += 22
  const ing = d.ingredients_ar || d.ingredients
  if (ing && String(ing).trim()) {
    const w = wrap(ing, 58, R, y, 20, { rtl: /[؀-ۿ]/.test(ing), cls: 'v' })
    parts.push(w.svg); y += w.lines * 20 + 8
  } else {
    parts.push(`<text x="${R}" y="${y}" text-anchor="end" direction="rtl">${missing('قائمة المكوّنات بالعربية')}</text>`); y += 24
  }

  // Nutrition table (if present)
  const n = d.nutrition
  if (n && n.rows && n.rows.length) {
    y += 6
    parts.push(`<text x="${PAD}" y="${y}" class="hd">Nutrition Facts</text>`)
    parts.push(`<text x="${R}" y="${y}" text-anchor="end" direction="rtl" class="hd-ar">الحقائق الغذائية</text>`)
    y += 8
    const tx = PAD, tw = R - PAD, cols = Math.min(n.columns?.length || 1, 3)
    const rowH = 22
    const colW = (tw - 200) / cols
    // header
    parts.push(`<rect x="${tx}" y="${y}" width="${tw}" height="${rowH}" class="th"/>`)
    ;(n.columns || []).slice(0, cols).forEach((c, i) => {
      parts.push(`<text x="${tx + 200 + colW * i + colW / 2}" y="${y + 15}" text-anchor="middle" class="tv">${esc(c)}</text>`)
    })
    y += rowH
    n.rows.slice(0, 14).forEach((row, ri) => {
      if (ri % 2) parts.push(`<rect x="${tx}" y="${y}" width="${tw}" height="${rowH}" class="tr"/>`)
      parts.push(`<text x="${tx + 8}" y="${y + 15}" class="tv">${esc(row.label)}</text>`)
      ;(row.values || []).slice(0, cols).forEach((v, i) => {
        parts.push(`<text x="${tx + 200 + colW * i + colW / 2}" y="${y + 15}" text-anchor="middle" class="tv">${esc(v)}</text>`)
      })
      y += rowH
    })
    parts.push(`<rect x="${tx}" y="${y - rowH * (Math.min(n.rows.length, 14) + 1)}" width="${tw}" height="${rowH * (Math.min(n.rows.length, 14) + 1)}" class="tbox"/>`)
    y += 10
  }

  // Dates
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${R}" y2="${y}" class="rule-soft"/>`); y += 24
  parts.push(`<text x="${PAD}" y="${y}" class="lbl">Production / تاريخ الإنتاج:</text>`)
  parts.push(`<text x="${R}" y="${y}" text-anchor="end" class="v">${val(d.production_date, 'تاريخ الإنتاج')}</text>`); y += 28
  parts.push(`<text x="${PAD}" y="${y}" class="lbl">Expiry / تاريخ الانتهاء:</text>`)
  parts.push(`<text x="${R}" y="${y}" text-anchor="end" class="v">${val(d.expiry_date, 'تاريخ الانتهاء')}</text>`); y += 28

  // Storage
  parts.push(`<text x="${PAD}" y="${y}" class="lbl">Storage / ظروف التخزين:</text>`)
  parts.push(`<text x="${R}" y="${y}" text-anchor="end" class="v">${val(d.storage, 'ظروف التخزين')}</text>`); y += 28

  // Origin
  parts.push(`<text x="${PAD}" y="${y}" class="lbl">Country of origin / بلد المنشأ:</text>`)
  parts.push(`<text x="${R}" y="${y}" text-anchor="end" class="v">${val(d.origin_ar || d.country_of_origin, 'بلد المنشأ')}</text>`); y += 28

  // Importer
  parts.push(`<text x="${PAD}" y="${y}" class="lbl">Importer / المستورد:</text>`)
  parts.push(`<text x="${R}" y="${y}" text-anchor="end" class="v">${val(d.importer, 'اسم وعنوان المستورد')}</text>`); y += 28

  // Sulfite declaration
  if (d.has_sulfites) {
    parts.push(`<rect x="${PAD}" y="${y - 4}" width="${R - PAD}" height="26" class="warn"/>`)
    parts.push(`<text x="${R - 6}" y="${y + 13}" text-anchor="end" direction="rtl" class="warn-tx">يحتوي على سلفايت (E220–E228)</text>`)
    parts.push(`<text x="${PAD + 6}" y="${y + 13}" class="warn-tx">Contains sulphites</text>`); y += 34
  }

  y += 8
  parts.push(`<line x1="${PAD}" y1="${y}" x2="${R}" y2="${y}" class="rule-soft"/>`); y += 18
  parts.push(`<text x="${W / 2}" y="${y}" text-anchor="middle" class="foot">UAE.S 9:2019 template — verify all fields before printing · قالب مطابق للمواصفة، تحقّق قبل الطباعة</text>`)
  y += 24

  const H = Math.max(560, y + PAD)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Arial, 'Noto Sans Arabic', sans-serif">
  <style>
    .name-en{font-size:24px;font-weight:800;fill:#111}
    .name-ar{font-size:22px;font-weight:800;fill:#111}
    .hd{font-size:13px;font-weight:800;fill:#c2410c;text-transform:uppercase;letter-spacing:.5px}
    .hd-ar{font-size:14px;font-weight:800;fill:#c2410c}
    .lbl{font-size:12px;fill:#6b7280}
    .v{font-size:13px;fill:#111}
    .missing{fill:#ef4444;font-style:italic}
    .foot{font-size:10px;fill:#9ca3af}
    .rule{stroke:#111;stroke-width:2}
    .rule-soft{stroke:#e5e7eb;stroke-width:1}
    .th{fill:#f3f4f6}.tr{fill:#fafafa}.tbox{fill:none;stroke:#e5e7eb;stroke-width:1}
    .tv{font-size:11px;fill:#374151}
    .warn{fill:#fef2f2;stroke:#fecaca;stroke-width:1}.warn-tx{font-size:11px;font-weight:700;fill:#b91c1c}
  </style>
  <rect x="6" y="6" width="${W - 12}" height="${H - 12}" rx="10" fill="#fff" stroke="#111" stroke-width="1.5"/>
  ${parts.join('\n  ')}
</svg>`
}
