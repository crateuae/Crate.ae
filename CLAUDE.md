@AGENTS.md

# Crate.ae FMCG Database — Research & Implementation Guide

## 🎯 Mission

Build a unified FMCG product database for UAE market with reliable data, accurate FMCG velocity classification, and real-time market signals.

---

## 📊 FMCG Classification System (A/B/C)

Products are classified by velocity in the UAE retail market:

| Class | Turnover | Units/Week/Store | Market Penetration | Score | Example |
|-------|----------|------------------|--------------------|-------|---------|
| **A** (Fast) | 0–7 days | 20+ | 80%+ | 80–100 | Masafi Water, Coca-Cola, Milk |
| **B** (Medium) | 8–21 days | 8–19 | 60–80% | 40–79 | Rice, Olive Oil, Flour |
| **C** (Slow) | 22+ days | <8 | <60% | 10–39 | Premium Honey, Specialty Items |

### Key Metrics
- **turnover_days**: Average days to sell one carton in a typical UAE retail store
- **weekly_units_per_store**: Average units moved per store per week
- **market_penetration_pct**: % of UAE retail outlets stocking this SKU
- **fmcg_score**: Composite 0–100 derived from above metrics

---

## 🔍 Research Methodology (Token-Efficient)

### Search Strategy: 3–4 Focused Queries Per Product

**Search 1: Product Basics**
```
[Product name] ingredients nutrition facts barcode [size]
```
→ Yields: ingredients, nutrition info, product specs, barcode

**Search 2: UAE Market + Distribution**
```
[Product name] UAE price distributor ADNOC Amazon.ae [retail channel]
```
→ Yields: wholesale price, retail price, distributor name, retail presence

**Search 3: Market Data (if product is unregistered or new)**
```
[Product name] market share global demand trends [country origin]
```
→ Yields: global demand signals, market size estimates, regional adoption

**Search 4: Regional/Social (optional, only if gap is high)**
```
[Product name] Instagram Bahrain GCC demand social media trend
```
→ Yields: brand awareness, regional demand, emerging signals

### ⚡ Token Saving Rules
1. **No Sequential Searches**: Run searches in parallel via single WebSearch call with multiple queries
2. **Source Prioritization**: Official > Wikipedia > OpenFoodFacts > Brand distributor sites > News > Social
3. **Memory-First**: Check auto-memory before searching (prevents re-research)
4. **One Search Per Gap**: If you have 80%+ confidence, stop searching

---

## 📦 Product Data Requirements

### Mandatory Fields (Commit Only If Known)
```typescript
{
  id: 'p001',
  name_ar: '',        // Product name in Arabic
  name_en: '',        // Product name in English
  brand: '',          // Brand name
  country_origin: '', // Manufacturing country
  country_origin_ar: '',
  
  // Pricing (AED)
  price_retail_aed: 0,     // Single unit retail
  price_wholesale_aed: 0,  // Per carton
  price_import_aed: 0,     // Landed cost (if unregistered)
  
  // FMCG Classification
  fmcg_class: 'A',                    // A | B | C
  fmcg_score: 85,                     // 0–100
  fmcg_turnover_days: 3,              // days
  fmcg_weekly_units: 48,              // units/week/store
  fmcg_penetration_pct: 98,           // % UAE stores
  
  // Market Signal
  market_signal: 'shortage',          // shortage | rising | arbitrage | stable
  gap_score: 75,                      // 0–100 opportunity size
  
  // Distribution
  local_distributor_note: 'RAM Trading LLC...',
  
  // Certifications
  certifications: ['ESMA', 'Halal'],
  
  // Shelf Life
  shelf_life_months: 18,
  storage_temp: '4–25 °C'
}
```

### When to Say "Unknown"
- ❌ Don't guess FMCG class from keyword volume alone
- ❌ Don't estimate penetration without retail visits (use distributor data instead)
- ✅ Mark as "TBD" if confidence < 70%
- ✅ Note price ranges if sources vary (9.5–12 AED)
- ✅ Use distributor claims only if they're official (RAM Trading, ADNOC, Amazon.ae)

---

## 🛍️ UAE Market Channels (Where to Find Data)

| Channel | Purpose | Data Source |
|---------|---------|-------------|
| **ADNOC Oasis** | Convenience, quick-serve | Direct store visits, RAM Trading |
| **Amazon.ae** | E-commerce, pricing | Website scraping, reviews |
| **Grandiose.ae** | Supermarket delivery | Website, pricing history |
| **Grocerjy.com** | Online grocery | Bulk ordering data |
| **HORECA (Hotels/Restaurants)** | Institutional demand | Distributor records |
| **Lulu, Carrefour, Noon** | Hypermarkets | Brand partner data, distributor reports |
| **Mini-marts & Spinneys** | Retail, premium brands | Local visits |

---

## 📝 Data Accuracy Standards

### Before Committing to DB:
1. **Price Verification**: 2+ sources OR official distributor quote
2. **FMCG Velocity**: Based on retail presence + historical sales (not guesses)
3. **Ingredients**: Official label or OpenFoodFacts verified entry
4. **Certifications**: ESMA registration OR distributor Halal letter
5. **Origin**: Check country, not just brand (e.g., Traubi = Hungary, not Austria)

### Red Flags (Investigate Further)
- Price varies >20% across sources → Note range, contact distributor
- "Unregistered" label but available in UAE → Get import history
- Social media viral ≠ Market penetration → Verify retail presence
- Brand website lists no UAE distributor → Confirm unofficial imports only

---

## 💾 File Structure (Source of Truth)

```
src/lib/data/products-catalog.ts
├── CatalogProduct interface
├── PRODUCTS_CATALOG array (29 products)
├── FMCG_MAP (FMCG data per product)
└── PRODUCT_SLUG_MAP (URL slugs)

supabase/seed.sql
├── 11 categories
├── 25 subcategories
├── 29 products with full FMCG data
├── 8 gap_alerts (market opportunities)
└── Idempotent (can run multiple times)

src/app/[locale]/
├── products/page.tsx (product list + FMCG badges)
├── products/[id]/page.tsx (detail page + FMCG card + market signals)
├── market/page.tsx (market opportunities)
└── dashboard/
    ├── market-signals/ (CRUD for gap_alerts)
    └── packaging/ (emoji icons for specs)
```

---

## 🔐 Bilingual Content Rule (Non-Negotiable)

**ALL pages + ALL product data = Arabic + English**
- No English-only content
- No TS/TypeScript errors
- No database nulls on bilingual fields
- AR always right-to-left, EN left-to-right

---

## 📈 Market Research Priority

### Tier 1 (Complete Data)
- Top 5 beverages (Coca-Cola, Water, Red Bull, etc.)
- Top 3 daily staples (milk, rice, bread equivalents)
- Fastest-moving FMCG in each category

### Tier 2 (Prioritize)
- Unregistered products with high demand (gap_score > 70)
- Products listed at ADNOC Oasis or Gulfood exhibitions
- Brand new entrants in UAE market

### Tier 3 (Nice to Have)
- Slow-moving premium brands (honey, specialty oils)
- Regional variants (local distributor rebrands)
- Discontinued items (historical reference)

---

## 🚀 Implementation Checklist

- [ ] **Product Added**: Catalog entry + bilingual content + FMCG data
- [ ] **Research Complete**: 3+ sources verified, gap_score 0–100
- [ ] **Seed SQL**: Row inserted, idempotent test passed
- [ ] **Market Signal**: gap_alert created (shortage/rising/arbitrage/stable)
- [ ] **Page Tested**: Product detail page loads, FMCG card displays, signals show
- [ ] **Deployed**: Commit pushed, Vercel built, live URL working
- [ ] **Memory Saved**: Research notes stored in auto-memory for future reference

---

## 🎓 Example: How We Research Traubi

**Query 1** (Product Basics):
```
Traubi raisin drink ingredients nutrition facts barcode 6251089002759
```
Result: Hydroxybenzoate, 5% grape juice, Hungarian origin 1954

**Query 2** (UAE Market):
```
Traubi raisin drink UAE price ADNOC Amazon.ae distributor RAM Trading
```
Result: 9.5 AED retail, 130 AED/carton wholesale, RAM exclusive

**Query 3** (Market Trends):
```
Traubi Hungaria manufacturer production capacity export GCC Gulfood 2025
```
Result: Balatonvilágos factory, 2025 GCC expansion, no direct competitors

**Outcome**:
- FMCG Class: B (medium mover, 62/100)
- Gap Score: 62 (unique product, room to grow)
- Market Signal: Rising demand
- Commitment: ✅ Added to DB with confidence

---

## 🔗 Key Endpoints

- `/ar/products` — Product list (Arabic)
- `/en/products` — Product list (English)
- `/ar/products/coca-cola-330ml` — Detail page by slug
- `/ar/market` — Market opportunities (Radar)
- `/ar/dashboard/market-signals` — Edit gap_alerts
- `/ar/dashboard/packaging` — Packaging specs (emojis)

---

**Version**: 1.0 | **Last Updated**: June 2026 | **Owner**: Crate.ae Team
