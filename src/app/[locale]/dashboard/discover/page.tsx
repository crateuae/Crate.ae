'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, TrendingUp, TrendingDown, Minus, AlertCircle,
  CheckCircle2, XCircle, RefreshCw, Sparkles, ExternalLink,
  Filter, ChevronDown, Eye, Plus, Trash2, BarChart3,
  ShoppingCart, MessageSquare, Globe, DollarSign, Target,
  ChevronRight, Loader2,
} from 'lucide-react'
import { useParams } from 'next/navigation'
import type { AnalyzeResponse, DecisionFactor } from '@/app/api/trends/analyze/route'

// ─── Shared types (inline to avoid import issues) ────────────────────────────

interface Discovery {
  id: string
  keyword: string
  keyword_ar: string | null
  trend_score: number
  uae_interest_pct: number
  trend_direction: 'rising' | 'stable' | 'falling'
  category_guess: string | null
  gap_score: number
  is_available_uae: boolean | null
  status: 'pending' | 'reviewed' | 'added' | 'dismissed'
  notes: string | null
  source_label: string | null
  related_queries: string[] | null
  retailer_mentions: string[] | null
  avg_price_aed: number | null
  discovered_at: string
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  pending:   { ar: 'جديد',          en: 'New',       cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  reviewed:  { ar: 'تمت المراجعة',  en: 'Reviewed',  cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  added:     { ar: 'في الكتالوج',   en: 'Added',     cls: 'bg-green-100 text-green-700 border-green-200' },
  dismissed: { ar: 'مُستبعد',       en: 'Dismissed', cls: 'bg-gray-100 text-gray-500 border-gray-200' },
} as const

const DIR_CFG = {
  rising:  { Icon: TrendingUp,   color: 'text-green-600', bg: 'bg-green-50',  ar: 'صاعد',  en: 'Rising'  },
  stable:  { Icon: Minus,        color: 'text-gray-500',  bg: 'bg-gray-50',   ar: 'مستقر', en: 'Stable'  },
  falling: { Icon: TrendingDown, color: 'text-red-500',   bg: 'bg-red-50',    ar: 'هابط',  en: 'Falling' },
}

const DECISION_CFG = {
  strong_import: { color: 'text-green-700',  bg: 'bg-green-50',  border: 'border-green-200', stars: '⭐⭐⭐⭐⭐' },
  investigate:   { color: 'text-blue-700',   bg: 'bg-blue-50',   border: 'border-blue-200',  stars: '⭐⭐⭐⭐' },
  monitor:       { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200',stars: '⭐⭐⭐' },
  skip:          { color: 'text-gray-600',   bg: 'bg-gray-50',   border: 'border-gray-200',  stars: '⭐⭐' },
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function GapBar({ score, size = 'sm' }: { score: number; size?: 'sm' | 'lg' }) {
  const color = score >= 75 ? 'bg-red-500' : score >= 58 ? 'bg-orange-500' : score >= 40 ? 'bg-blue-400' : 'bg-gray-300'
  return (
    <div className={`w-full bg-gray-100 rounded-full ${size === 'lg' ? 'h-2.5' : 'h-1.5'} mt-1`}>
      <div className={`${color} ${size === 'lg' ? 'h-2.5' : 'h-1.5'} rounded-full transition-all`} style={{ width: `${score}%` }} />
    </div>
  )
}

// ─── Analysis Panel ───────────────────────────────────────────────────────────

function AnalysisPanel({ result, isAr }: { result: AnalyzeResponse; isAr: boolean }) {
  const { sources, analysis } = result
  const dcfg = DECISION_CFG[analysis.decision]

  return (
    <div className="space-y-4">

      {/* Overall score + recommendation */}
      <div className={`rounded-2xl border-2 ${dcfg.border} ${dcfg.bg} p-5`}>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex-1">
            <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
              {isAr ? 'درجة الفرصة الإجمالية' : 'Overall Opportunity Score'}
            </div>
            <div className={`text-5xl font-black ${dcfg.color}`}>{analysis.opportunity_score}<span className="text-2xl text-gray-400">/100</span></div>
            <GapBar score={analysis.opportunity_score} size="lg" />
            <div className={`mt-3 font-bold text-sm ${dcfg.color}`}>
              {isAr ? analysis.recommendation_ar : analysis.recommendation_en}
            </div>
          </div>
          <div className="text-4xl">{dcfg.stars.split('').join('')}</div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">{isAr ? 'مستوى الطلب' : 'Demand'}</div>
            <div className={`font-black text-sm ${analysis.demand_level === 'high' ? 'text-green-600' : analysis.demand_level === 'medium' ? 'text-orange-500' : 'text-gray-400'}`}>
              {analysis.demand_level === 'high' ? (isAr ? 'عالٍ' : 'High') : analysis.demand_level === 'medium' ? (isAr ? 'متوسط' : 'Medium') : (isAr ? 'منخفض' : 'Low')}
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">{isAr ? 'المنافسة' : 'Competition'}</div>
            <div className={`font-black text-sm ${analysis.competition_level === 'low' ? 'text-green-600' : analysis.competition_level === 'medium' ? 'text-orange-500' : 'text-red-600'}`}>
              {analysis.competition_level === 'low' ? (isAr ? 'منخفضة' : 'Low') : analysis.competition_level === 'medium' ? (isAr ? 'متوسطة' : 'Medium') : (isAr ? 'عالية' : 'High')}
            </div>
          </div>
          <div className="bg-white/70 rounded-xl p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">{isAr ? 'فجوة السوق' : 'Market Gap'}</div>
            <div className={`font-black text-sm ${analysis.market_gap ? 'text-green-600' : 'text-red-500'}`}>
              {analysis.market_gap ? (isAr ? 'موجودة ⚡' : 'Yes ⚡') : (isAr ? 'مشغولة' : 'Filled')}
            </div>
          </div>
        </div>
      </div>

      {/* Source breakdown grid */}
      <div className="grid md:grid-cols-2 gap-3">

        {/* Google Trends */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            <span className="font-bold text-sm text-gray-800">Google Trends UAE</span>
            {sources.google_trends
              ? <span className="ms-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Live</span>
              : <span className="ms-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">—</span>
            }
          </div>
          {sources.google_trends ? (
            <div className="space-y-2">
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-3xl font-black text-blue-600">{sources.google_trends.interest_score}</div>
                  <div className="text-[10px] text-gray-400">/ 100 {isAr ? '(مقياس Google الأصلي)' : '(Google native scale)'}</div>
                </div>
                <div className={`flex items-center gap-1 text-sm font-bold px-2 py-1 rounded-lg ${DIR_CFG[sources.google_trends.direction].bg} ${DIR_CFG[sources.google_trends.direction].color}`}>
                  {(() => { const D = DIR_CFG[sources.google_trends.direction].Icon; return <D className="w-3.5 h-3.5" /> })()}
                  {isAr ? DIR_CFG[sources.google_trends.direction].ar : DIR_CFG[sources.google_trends.direction].en}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-400">{isAr ? 'الذروة (3 أشهر)' : 'Peak (3m)'}</div>
                  <div className="font-black text-gray-800">{sources.google_trends.peak_score}/100</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="text-gray-400">{isAr ? 'التغيّر' : 'Change'}</div>
                  <div className={`font-black ${sources.google_trends.change_pct > 0 ? 'text-green-600' : sources.google_trends.change_pct < 0 ? 'text-red-500' : 'text-gray-600'}`}>
                    {sources.google_trends.change_pct > 0 ? '+' : ''}{sources.google_trends.change_pct}%
                  </div>
                </div>
              </div>
              {sources.google_trends.related_queries.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">{isAr ? 'بحثات مرتبطة:' : 'Related:'}</div>
                  <div className="flex flex-wrap gap-1">
                    {sources.google_trends.related_queries.slice(0, 4).map(q => (
                      <span key={q} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md">{q}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">{isAr ? 'غير متاح' : 'Unavailable'}</div>
          )}
        </div>

        {/* Google Shopping */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-sm text-gray-800">Google Shopping UAE</span>
            {sources.google_shopping
              ? <span className="ms-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Live</span>
              : <span className="ms-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">—</span>
            }
          </div>
          {sources.google_shopping ? (
            <div className="space-y-2">
              <div className="flex items-end gap-4">
                <div>
                  <div className="text-3xl font-black text-orange-600">{sources.google_shopping.listing_count}</div>
                  <div className="text-[10px] text-gray-400">{isAr ? 'منتج معروض' : 'listings'}</div>
                </div>
                {sources.google_shopping.price_avg_aed && (
                  <div>
                    <div className="text-xl font-black text-gray-700">{sources.google_shopping.price_avg_aed} <span className="text-sm text-gray-400">AED</span></div>
                    <div className="text-[10px] text-gray-400">{isAr ? 'متوسط السعر' : 'avg price'}</div>
                  </div>
                )}
              </div>
              {(sources.google_shopping.price_min_aed || sources.google_shopping.price_max_aed) && (
                <div className="text-xs text-gray-500">
                  {isAr ? 'النطاق:' : 'Range:'} <span className="font-semibold text-gray-700">{sources.google_shopping.price_min_aed} – {sources.google_shopping.price_max_aed} AED</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className={`rounded-lg p-2 ${sources.google_shopping.amazon_listings === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="text-gray-400">Amazon.ae</div>
                  <div className={`font-black ${sources.google_shopping.amazon_listings === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sources.google_shopping.amazon_listings === 0 ? (isAr ? 'غير موجود ✓' : 'Not listed ✓') : `${sources.google_shopping.amazon_listings} منتج`}
                  </div>
                </div>
                <div className={`rounded-lg p-2 ${sources.google_shopping.noon_listings === 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <div className="text-gray-400">Noon.com</div>
                  <div className={`font-black ${sources.google_shopping.noon_listings === 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sources.google_shopping.noon_listings === 0 ? (isAr ? 'غير موجود ✓' : 'Not listed ✓') : `${sources.google_shopping.noon_listings} منتج`}
                  </div>
                </div>
              </div>
              {sources.google_shopping.sellers.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {sources.google_shopping.sellers.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-md">{s}</span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">{isAr ? 'غير متاح' : 'Unavailable'}</div>
          )}
        </div>

        {/* Google Search */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span className="font-bold text-sm text-gray-800">Google Search UAE</span>
            {sources.google_search
              ? <span className="ms-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Live</span>
              : <span className="ms-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">—</span>
            }
          </div>
          {sources.google_search ? (
            <div className="space-y-2">
              <div>
                <div className="text-3xl font-black text-indigo-600">{fmtNum(sources.google_search.total_results)}</div>
                <div className="text-[10px] text-gray-400">{isAr ? 'نتيجة بحث' : 'search results'}</div>
              </div>
              {sources.google_search.avg_price_aed && (
                <div className="text-sm">
                  <span className="text-gray-400">{isAr ? 'سعر ذُكر:' : 'Price mentioned:'} </span>
                  <span className="font-bold text-gray-700">~{sources.google_search.avg_price_aed} AED</span>
                </div>
              )}
              {sources.google_search.retailer_mentions.length > 0 ? (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1">{isAr ? 'متاجر تذكره:' : 'Retailers mentioned:'}</div>
                  <div className="flex flex-wrap gap-1">
                    {sources.google_search.retailer_mentions.slice(0, 5).map(r => (
                      <span key={r} className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-md">{r}</span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-green-600 font-semibold">✓ {isAr ? 'لا متاجر إماراتية تبيعه' : 'No UAE retailers found'}</div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-400">{isAr ? 'غير متاح' : 'Unavailable'}</div>
          )}
        </div>

        {/* Reddit */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="w-4 h-4 text-orange-600" />
            <span className="font-bold text-sm text-gray-800">Reddit UAE/Dubai</span>
            <span className="text-[9px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">مجاني</span>
            {sources.reddit
              ? <span className="ms-auto text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-semibold">✓ Live</span>
              : <span className="ms-auto text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">—</span>
            }
          </div>
          {sources.reddit ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-3xl font-black text-orange-600">{sources.reddit.mention_count}</div>
                  <div className="text-[10px] text-gray-400">{isAr ? 'ذكر في السنة' : 'mentions / year'}</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-gray-700">{fmtNum(sources.reddit.total_upvotes)}</div>
                  <div className="text-[10px] text-gray-400">{isAr ? 'إجمالي التفاعل' : 'total upvotes'}</div>
                </div>
              </div>
              <div className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${
                sources.reddit.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                sources.reddit.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {sources.reddit.sentiment === 'positive' ? '😊' : sources.reddit.sentiment === 'negative' ? '😞' : '😐'}
                {isAr
                  ? sources.reddit.sentiment === 'positive' ? 'إيجابي' : sources.reddit.sentiment === 'negative' ? 'سلبي' : 'محايد'
                  : sources.reddit.sentiment
                }
              </div>
              {sources.reddit.top_posts.slice(0, 2).map(p => (
                <a key={p.url} href={p.url} target="_blank" rel="noopener noreferrer"
                  className="block text-[11px] text-gray-500 hover:text-indigo-600 border border-gray-100 rounded-lg p-2 hover:border-indigo-200 transition-colors">
                  <span className="line-clamp-1">{p.title}</span>
                  <span className="text-gray-300 text-[10px]">r/{p.subreddit} · {p.score} pts</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-400">{isAr ? 'لا نتائج على Reddit' : 'No Reddit results'}</div>
          )}
        </div>
      </div>

      {/* Financial analysis */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4 text-sm">
          <DollarSign className="w-4 h-4 text-green-600" />
          {isAr ? 'التحليل المالي للاستيراد' : 'Import Financial Analysis'}
          <span className="text-[10px] font-normal text-gray-400 ms-1">{isAr ? '(تقديرات أولية — راجع الموردين)' : '(preliminary estimates — verify with suppliers)'}</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label_ar: 'سعر السوق الإماراتي', label_en: 'UAE Market Price', val: analysis.estimated_retail_price_aed ? `${analysis.estimated_retail_price_aed} AED` : '—', color: 'text-gray-800' },
            { label_ar: 'تكلفة الاستيراد', label_en: 'Import Cost Est.', val: analysis.estimated_import_price_aed ? `${analysis.estimated_import_price_aed} AED` : '—', color: 'text-blue-600' },
            { label_ar: 'هامش الربح', label_en: 'Profit Margin', val: analysis.estimated_margin_pct ? `${analysis.estimated_margin_pct}%` : '—', color: analysis.estimated_margin_pct && analysis.estimated_margin_pct >= 35 ? 'text-green-600' : 'text-orange-500' },
            { label_ar: 'رأس المال المقترح', label_en: 'Suggested Capex', val: analysis.estimated_capex_aed || '—', color: 'text-purple-600' },
          ].map(f => (
            <div key={f.label_en} className="bg-gray-50 rounded-xl p-3">
              <div className="text-[10px] text-gray-400 mb-1">{isAr ? f.label_ar : f.label_en}</div>
              <div className={`font-black text-lg ${f.color}`}>{f.val}</div>
            </div>
          ))}
        </div>
        {analysis.estimated_monthly_units && (
          <div className="text-xs text-gray-500 bg-blue-50 border border-blue-100 rounded-xl p-3">
            📦 {isAr ? 'الحجم الشهري المتوقع:' : 'Expected monthly volume:'} <span className="font-bold text-blue-700">{analysis.estimated_monthly_units}</span>
          </div>
        )}
      </div>

      {/* Decision factors */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4 text-sm">
          <Target className="w-4 h-4 text-orange-500" />
          {isAr ? 'عوامل اتخاذ القرار' : 'Decision Factors'}
        </h3>
        <div className="space-y-2">
          {analysis.decision_factors.map((f: DecisionFactor, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
              f.impact === 'positive' ? 'bg-green-50 border-green-100' :
              f.impact === 'negative' ? 'bg-red-50 border-red-100'    :
              'bg-gray-50 border-gray-100'
            }`}>
              <span className="flex-shrink-0 mt-0.5">
                {f.impact === 'positive' ? '✅' : f.impact === 'negative' ? '❌' : '⚠️'}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${
                  f.impact === 'positive' ? 'text-green-800' :
                  f.impact === 'negative' ? 'text-red-800'   :
                  'text-gray-700'
                }`}>
                  {isAr ? f.factor_ar : f.factor_en}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">{f.data}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Links */}
      <div className="flex flex-wrap gap-2">
        <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(result.keyword)}&geo=AE`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl transition-colors">
          <ExternalLink className="w-3 h-3" />Google Trends AE
        </a>
        <a href={`https://www.google.com/search?q=${encodeURIComponent(result.keyword + ' UAE price AED')}&gl=ae`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors">
          <Search className="w-3 h-3" />Google UAE
        </a>
        <a href={`https://www.amazon.ae/s?k=${encodeURIComponent(result.keyword)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl transition-colors">
          <ShoppingCart className="w-3 h-3" />Amazon.ae
        </a>
        <a href={`https://www.noon.com/uae-en/search/?q=${encodeURIComponent(result.keyword)}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-yellow-700 hover:text-yellow-800 bg-yellow-50 border border-yellow-200 px-3 py-1.5 rounded-xl transition-colors">
          <ShoppingCart className="w-3 h-3" />Noon.com
        </a>
        <a href={`https://www.reddit.com/search/?q=${encodeURIComponent(result.keyword + ' UAE')}`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-orange-700 hover:text-orange-800 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-xl transition-colors">
          <MessageSquare className="w-3 h-3" />Reddit
        </a>
      </div>
    </div>
  )
}

// ─── Discovery card ───────────────────────────────────────────────────────────

function DiscoveryCard({ disc, isAr, onStatus, updatingId }: {
  disc: Discovery
  isAr: boolean
  onStatus: (id: string, s: Discovery['status']) => void
  updatingId: string | null
}) {
  const [expanded, setExpanded] = useState(false)
  const sc  = STATUS_CFG[disc.status]
  const dir = DIR_CFG[disc.trend_direction]
  const DirIcon = dir.Icon
  const isHigh = disc.gap_score >= 70
  const isUpdating = updatingId === disc.id

  return (
    <div className={`bg-white rounded-2xl border transition-all hover:shadow-md ${
      isHigh ? 'border-orange-300 shadow-orange-50 shadow-sm' : 'border-gray-200'
    } ${disc.status === 'dismissed' ? 'opacity-50' : ''}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="min-w-0 flex-1 me-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isHigh && <span className="text-[10px] font-black text-orange-500">🎯</span>}
              <span className="font-bold text-gray-900 text-sm">{disc.keyword.replace(' UAE', '').replace(' الإمارات', '')}</span>
              {disc.trend_direction === 'rising' && <TrendingUp className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
            </div>
            {disc.keyword_ar && <div className="text-xs text-gray-400 mt-0.5" dir="rtl">{disc.keyword_ar.replace(' الإمارات', '')}</div>}
          </div>
          <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full border ${sc.cls}`}>
            {isAr ? sc.ar : sc.en}
          </span>
        </div>

        {disc.category_guess && (
          <div className="text-[10px] bg-purple-50 text-purple-600 border border-purple-100 rounded-md px-2 py-0.5 inline-block mb-3 font-semibold">{disc.category_guess}</div>
        )}

        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { val: disc.trend_score, label: 'Trend', color: disc.trend_score >= 70 ? 'text-orange-500' : disc.trend_score >= 45 ? 'text-blue-500' : 'text-gray-400' },
            { val: disc.uae_interest_pct, label: 'UAE', color: 'text-gray-700' },
            { val: disc.gap_score, label: isAr ? 'فجوة' : 'Gap', color: isHigh ? 'text-orange-600' : 'text-gray-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-2 text-center ${isHigh && s.label !== 'Trend' && s.label !== 'UAE' ? 'bg-orange-50' : 'bg-gray-50'}`}>
              <div className={`text-base font-black ${s.color}`}>{s.val}</div>
              <div className="text-[9px] text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
        <GapBar score={disc.gap_score} />

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${dir.bg} ${dir.color}`}>
            <DirIcon className="w-3 h-3" />
            {isAr ? dir.ar : dir.en}
          </span>
          {disc.is_available_uae === false && (
            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" />{isAr ? 'غير متوفر ⚡' : 'Not in UAE ⚡'}
            </span>
          )}
          {disc.avg_price_aed && <span className="ms-auto text-[10px] text-gray-400 font-medium">~{disc.avg_price_aed} AED</span>}
        </div>

        {expanded && disc.related_queries && disc.related_queries.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {disc.related_queries.slice(0, 5).map(q => (
                <span key={q} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md">{q}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-2">
        <a href={`https://trends.google.com/trends/explore?q=${encodeURIComponent(disc.keyword)}&geo=AE`}
          target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-1 text-[11px] text-blue-500 hover:text-blue-600 font-semibold">
          <ExternalLink className="w-3 h-3" />Trends
        </a>
        {disc.related_queries?.length ? (
          <button onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-[11px] text-gray-400 hover:text-gray-600">
            <Eye className="w-3 h-3" />{isAr ? (expanded ? 'أقل' : 'أكثر') : (expanded ? 'Less' : 'More')}
          </button>
        ) : null}

        <div className="ms-auto flex items-center gap-1.5">
          {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" /> : (
            <>
              {disc.status === 'pending' && <>
                <button onClick={() => onStatus(disc.id, 'reviewed')} className="text-[11px] text-blue-600 font-bold px-2.5 py-1 bg-blue-50 rounded-lg hover:bg-blue-100">{isAr ? 'راجع' : 'Review'}</button>
                <button onClick={() => onStatus(disc.id, 'dismissed')} className="text-[11px] text-gray-400 hover:text-gray-600 px-2 py-1 bg-gray-50 rounded-lg"><Trash2 className="w-3 h-3" /></button>
              </>}
              {disc.status === 'reviewed' && <>
                <button onClick={() => onStatus(disc.id, 'added')} className="flex items-center gap-1 text-[11px] text-green-700 font-bold px-2.5 py-1 bg-green-50 rounded-lg hover:bg-green-100">
                  <Plus className="w-3 h-3" />{isAr ? 'للكتالوج' : 'Add'}
                </button>
                <button onClick={() => onStatus(disc.id, 'dismissed')} className="text-[11px] text-gray-400 px-2 py-1 bg-gray-50 rounded-lg"><Trash2 className="w-3 h-3" /></button>
              </>}
              {disc.status === 'added' && <span className="flex items-center gap-1 text-[11px] text-green-600 font-semibold"><CheckCircle2 className="w-3.5 h-3.5" />{isAr ? 'مضاف' : 'Added'}</span>}
              {disc.status === 'dismissed' && <button onClick={() => onStatus(disc.id, 'pending')} className="text-[11px] text-gray-400 hover:text-orange-500">{isAr ? 'استعادة' : 'Restore'}</button>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DiscoverPage() {
  const params  = useParams()
  const locale  = params.locale as string
  const isAr    = locale === 'ar'

  // Discover state
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [loading, setLoading]         = useState(true)
  const [scanning, setScanning]       = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [catFilter, setCatFilter]     = useState<string>('all')
  const [sortBy, setSortBy]           = useState('gap_score')
  const [scanResult, setScanResult]   = useState<{ new_discoveries: number; inserted: number; scanned: number; top_opportunities: { keyword: string; gap_score: number; trend_direction: string }[] } | null>(null)
  const [error, setError]             = useState<string | null>(null)
  const [updatingId, setUpdatingId]   = useState<string | null>(null)

  // Search / analyze state
  const [searchQuery, setSearchQuery] = useState('')
  const [analyzing, setAnalyzing]     = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null)
  const [analyzeError, setAnalyzeError]     = useState<string | null>(null)

  const categories = Array.from(new Set(discoveries.map(d => d.category_guess).filter(Boolean))) as string[]

  const filtered = discoveries
    .filter(d => statusFilter === 'all' || d.status === statusFilter)
    .filter(d => catFilter === 'all' || d.category_guess === catFilter)
    .sort((a, b) => {
      if (sortBy === 'trend_score') return b.trend_score - a.trend_score
      if (sortBy === 'uae_interest_pct') return b.uae_interest_pct - a.uae_interest_pct
      if (sortBy === 'discovered_at') return new Date(b.discovered_at).getTime() - new Date(a.discovered_at).getTime()
      return b.gap_score - a.gap_score
    })

  const stats = {
    total:   discoveries.length,
    pending: discoveries.filter(d => d.status === 'pending').length,
    highGap: discoveries.filter(d => d.gap_score >= 70).length,
    rising:  discoveries.filter(d => d.trend_direction === 'rising').length,
  }

  const loadDiscoveries = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/trends/discover?status=all&limit=100')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setDiscoveries(data.discoveries || [])
    } catch (e) {
      setError(isAr ? 'فشل تحميل الاكتشافات' : 'Failed to load discoveries')
      console.error(e)
    } finally { setLoading(false) }
  }, [isAr])

  async function startScan() {
    setScanning(true); setScanResult(null); setError(null)
    try {
      const res = await fetch('/api/trends/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-cron-secret': 'dev' },
        body: JSON.stringify({ limit: 20 }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      const data = await res.json()
      setScanResult(data)
      await loadDiscoveries()
    } catch (e: unknown) {
      setError(isAr ? `فشل المسح: ${(e as Error).message}` : `Scan failed: ${(e as Error).message}`)
    } finally { setScanning(false) }
  }

  async function analyzeProduct() {
    if (!searchQuery.trim()) return
    setAnalyzing(true); setAnalysisResult(null); setAnalyzeError(null)
    try {
      const res = await fetch('/api/trends/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: searchQuery.trim() }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || `HTTP ${res.status}`) }
      const data: AnalyzeResponse = await res.json()
      setAnalysisResult(data)
    } catch (e: unknown) {
      setAnalyzeError(isAr ? `فشل التحليل: ${(e as Error).message}` : `Analysis failed: ${(e as Error).message}`)
    } finally { setAnalyzing(false) }
  }

  async function updateStatus(id: string, status: Discovery['status']) {
    setUpdatingId(id)
    try {
      const res = await fetch('/api/trends/discover', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })
      if (res.ok) setDiscoveries(prev => prev.map(d => d.id === id ? { ...d, status } : d))
    } finally { setUpdatingId(null) }
  }

  useEffect(() => { loadDiscoveries() }, [loadDiscoveries])

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
              <span>🔍</span>{isAr ? 'اكتشاف المنتجات' : 'Product Discovery'}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {isAr ? '5 مصادر: Google Trends + Shopping + Search + Amazon.ae + Reddit' : '5 sources: Google Trends + Shopping + Search + Amazon.ae + Reddit'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={loadDiscoveries} disabled={loading}
              className="p-2.5 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={startScan} disabled={scanning || loading}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 shadow-sm hover:shadow-md transition-all">
              <Sparkles className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              {scanning ? (isAr ? 'جاري المسح...' : 'Scanning...') : (isAr ? 'مسح UAE Trends' : 'Scan UAE Trends')}
            </button>
          </div>
        </div>

        {scanResult && (
          <div className="max-w-7xl mx-auto mt-3 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 flex-wrap">
            <span className="text-green-700 font-bold text-sm">
              ✅ {isAr ? `فحص ${scanResult.scanned} كلمة — ${scanResult.inserted} جديد` : `Scanned ${scanResult.scanned} — ${scanResult.inserted} new`}
            </span>
            {scanResult.top_opportunities.slice(0, 4).map(o => (
              <span key={o.keyword} className="flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                {o.trend_direction === 'rising' && <TrendingUp className="w-3 h-3" />}
                {o.keyword.replace(' UAE', '')} ({o.gap_score})
              </span>
            ))}
          </div>
        )}

        {error && (
          <div className="max-w-7xl mx-auto mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">

        {/* ── Product Search & Analysis ── */}
        <div className="bg-white border-2 border-indigo-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-5 py-4 border-b border-indigo-100">
            <h2 className="font-black text-indigo-900 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              {isAr ? 'تحليل منتج بالاسم — كل المصادر دفعة واحدة' : 'Analyze a product by name — all sources at once'}
            </h2>
            <p className="text-xs text-indigo-600 mt-0.5">
              {isAr ? 'اكتب اسم المنتج بالإنجليزي للحصول على تحليل كامل وقرار التجارة' : 'Type a product name in English for full analysis and import decision'}
            </p>
          </div>
          <div className="p-5">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && analyzeProduct()}
                  placeholder={isAr ? 'مثال: Stanley Cup, Prime Hydration, Celsius Energy...' : 'e.g. Stanley Cup, Prime Hydration, Celsius Energy...'}
                  className="w-full ps-9 pe-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
                />
              </div>
              <button onClick={analyzeProduct} disabled={analyzing || !searchQuery.trim()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors whitespace-nowrap">
                {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                {isAr ? 'تحليل' : 'Analyze'}
              </button>
            </div>

            {analyzeError && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-xl">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{analyzeError}
              </div>
            )}

            {analyzing && (
              <div className="mt-6 flex flex-col items-center py-8 text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
                <p className="font-semibold text-sm">{isAr ? 'جاري التحليل من 5 مصادر...' : 'Analyzing across 5 sources...'}</p>
                <p className="text-xs mt-1">{isAr ? 'Google Trends + Shopping + Search + Amazon.ae + Reddit' : 'Google Trends + Shopping + Search + Amazon.ae + Reddit'}</p>
              </div>
            )}

            {analysisResult && !analyzing && (
              <div className="mt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-black text-gray-900">
                    {isAr ? 'نتائج تحليل:' : 'Analysis for:'} <span className="text-indigo-600">{analysisResult.keyword}</span>
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">{new Date(analysisResult.analyzed_at).toLocaleTimeString()}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold">
                      {analysisResult.sources_used.length} {isAr ? 'مصادر' : 'sources'}
                    </span>
                  </div>
                </div>
                <AnalysisPanel result={analysisResult} isAr={isAr} />
              </div>
            )}
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { val: stats.total,   ar: 'إجمالي',        en: 'Total',      color: 'text-gray-900',   icon: '🗂️' },
            { val: stats.pending, ar: 'قيد المراجعة',  en: 'Pending',    color: 'text-orange-500', icon: '⏳' },
            { val: stats.highGap, ar: 'فجوة عالية',    en: 'High Gap',   color: 'text-red-600',    icon: '🎯' },
            { val: stats.rising,  ar: 'اتجاه صاعد',    en: 'Rising',     color: 'text-green-600',  icon: '📈' },
          ].map(s => (
            <div key={s.en} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
              <span className="text-2xl">{s.icon}</span>
              <div>
                <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                <div className="text-xs text-gray-400">{isAr ? s.ar : s.en}</div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${statusFilter === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
              {isAr ? 'الكل' : 'All'} ({discoveries.length})
            </button>
            {Object.entries(STATUS_CFG).map(([key, cfg]) => {
              const count = discoveries.filter(d => d.status === key).length
              if (count === 0) return null
              return (
                <button key={key} onClick={() => setStatusFilter(key)}
                  className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${statusFilter === key ? `${cfg.cls} border-current` : 'text-gray-500 border-gray-200 hover:border-gray-400'}`}>
                  {isAr ? cfg.ar : cfg.en} ({count})
                </button>
              )
            })}
          </div>
          {categories.length > 0 && (
            <div className="relative">
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg ps-3 pe-7 py-1 text-xs text-gray-600 focus:outline-none cursor-pointer">
                <option value="all">{isAr ? 'كل التصنيفات' : 'All Categories'}</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          )}
          <div className="ms-auto flex items-center gap-1.5">
            <span className="text-xs text-gray-400">{isAr ? 'ترتيب:' : 'Sort:'}</span>
            <div className="relative">
              <select value={sortBy} onChange={e => setSortBy(e.target.value)}
                className="appearance-none bg-gray-50 border border-gray-200 rounded-lg ps-3 pe-7 py-1 text-xs text-gray-600 focus:outline-none cursor-pointer">
                {[
                  { val: 'gap_score', ar: 'الفجوة', en: 'Gap Score' },
                  { val: 'trend_score', ar: 'الترند', en: 'Trend' },
                  { val: 'discovered_at', ar: 'الأحدث', en: 'Newest' },
                  { val: 'uae_interest_pct', ar: 'UAE', en: 'UAE Interest' },
                ].map(o => <option key={o.val} value={o.val}>{isAr ? o.ar : o.en}</option>)}
              </select>
              <ChevronDown className="absolute end-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ── Cards ── */}
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
            <Search className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm font-semibold">{isAr ? 'لا توجد اكتشافات' : 'No discoveries'}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(disc => (
              <DiscoveryCard key={disc.id} disc={disc} isAr={isAr} onStatus={updateStatus} updatingId={updatingId} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
