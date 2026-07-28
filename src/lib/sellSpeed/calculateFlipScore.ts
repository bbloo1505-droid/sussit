import { calculateSellSpeed } from '@/lib/sellSpeed/calculateSellSpeed'
import { calculateLiquidity } from '@/lib/sellSpeed/calculateLiquidity'
import { calculateCapitalVelocity } from '@/lib/sellSpeed/calculateCapitalVelocity'
import {
  actionRecommendationCopy,
  calculateMaxBuy,
} from '@/lib/valuation/calculateMaxBuy'
import { DEFAULT_HUNT_RULES, type HuntRules } from '@/types/hunt'
import type { FlipResult } from '@/types/sellSpeed'
import type { ConfidenceResult, MarketEstimate } from '@/types/domain'

function speedPoints(label: FlipResult['sellSpeed']['label']): number {
  switch (label) {
    case 'VERY_FAST':
      return 30
    case 'FAST':
      return 24
    case 'MODERATE':
      return 14
    case 'SLOW':
      return 4
    default:
      return 0
  }
}

export function calculateFlipScore(input: {
  productId: string
  buyPrice: number
  market: MarketEstimate
  confidence: ConfidenceResult
  rules?: HuntRules
  askingPrice?: number | null
}): FlipResult {
  const rules = input.rules ?? DEFAULT_HUNT_RULES
  const resaleLow = input.market.median
  const resaleHigh = Math.max(input.market.p75, input.market.median)
  const targetResale = Math.round((resaleLow + resaleHigh) / 2)

  const sellSpeed = calculateSellSpeed({
    productId: input.productId,
    targetResalePrice: targetResale,
  })
  const liquidity = calculateLiquidity({ productId: input.productId })
  const capitalVelocity = calculateCapitalVelocity({
    buyPrice: input.buyPrice,
    resaleLow,
    resaleHigh,
    sellSpeed,
  })

  const maxBuy = calculateMaxBuy({
    expectedResale: targetResale,
    rules,
    askingPrice: input.askingPrice,
  })

  const grossProfitLow = Math.round(resaleLow - input.buyPrice)
  const grossProfitHigh = Math.round(resaleHigh - input.buyPrice)
  const roiPercent = Number(
    (((targetResale - input.buyPrice) / input.buyPrice) * 100).toFixed(1),
  )

  const actionVerdict =
    input.confidence.level === 'INSUFFICIENT' || maxBuy.maxBuy <= 0
      ? ('INSUFFICIENT_DATA' as const)
      : (maxBuy.actionVerdict ?? 'INSUFFICIENT_DATA')

  const actionSummary =
    actionVerdict === 'INSUFFICIENT_DATA'
      ? 'Not enough market evidence to set Max Buy yet.'
      : actionRecommendationCopy(
          actionVerdict,
          input.askingPrice ?? maxBuy.maxBuy,
          maxBuy.maxBuy,
        )

  if (
    input.confidence.level === 'INSUFFICIENT' ||
    sellSpeed.evidence === 'INSUFFICIENT' ||
    liquidity.score == null
  ) {
    return {
      flipScore: null,
      verdict: 'INSUFFICIENT_DATA',
      maxBuy,
      actionVerdict,
      actionSummary,
      buyPrice: input.buyPrice,
      resaleLow,
      resaleHigh,
      grossProfitLow,
      grossProfitHigh,
      roiPercent,
      sellSpeed,
      liquidity,
      capitalVelocity,
      pricingSweetSpot: null,
      summary:
        'Not enough sell-speed evidence yet. Keep collecting lifecycle data before ranking flips.',
    }
  }

  const marginPoints = Math.max(0, Math.min(30, roiPercent))
  const liqPoints = Math.round((liquidity.score / 100) * 25)
  const confPoints =
    input.confidence.level === 'HIGH'
      ? 15
      : input.confidence.level === 'MEDIUM'
        ? 10
        : 5
  const flipScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        marginPoints + speedPoints(sellSpeed.label) + liqPoints + confPoints,
      ),
    ),
  )

  const fastest = [...sellSpeed.bands]
    .filter((b) => b.sampleCount >= 3)
    .sort((a, b) => (a.medianDays ?? 99) - (b.medianDays ?? 99))[0]

  const pricingSweetSpot = fastest
    ? { low: fastest.priceBandLow, high: fastest.priceBandHigh }
    : null

  const verdict: FlipResult['verdict'] =
    flipScore >= 85
      ? 'STRONG_FLIP'
      : flipScore >= 70
        ? 'SOLID_FLIP'
        : flipScore >= 50
          ? 'MARGINAL'
          : 'PASS'

  const summary =
    verdict === 'STRONG_FLIP'
      ? 'Strong flip. Solid margin with fast capital turnover.'
      : verdict === 'SOLID_FLIP'
        ? 'Solid flip if you can buy near Max Buy.'
        : verdict === 'MARGINAL'
          ? 'Marginal — margin or speed may not justify the capital lock-up.'
          : 'Pass — weak margin and/or slow expected sell-through.'

  return {
    flipScore,
    verdict,
    maxBuy,
    actionVerdict,
    actionSummary,
    buyPrice: input.buyPrice,
    resaleLow,
    resaleHigh,
    grossProfitLow,
    grossProfitHigh,
    roiPercent,
    sellSpeed,
    liquidity,
    capitalVelocity,
    pricingSweetSpot,
    summary,
  }
}
