import type {
  ConfidenceResult,
  IdentifiedProduct,
  MarketEstimate,
  OfferRecommendation,
} from '@/types/domain'

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

/**
 * Deterministic opening + target. No walk-away until transaction calibration.
 * Returns null when confidence is insufficient.
 */
export function calculateOffer(input: {
  product: IdentifiedProduct
  market: MarketEstimate
  confidence: ConfidenceResult
}): OfferRecommendation | null {
  if (input.confidence.level === 'INSUFFICIENT') return null

  const asking = input.product.askingPrice
  const { median, p25 } = input.market

  // Target: slightly under median, never above asking
  const targetPurchasePrice = roundTo5(Math.min(asking, median * 0.97))

  // Opening: below target / toward P25
  const openingRaw = Math.min(targetPurchasePrice * 0.93, p25 * 0.95, asking * 0.9)
  const openingOffer = roundTo5(Math.max(openingRaw, median * 0.82))

  return {
    openingOffer: Math.min(openingOffer, targetPurchasePrice),
    targetPurchasePrice,
  }
}
