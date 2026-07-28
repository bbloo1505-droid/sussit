/** Sell-speed / Flip intelligence types. AI must not invent these numbers. */

import type { BuyActionVerdict, MaxBuyResult } from '@/types/hunt'

export type ListingAvailability = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN'

export type LifecycleOutcome =
  | 'ACTIVE'
  | 'DISAPPEARED'
  | 'CONFIRMED_SOLD'
  | 'WITHDRAWN'
  | 'EXPIRED'
  | 'UNKNOWN'

export type OutcomeConfidence = 'HIGH' | 'MEDIUM' | 'LOW'

export type SellSpeedLabel =
  | 'VERY_FAST'
  | 'FAST'
  | 'MODERATE'
  | 'SLOW'
  | 'UNKNOWN'

export type ListingObservation = {
  source: 'ebay' | 'fixture' | 'manual' | 'user'
  externalId: string
  productId: string
  title: string
  price: number
  currency: 'AUD'
  condition: string | null
  availability: ListingAvailability
  estimatedSoldQuantity: number | null
  estimatedAvailableQuantity: number | null
  itemCreatedAt: string | null
  itemEndAt: string | null
  observedAt: string
  url: string | null
}

export type ListingLifecycle = {
  source: string
  externalId: string
  productId: string
  firstSeenAt: string
  lastSeenAt: string
  firstPrice: number
  lastPrice: number
  minPrice: number
  maxPrice: number
  observationCount: number
  outcome: LifecycleOutcome
  outcomeConfidence: OutcomeConfidence
  outcomeAt: string | null
  durationHours: number | null
  confirmedSalePrice: number | null
}

export type PriceBandSpeed = {
  priceBandLow: number
  priceBandHigh: number
  sampleCount: number
  confirmedSaleCount: number
  disappearedCount: number
  /** Median days — only from CONFIRMED_SOLD when available; else observed disappearance with warning */
  medianDays: number | null
  p25Days: number | null
  p75Days: number | null
  speedLabel: SellSpeedLabel
  /** Honest about evidence quality */
  evidence: 'CONFIRMED_SALES' | 'OBSERVED_DISAPPEARANCE' | 'INSUFFICIENT'
}

export type SellSpeedEstimate = {
  label: SellSpeedLabel
  estimatedDaysLow: number | null
  estimatedDaysHigh: number | null
  evidence: PriceBandSpeed['evidence']
  sampleCount: number
  bands: PriceBandSpeed[]
  /** Suggested pricing scenarios */
  scenarios: Array<{
    listPrice: number
    daysLow: number | null
    daysHigh: number | null
    speedLabel: SellSpeedLabel
  }>
  disclaimer: string
}

export type LiquidityEstimate = {
  score: number | null
  demandLabel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
  supplyLabel: 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN'
  activeListingCount: number
  observedMovements30d: number
  reasons: string[]
}

export type CapitalVelocity = {
  /** Expected profit / expected days — higher is better recycling of capital */
  profitPerDay: number | null
  label: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNKNOWN'
  buyPrice: number
  expectedResaleMid: number
  expectedProfit: number
  expectedDaysMid: number | null
}

export type FlipResult = {
  flipScore: number | null
  verdict: 'STRONG_FLIP' | 'SOLID_FLIP' | 'MARGINAL' | 'PASS' | 'INSUFFICIENT_DATA'
  /** Signature Flip number from user rules */
  maxBuy: MaxBuyResult | null
  actionVerdict: BuyActionVerdict
  actionSummary: string
  buyPrice: number
  resaleLow: number
  resaleHigh: number
  grossProfitLow: number
  grossProfitHigh: number
  roiPercent: number
  sellSpeed: SellSpeedEstimate
  liquidity: LiquidityEstimate
  capitalVelocity: CapitalVelocity
  pricingSweetSpot: { low: number; high: number } | null
  summary: string
}
