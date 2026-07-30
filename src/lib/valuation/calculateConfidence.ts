import type {
  ComparableAssessment,
  ConfidenceResult,
  IdentifiedProduct,
  MarketEstimate,
} from '@/types/domain'

/**
 * Comps-first confidence.
 * Identification confidence softens the score but does not hard-kill a solid
 * comparable set — important for heuristic / generic extracts (~0.35–0.55).
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

  if (acceptedCount < 4) {
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

  if (identificationConfidence < 0.45) {
    reasons.push('Product identification is uncertain')
  }
  if (averageMatchQuality < 78) {
    reasons.push('Average comparable match quality is moderate')
  }
  if (priceDispersion > 0.28) {
    reasons.push('Comparable prices are widely spread')
  }
  if (!input.product.variant && identificationConfidence < 0.7) {
    reasons.push('Variant not confirmed')
  }

  const strong =
    identificationConfidence >= 0.85 &&
    acceptedCount >= 8 &&
    averageMatchQuality >= 85 &&
    priceDispersion <= 0.18

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

  // Solid comps win even when ID is heuristic / brand+model only
  if (acceptedCount >= 4 && averageMatchQuality >= 70) {
    if (reasons.length === 0) {
      reasons.push(`${acceptedCount} comparisons available`)
    }

    const level =
      acceptedCount >= 8 &&
      averageMatchQuality >= 82 &&
      priceDispersion <= 0.22 &&
      identificationConfidence >= 0.55
        ? 'MEDIUM'
        : acceptedCount >= 6 && averageMatchQuality >= 78
          ? 'MEDIUM'
          : 'LOW'

    return {
      level,
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
