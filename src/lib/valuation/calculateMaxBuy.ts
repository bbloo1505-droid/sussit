import {
  FEE_BUFFER_PERCENT,
  type BuyActionVerdict,
  type HuntRules,
  type MaxBuyResult,
} from '@/types/hunt'

function roundTo5(n: number): number {
  return Math.round(n / 5) * 5
}

/**
 * Signature Flip metric: highest purchase price that still hits the user's
 * minimum profit AND minimum ROI after a fee buffer.
 */
export function calculateMaxBuy(input: {
  expectedResale: number
  rules: Pick<HuntRules, 'minProfit' | 'minRoiPercent'>
  feeBufferPercent?: number
  askingPrice?: number | null
}): MaxBuyResult {
  const feeBufferPercent = input.feeBufferPercent ?? FEE_BUFFER_PERCENT
  const netAfterFees = input.expectedResale * (1 - feeBufferPercent)

  const maxFromProfit = netAfterFees - input.rules.minProfit
  const maxFromRoi =
    netAfterFees / (1 + input.rules.minRoiPercent / 100)

  const constrainedBy: MaxBuyResult['constrainedBy'] =
    maxFromProfit <= maxFromRoi ? 'PROFIT' : 'ROI'

  const raw = Math.min(maxFromProfit, maxFromRoi)
  const maxBuy = Math.max(0, roundTo5(raw))
  const negotiateCeiling = roundTo5(maxBuy * 1.15)

  let actionVerdict: BuyActionVerdict | null = null
  if (input.askingPrice != null && Number.isFinite(input.askingPrice)) {
    if (input.askingPrice <= maxBuy) actionVerdict = 'BUY'
    else if (input.askingPrice <= negotiateCeiling) actionVerdict = 'NEGOTIATE'
    else actionVerdict = 'PASS'
  }

  return {
    maxBuy,
    expectedResale: Math.round(input.expectedResale),
    netAfterFees: Math.round(netAfterFees),
    feeBufferPercent,
    minProfit: input.rules.minProfit,
    minRoiPercent: input.rules.minRoiPercent,
    constrainedBy,
    negotiateCeiling,
    actionVerdict,
  }
}

export function actionRecommendationCopy(
  verdict: BuyActionVerdict,
  asking: number,
  maxBuy: number,
): string {
  switch (verdict) {
    case 'BUY':
      return asking <= maxBuy * 0.95
        ? 'Buy at asking price. Margin already works — don’t negotiate aggressively.'
        : 'Buy near asking. You’re at or under Max Buy.'
    case 'NEGOTIATE':
      return `Negotiate down to ${maxBuy} or below before committing capital.`
    case 'PASS':
      return `Pass at this price. Max Buy is ${maxBuy}.`
    default:
      return 'Not enough market evidence to set Max Buy yet.'
  }
}
