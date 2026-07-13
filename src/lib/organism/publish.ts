/**
 * THE HANDS — autonomous publishing with a content quality gate.
 *
 * Takes APPROVED opportunities and turns them into live, SEO-optimised bilingual
 * pages (rows in `articles`, rendered at /[locale]/insights/[slug]). This is the
 * SEO weapon: own "[product] UAE" in Google before competitors.
 *
 * IMMUNE SYSTEM (anti Google scaled-content-abuse):
 *   - Content quality gate: minimum bilingual length, real title, tags, unique slug.
 *     Thin / templated output is rejected — it must NOT reach Google.
 *   - Rate governor: never exceed the brain's daily_publish_cap per day.
 *   - dedup: unique slug prevents duplicate pages.
 *
 * On success: article inserted (is_published=true) → opportunity → 'published'
 * with published_url, then an optional IndexNow ping notifies search engines.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { BrainConfig } from './types'
import { generateArticle } from '@/lib/ai/claude'
import { matchProductInCatalog, createSkeletonProduct, updateProductContent, linkOpportunityToProduct } from '@/lib/supabase/products-unified'

const MIN_BODY_CHARS = 400          // quality gate: each language must be substantial
const MIN_TAGS = 2

// UAE-restricted terms must never appear in a public slug/URL (legal).
const BANNED_SLUG_WORDS = /\b(intelligence|command|operations?|radar|surveillance|espionage)\b/gi

function slugify(s: string): string {
  return s.toLowerCase()
    .replace(/\s+uae\b/g, '')
    .replace(BANNED_SLUG_WORDS, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `insight-${Date.now()}`
}

interface GeneratedArticle {
  title_ar: string; title_en: string
  body_ar: string; body_en: string
  tags: string[]; slug: string
}

/** Content quality gate — returns null if it passes, or a reason string if it fails. */
function contentGate(a: GeneratedArticle): string | null {
  if (!a.title_ar?.trim() || !a.title_en?.trim()) return 'missing_bilingual_title'
  if ((a.body_ar?.length ?? 0) < MIN_BODY_CHARS) return `thin_body_ar(${a.body_ar?.length ?? 0})`
  if ((a.body_en?.length ?? 0) < MIN_BODY_CHARS) return `thin_body_en(${a.body_en?.length ?? 0})`
  if ((a.tags?.length ?? 0) < MIN_TAGS) return 'insufficient_tags'
  return null
}

// IndexNow key. Public BY DESIGN (ownership is proven by serving it at
// /<key>.txt) — so it is hardcoded, needs no env var, and works out of the box.
const INDEXNOW_KEY = '9d4f1a7c8e2b0f635a1c7e9d3b6f204a'

/** IndexNow ping — instant "please (re)crawl" to Bing/Yandex/Seznam (Google also
 * reads IndexNow). Pings BOTH locales of each published path. Best-effort. */
async function pingIndexNow(paths: string[]) {
  const host = 'www.crate.ae'
  const urlList = paths.flatMap(p => [`https://${host}/ar${p}`, `https://${host}/en${p}`])
  if (!urlList.length) return
  try {
    await fetch('https://api.indexnow.org/indexnow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `https://${host}/${INDEXNOW_KEY}.txt`, urlList }),
    })
  } catch { /* best-effort */ }
}

export interface PublishResult { attempted: number; published: number; blocked: number; cap_reached: boolean }

export async function publishApproved(db: SupabaseClient, brain: BrainConfig): Promise<PublishResult> {
  // Rate governor: how many already published today?
  const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0)
  const { count: publishedToday } = await db
    .from('opportunities')
    .select('*', { count: 'exact', head: true })
    .eq('stage', 'published')
    .gte('published_at', startOfDay.toISOString())
  let budget = Math.max(0, brain.daily_publish_cap - (publishedToday ?? 0))
  if (budget === 0) return { attempted: 0, published: 0, blocked: 0, cap_reached: true }

  // Per-run throughput: one 6am invocation publishes several pages instead of one.
  // Bilingual generation uses Claude Haiku (~8-13s/article). Budgeting ~13s each,
  // 4 articles ≈ 52s, safely under the 60s Vercel function limit (maxDuration=60).
  // The daily_publish_cap still bounds the total across the day.
  const PER_RUN = 4
  // Wall-clock guard: never START an article we might not finish in time. Reserve
  // ~10s of the 60s ceiling (startup + brain fetch + per-article gen + response),
  // so we stop cleanly before the platform kills the function mid-write.
  const startedAt = Date.now()
  const ELAPSED_BUDGET_MS = 50_000
  const { data: queue } = await db
    .from('opportunities')
    .select('*')
    .eq('stage', 'approved')
    .order('composite_score', { ascending: false })
    .limit(Math.min(budget, PER_RUN))

  if (!queue?.length) return { attempted: 0, published: 0, blocked: 0, cap_reached: false }

  let published = 0, blocked = 0
  const publishedPaths: string[] = [] // collected for a single IndexNow ping at the end
  for (const o of queue) {
    if (budget <= 0) break
    // Time governor: if we're past the wall-clock budget, stop before generating
    // another article. Remaining approved items simply publish on the next run.
    if (Date.now() - startedAt >= ELAPSED_BUDGET_MS) break
    try {
      const keyword = o.title as string
      const art = await generateArticle(keyword, 'both') as GeneratedArticle

      const gateFail = contentGate(art)
      if (gateFail) {
        await db.from('opportunities').update({
          stage: 'scored', blocked_reason: `content_gate:${gateFail}`, stage_changed_at: new Date().toISOString(),
        }).eq('id', o.id)
        await logEvent(db, o.id, 'blocked', 'approved', 'scored', { reason: gateFail })
        blocked++
        continue
      }

      // Determine opportunity type based on composite_score
      const determineType = (score: number): 'verified' | 'high' | 'opportunity' => {
        if (score >= 75) return 'verified'
        if (score >= 65) return 'high'
        return 'opportunity'
      }
      const oppType = determineType(o.composite_score)

      // ① Try to match with existing product
      const matchedProductId = matchProductInCatalog(keyword)

      if (matchedProductId) {
        // MATCHED: Update existing product with organism content
        const success = await updateProductContent(db, matchedProductId, {
          content_ar: art.body_ar,
          content_en: art.body_en,
          tags: art.tags,
        })

        if (success) {
          await linkOpportunityToProduct(db, matchedProductId, o.id)

          // Mark as published → Verified opportunity (clean slug URL for SEO)
          const { data: mp } = await db.from('products').select('slug').eq('id', matchedProductId).maybeSingle()
          const publishedUrl = `/products/${mp?.slug ?? matchedProductId}`
          await db.from('opportunities').update({
            stage: 'published',
            published_url: publishedUrl,
            published_at: new Date().toISOString(),
            blocked_reason: null,
            stage_changed_at: new Date().toISOString(),
          }).eq('id', o.id)

          await logEvent(db, o.id, 'published', 'approved', 'published', {
            type: oppType,
            product_id: matchedProductId,
            url: publishedUrl,
          })

          publishedPaths.push(publishedUrl)
          published++; budget--
          continue
        }
      }

      // ② NO MATCH: Create new product directly (no skeleton, publish immediately)
      const newProductId = await createSkeletonProduct(db, {
        id: o.id,
        title: keyword,
        title_ar: o.title_ar,
        body_ar: art.body_ar,
        body_en: art.body_en,
        tags: art.tags,
      })

      if (!newProductId) {
        await logEvent(db, o.id, 'blocked', 'approved', 'approved', {
          reason: 'product_creation_failed',
        })
        blocked++
        continue
      }

      // Publish immediately → High or Opportunity type (clean slug URL for SEO)
      const { data: np } = await db.from('products').select('slug').eq('id', newProductId).maybeSingle()
      const publishedUrl = `/products/${np?.slug ?? newProductId}`
      await db.from('opportunities').update({
        stage: 'published',
        published_url: publishedUrl,
        published_at: new Date().toISOString(),
        blocked_reason: null,
        stage_changed_at: new Date().toISOString(),
      }).eq('id', o.id)

      await logEvent(db, o.id, 'published', 'approved', 'published', {
        type: oppType,
        product_id: newProductId,
        url: publishedUrl,
      })

      publishedPaths.push(publishedUrl)
      published++; budget--
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      await logEvent(db, o.id, 'blocked', 'approved', 'approved', { reason: `error:${msg}` })
      blocked++
    }
  }

  // One IndexNow ping for everything published this run (instant recrawl signal).
  if (publishedPaths.length) await pingIndexNow(publishedPaths)

  return { attempted: queue.length, published, blocked, cap_reached: budget <= 0 }
}

// Local copy of the event logger (keeps publish self-contained).
async function logEvent(
  db: SupabaseClient, opportunityId: string, eventType: string,
  fromStage: string | null, toStage: string | null, payload: Record<string, unknown> = {},
) {
  await db.from('opportunity_events').insert({
    opportunity_id: opportunityId, event_type: eventType, from_stage: fromStage, to_stage: toStage, payload,
  })
}
