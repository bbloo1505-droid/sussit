import { loadLifecycles } from '@/lib/sellSpeed/lifecycleStore'
import type { LiquidityEstimate } from '@/types/sellSpeed'

export function calculateLiquidity(input: {
  productId: string
  windowDays?: number
}): LiquidityEstimate {
  const windowDays = input.windowDays ?? 30
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000
  const all = loadLifecycles().filter((l) => l.productId === input.productId)

  const active = all.filter((l) => l.outcome === 'ACTIVE')
  const movements = all.filter((l) => {
    if (l.outcome !== 'CONFIRMED_SOLD' && l.outcome !== 'DISAPPEARED') return false
    const t = l.outcomeAt ? new Date(l.outcomeAt).getTime() : 0
    return t >= cutoff
  })

  const activeListingCount = active.length
  const observedMovements30d = movements.length
  const reasons: string[] = []

  if (all.length < 5) {
    return {
      score: null,
      demandLabel: 'UNKNOWN',
      supplyLabel: 'UNKNOWN',
      activeListingCount,
      observedMovements30d,
      reasons: ['Not enough lifecycle data for liquidity'],
    }
  }

  // Demand from movement rate; supply from active count
  const demandScore = Math.min(100, observedMovements30d * 8)
  const supplyPenalty = Math.min(40, activeListingCount * 4)
  const score = Math.max(0, Math.round(demandScore - supplyPenalty + 40))

  const demandLabel =
    observedMovements30d >= 8
      ? 'HIGH'
      : observedMovements30d >= 4
        ? 'MEDIUM'
        : 'LOW'

  const supplyLabel =
    activeListingCount >= 8
      ? 'HIGH'
      : activeListingCount >= 3
        ? 'MEDIUM'
        : 'LOW'

  reasons.push(
    `${observedMovements30d} observed movements in ${windowDays}d`,
    `${activeListingCount} currently active comps`,
  )

  return {
    score,
    demandLabel,
    supplyLabel,
    activeListingCount,
    observedMovements30d,
    reasons,
  }
}
