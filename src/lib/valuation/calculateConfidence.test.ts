import { describe, expect, it } from 'vitest'
import { calculateConfidence } from '@/lib/valuation/calculateConfidence'
import type {
  ComparableAssessment,
  IdentifiedProduct,
  MarketEstimate,
} from '@/types/domain'

function product(partial: Partial<IdentifiedProduct> = {}): IdentifiedProduct {
  return {
    category: 'furniture',
    brand: 'IKEA',
    model: 'Kivik',
    variant: null,
    askingPrice: 400,
    currency: 'AUD',
    condition: 'used_good',
    location: 'Melbourne',
    includedAccessories: [],
    missingInformation: [],
    sellerClaims: [],
    visibleIssues: [],
    identificationConfidence: 0.55,
    ...partial,
  }
}

function assessments(n: number, score = 82): ComparableAssessment[] {
  return Array.from({ length: n }, (_, i) => ({
    comparable: {
      id: `c${i}`,
      source: 'fixture' as const,
      externalId: `c${i}`,
      title: 'IKEA Kivik sofa',
      price: 350 + i * 10,
      currency: 'AUD' as const,
      condition: 'used_good' as const,
      shipping: 0,
      location: null,
      url: null,
      includedAccessories: [],
    },
    included: true,
    matchScore: score,
    rejectionReason: null,
    matchLabel: 'Strong match' as const,
    reasons: ['Exact model'],
  }))
}

const market: MarketEstimate = {
  askingLow: 350,
  askingHigh: 450,
  median: 400,
  p25: 370,
  p75: 430,
  sampleCount: 8,
  priceDispersion: 0.12,
}

describe('calculateConfidence', () => {
  it('gives MEDIUM/LOW from comps even with heuristic ID confidence', () => {
    const result = calculateConfidence({
      product: product({ identificationConfidence: 0.55 }),
      assessments: assessments(8),
      market,
    })
    expect(result.level).not.toBe('INSUFFICIENT')
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.level)
  })

  it('stays INSUFFICIENT when comps are thin', () => {
    const result = calculateConfidence({
      product: product(),
      assessments: assessments(2),
      market: { ...market, sampleCount: 2 },
    })
    expect(result.level).toBe('INSUFFICIENT')
  })
})
