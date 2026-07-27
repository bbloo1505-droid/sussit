/** Core SussIt domain types. Unknown extracted fields stay null. */

export type Currency = 'AUD'

/**
 * Universal intake categories.
 * Strong Buy/Offer intelligence is concentrated on a subset — see supportTiers.
 */
export type ProductCategory =
  | 'phone'
  | 'console'
  | 'vr_headset'
  | 'camera'
  | 'laptop'
  | 'tablet'
  | 'wearable'
  | 'audio'
  | 'gpu'
  | 'power_tool'
  | 'furniture'
  | 'clothing'
  | 'vehicle'
  | 'jewellery'
  | 'collectible'
  | 'other'
  | 'unknown'

export type ProductCondition =
  | 'new'
  | 'used_like_new'
  | 'used_good'
  | 'used_fair'
  | 'for_parts'
  | 'unknown'

export type ListingInput =
  | { kind: 'screenshot'; file: File; dataUrl: string }
  | { kind: 'text'; text: string }

export type IdentifiedProduct = {
  category: ProductCategory
  brand: string
  model: string
  variant: string | null
  askingPrice: number
  currency: Currency
  condition: ProductCondition | null
  location: string | null
  includedAccessories: string[]
  missingInformation: string[]
  sellerClaims: string[]
  visibleIssues: string[]
  identificationConfidence: number
}

export type ProductVariant = {
  id: string
  brand: string
  model: string
  variant: string | null
  category: ProductCategory
  aliases: string[]
}

export type ComparableListing = {
  id: string
  source: 'ebay' | 'fixture' | 'manual'
  externalId: string | null
  title: string
  price: number
  currency: Currency
  condition: ProductCondition | null
  shipping: number | null
  location: string | null
  url: string | null
  includedAccessories: string[]
  estimatedSoldQuantity?: number | null
  estimatedAvailableQuantity?: number | null
  itemCreatedAt?: string | null
  itemEndAt?: string | null
}

export type ComparableAssessment = {
  comparable: ComparableListing
  included: boolean
  matchScore: number
  rejectionReason: string | null
  matchLabel: string
  reasons: string[]
}

export type MarketEstimate = {
  median: number
  p25: number
  p75: number
  sampleCount: number
  priceDispersion: number
  /** Display: current asking range — not sold prices */
  askingLow: number
  askingHigh: number
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT'

export type ConfidenceResult = {
  level: ConfidenceLevel
  reasons: string[]
  identificationConfidence: number
  acceptedCount: number
  averageMatchQuality: number
  priceDispersion: number
}

export type OfferRecommendation = {
  openingOffer: number
  targetPurchasePrice: number
}

export type DealResult = {
  /** Percent vs asking median: negative = cheaper than market */
  differenceFromMedianPercent: number
  /** Only present when confidence is not INSUFFICIENT — private V0 may still omit branded score */
  dealScore: number | null
  verdictLabel:
    | 'EXCEPTIONAL BUY'
    | 'GOOD BUY'
    | 'FAIR'
    | 'OVERPRICED'
    | 'INSUFFICIENT DATA'
    | 'LIMITED MARKET DATA'
}

export type IntelligenceTier = 'full' | 'emerging' | 'basic'

export type AnalysisResult = {
  id: string
  createdAt: string
  product: IdentifiedProduct
  productLabel: string
  /** Normalized SKU id for observation grouping / curated polling */
  productId: string
  intelligenceTier: IntelligenceTier
  market: MarketEstimate | null
  confidence: ConfidenceResult
  deal: DealResult
  offer: OfferRecommendation | null
  assessments: ComparableAssessment[]
  /** Optional Flip payload when sell-speed module is wired */
  flip?: {
    actionVerdict?: string
    actionSummary?: string
    maxBuy?: { maxBuy: number } | null
    resaleLow?: number
    resaleHigh?: number
    pricingSweetSpot?: { low: number; high: number } | null
    [key: string]: unknown
  } | null
}
