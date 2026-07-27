import { describe, expect, it } from 'vitest'
import {
  recommendationCorrectRate,
  type AnalysisOutcome,
} from '@/lib/analysis/outcomeStore'

describe('recommendationCorrectRate', () => {
  it('returns null with no judgments', () => {
    expect(recommendationCorrectRate([])).toBeNull()
  })

  it('computes share marked correct', () => {
    const rows: AnalysisOutcome[] = [
      base({ verdictCorrect: true }),
      base({ analysisId: 'b', verdictCorrect: true }),
      base({ analysisId: 'c', verdictCorrect: false }),
      base({ analysisId: 'd', verdictCorrect: null }),
    ]
    expect(recommendationCorrectRate(rows)).toBeCloseTo(2 / 3)
  })
})

function base(
  patch: Partial<AnalysisOutcome>,
): AnalysisOutcome {
  return {
    analysisId: 'a',
    decision: 'buy',
    changedDecision: true,
    contactedSeller: null,
    purchased: null,
    actualPurchasePrice: null,
    resold: null,
    actualResalePrice: null,
    resoldAt: null,
    verdictCorrect: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:00.000Z',
    ...patch,
  }
}
