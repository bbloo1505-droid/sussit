import type {
  ComparableAssessment,
  ConfidenceResult,
  IdentifiedProduct,
  MarketEstimate,
} from '@/types/domain'

/**
 * Conservative confidence. Thresholds will be tuned from the benchmark set.
 * Thin comps → INSUFFICIENT (no deal score).
 */
export function calculateConfidence(input: {
  product: IdentifiedProduct
  assessments: ComparableAssessment[]
  market: MarketEstimate | null
}): ConfidenceResult {
  const accepted = input.assessments.filter((a) => a.included)
  const acceptedCount = accepted.length
  const averageMatchQuality =
    acceptedCount === 0
      ? 0
      : accepted.reduce((sum, a) => sum + a.matchScore, 0) / acceptedCount

  const priceDispersion = input.market?.priceDispersion ?? 1
  const identificationConfidence = input.product.identificationConfidence
  const reasons: string[] = []

  if (acceptedCount < 5) {
    reasons.push(`Only ${acceptedCount} reliable comparisons found`)
    return {
      level: 'INSUFFICIENT',
      reasons,
      identificationConfidence,
      acceptedCount,
      averageMatchQuality,
      priceDispersion,
    }
  }

  if (identificationConfidence < 0.7) {
    reasons.push('Product identification is uncertain')
  }
  if (averageMatchQuality < 85) {
    reasons.push('Average comparable match quality is moderate')
  }
  if (priceDispersion > 0.2) {
    reasons.push('Comparable prices are widely spread')
  }
  if (!input.product.variant) {
    reasons.push('Variant not confirmed')
  }

  const strong =
    identificationConfidence >= 0.9 &&
    acceptedCount >= 8 &&
    averageMatchQuality >= 88 &&
    priceDispersion <= 0.15 &&
    Boolean(input.product.variant)

  if (strong && reasons.length === 0) {
    reasons.push(`${acceptedCount} strong comparisons with a tight asking range`)
    return {
      level: 'HIGH',
      reasons,
      identificationConfidence,
      acceptedCount,
      averageMatchQuality,
      priceDispersion,
    }
  }

  if (acceptedCount >= 5 && identificationConfidence >= 0.75) {
    if (reasons.length === 0) {
      reasons.push(`${acceptedCount} comparisons available`)
    }
    return {
      level: acceptedCount >= 8 ? 'MEDIUM' : 'LOW',
      reasons,
      identificationConfidence,
      acceptedCount,
      averageMatchQuality,
      priceDispersion,
    }
  }

  reasons.push('Not enough high-quality evidence')
  return {
    level: 'INSUFFICIENT',
    reasons,
    identificationConfidence,
    acceptedCount,
    averageMatchQuality,
    priceDispersion,
  }
}
