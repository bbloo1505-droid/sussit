/** Core SussIt domain types. Unknown extracted fields stay null. */

export type Currency = 'AUD'

export type ProductCategory =
  | 'phone'
  | 'console'
  | 'vr_headset'
  | 'camera'
  | 'laptop'
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
}

export type AnalysisResult = {
  id: string
  createdAt: string
  product: IdentifiedProduct
  productLabel: string
  market: MarketEstimate | null
  confidence: ConfidenceResult
  deal: DealResult
  offer: OfferRecommendation | null
  assessments: ComparableAssessment[]
}
