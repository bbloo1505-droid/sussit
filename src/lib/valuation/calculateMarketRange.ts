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

/**
 * Drop extreme prices that would warp p25/p75 while keeping median stable.
 * Uses soft fences around the provisional median when n >= 5.
 */
function trimOutliers(prices: number[]): number[] {
  if (prices.length < 5) return prices
  const sorted = [...prices].sort((a, b) => a - b)
  const med = percentile(sorted, 0.5)
  if (med <= 0) return prices
  const lo = med * 0.45
  const hi = med * 2.4
  const trimmed = sorted.filter((p) => p >= lo && p <= hi)
  // Never collapse the set too aggressively
  return trimmed.length >= 3 ? trimmed : sorted
}

/** Median / P25 / P75 from accepted comps only. Never ask an LLM for this. */
export function calculateMarketRange(
  assessments: ComparableAssessment[],
): MarketEstimate | null {
  const raw = assessments
    .filter((a) => a.included)
    .map((a) => a.comparable.price)
    .sort((a, b) => a - b)

  if (raw.length === 0) return null

  const prices = trimOutliers(raw)
  const median = percentile(prices, 0.5)
  const p25 = percentile(prices, 0.25)
  const p75 = percentile(prices, 0.75)
  const dispersion = median === 0 ? 1 : (p75 - p25) / median

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
