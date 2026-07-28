import { loadLifecycles } from '@/lib/sellSpeed/lifecycleStore'
import type {
  PriceBandSpeed,
  SellSpeedEstimate,
  SellSpeedLabel,
} from '@/types/sellSpeed'

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

function labelFromMedianDays(days: number | null): SellSpeedLabel {
  if (days == null) return 'UNKNOWN'
  if (days <= 4) return 'VERY_FAST'
  if (days <= 9) return 'FAST'
  if (days <= 20) return 'MODERATE'
  return 'SLOW'
}

function bandWidth(prices: number[]): number {
  if (prices.length === 0) return 50
  const spread = Math.max(...prices) - Math.min(...prices)
  if (spread <= 80) return 40
  if (spread <= 160) return 50
  return 75
}

export function calculateSellSpeed(input: {
  productId: string
  targetResalePrice: number
}): SellSpeedEstimate {
  const lifecycles = loadLifecycles().filter(
    (l) => l.productId === input.productId,
  )

  const closed = lifecycles.filter(
    (l) =>
      (l.outcome === 'CONFIRMED_SOLD' || l.outcome === 'DISAPPEARED') &&
      l.durationHours != null,
  )

  const prices = closed.map((l) => l.lastPrice)
  const width = bandWidth(prices)
  const minP = prices.length ? Math.min(...prices) : input.targetResalePrice - 100
  const maxP = prices.length ? Math.max(...prices) : input.targetResalePrice + 100
  const start = Math.floor(minP / width) * width

  const bands: PriceBandSpeed[] = []
  for (let low = start; low <= maxP; low += width) {
    const high = low + width
    const inBand = closed.filter((l) => l.lastPrice >= low && l.lastPrice < high)
    if (inBand.length === 0) continue

    const confirmed = inBand.filter((l) => l.outcome === 'CONFIRMED_SOLD')
    const disappeared = inBand.filter((l) => l.outcome === 'DISAPPEARED')
    const useConfirmed = confirmed.length >= 3
    const sample = useConfirmed ? confirmed : inBand
    const days = sample
      .map((l) => (l.durationHours ?? 0) / 24)
      .sort((a, b) => a - b)

    const medianDays = Number(percentile(days, 0.5).toFixed(1))
    const p25Days = Number(percentile(days, 0.25).toFixed(1))
    const p75Days = Number(percentile(days, 0.75).toFixed(1))

    bands.push({
      priceBandLow: low,
      priceBandHigh: high,
      sampleCount: sample.length,
      confirmedSaleCount: confirmed.length,
      disappearedCount: disappeared.length,
      medianDays,
      p25Days,
      p75Days,
      speedLabel: labelFromMedianDays(medianDays),
      evidence: useConfirmed
        ? 'CONFIRMED_SALES'
        : sample.length >= 3
          ? 'OBSERVED_DISAPPEARANCE'
          : 'INSUFFICIENT',
    })
  }

  const targetBand =
    bands.find(
      (b) =>
        input.targetResalePrice >= b.priceBandLow &&
        input.targetResalePrice < b.priceBandHigh,
    ) ??
    [...bands].sort(
      (a, b) =>
        Math.abs((a.priceBandLow + a.priceBandHigh) / 2 - input.targetResalePrice) -
        Math.abs((b.priceBandLow + b.priceBandHigh) / 2 - input.targetResalePrice),
    )[0]

  const scenarios = [0.96, 1.0, 1.06].map((mult) => {
    const listPrice = Math.round(input.targetResalePrice * mult)
    const band =
      bands.find((b) => listPrice >= b.priceBandLow && listPrice < b.priceBandHigh) ??
      targetBand
    return {
      listPrice,
      daysLow: band?.p25Days ?? null,
      daysHigh: band?.p75Days ?? null,
      speedLabel: band?.speedLabel ?? ('UNKNOWN' as const),
    }
  })

  if (!targetBand || targetBand.sampleCount < 3) {
    return {
      label: 'UNKNOWN',
      estimatedDaysLow: null,
      estimatedDaysHigh: null,
      evidence: 'INSUFFICIENT',
      sampleCount: closed.length,
      bands,
      scenarios,
      disclaimer:
        'Not enough lifecycle observations yet. Disappeared listings are not confirmed sales.',
    }
  }

  return {
    label: targetBand.speedLabel,
    estimatedDaysLow: targetBand.p25Days,
    estimatedDaysHigh: targetBand.p75Days,
    evidence: targetBand.evidence,
    sampleCount: targetBand.sampleCount,
    bands,
    scenarios,
    disclaimer:
      targetBand.evidence === 'CONFIRMED_SALES'
        ? 'Based on confirmed sold quantity signals and/or user-reported sales.'
        : 'Based on observed listing disappearances — not all removals are confirmed sales.',
  }
}
