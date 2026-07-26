import type { ComparableAssessment, MarketEstimate } from '@/types/domain'

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  if (sorted.length === 1) return sorted[0]
  const idx = (sorted.length - 1) * p
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  const w = idx - lo
  return sorted[lo] * (1 - w) + sorted[hi] * w
}

function roundMoney(n: number): number {
  return Math.round(n)
}

/** Median / P25 / P75 from accepted comps only. Never ask an LLM for this. */
export function calculateMarketRange(
  assessments: ComparableAssessment[],
): MarketEstimate | null {
  const prices = assessments
    .filter((a) => a.included)
    .map((a) => a.comparable.price)
    .sort((a, b) => a - b)

  if (prices.length === 0) return null

  const median = percentile(prices, 0.5)
  const p25 = percentile(prices, 0.25)
  const p75 = percentile(prices, 0.75)
  const dispersion =
    median === 0 ? 1 : (p75 - p25) / median

  return {
    median: roundMoney(median),
    p25: roundMoney(p25),
    p75: roundMoney(p75),
    sampleCount: prices.length,
    priceDispersion: Number(dispersion.toFixed(3)),
    askingLow: roundMoney(p25),
    askingHigh: roundMoney(p75),
  }
}
