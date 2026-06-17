// Shared types for the product analysis API

export interface GoogleTrendsResult {
  interest_score:  number
  peak_score:      number
  direction:       'rising' | 'stable' | 'falling'
  change_pct:      number
  weekly_values:   number[]
  related_queries: string[]
}

export interface GoogleShoppingResult {
  listing_count:   number
  price_min_aed:   number | null
  price_max_aed:   number | null
  price_avg_aed:   number | null
  sellers:         string[]
  top_product:     string | null
  amazon_listings: number
  noon_listings:   number
}

export interface GoogleSearchResult {
  total_results:     number
  retailer_mentions: string[]
  price_mentions:    number[]
  avg_price_aed:     number | null
  amazon_available:  boolean
  noon_available:    boolean
  top_snippet:       string | null
}

export interface RedditResult {
  mention_count:  number
  total_upvotes:  number
  sentiment:      'positive' | 'neutral' | 'negative'
  top_posts:      { title: string; score: number; subreddit: string; url: string }[]
}

export interface AnalysisSources {
  google_trends:   GoogleTrendsResult   | null
  google_shopping: GoogleShoppingResult | null
  google_search:   GoogleSearchResult   | null
  reddit:          RedditResult         | null
}

export interface DecisionFactor {
  factor_ar: string
  factor_en: string
  impact:    'positive' | 'neutral' | 'negative'
  data:      string
}

export interface TradeAnalysis {
  opportunity_score:          number
  market_gap:                 boolean
  estimated_retail_price_aed: number | null
  estimated_import_price_aed: number | null
  estimated_margin_pct:       number | null
  estimated_monthly_units:    string | null
  estimated_capex_aed:        string | null
  demand_level:               'high' | 'medium' | 'low'
  competition_level:          'high' | 'medium' | 'low'
  decision:                   'strong_import' | 'investigate' | 'monitor' | 'skip'
  decision_factors:           DecisionFactor[]
  recommendation_ar:          string
  recommendation_en:          string
}

export interface AnalyzeResponse {
  keyword:      string
  analyzed_at:  string
  sources_used: string[]
  sources:      AnalysisSources
  analysis:     TradeAnalysis
}
