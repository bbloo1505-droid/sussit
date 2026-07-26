import type {
  ConfidenceResult,
  DealResult,
  IdentifiedProduct,
  MarketEstimate,
} from '@/types/domain'

/** Score is informational for private V0 — confidence gate can null it out. */
export function calculateDeal(input: {
  product: IdentifiedProduct
  market: MarketEstimate | null
  confidence: ConfidenceResult
}): DealResult {
  if (!input.market || input.confidence.level === 'INSUFFICIENT') {
    return {
      differenceFromMedianPercent: 0,
      dealScore: null,
      verdictLabel: 'INSUFFICIENT DATA',
    }
  }

  const { median } = input.market
  const asking = input.product.askingPrice
  const diff = ((asking - median) / median) * 100
  const differenceFromMedianPercent = Number(diff.toFixed(1))

  let dealScore: number
  let verdictLabel: DealResult['verdictLabel']

  if (diff <= -20) {
    dealScore = 10
    verdictLabel = 'EXCEPTIONAL BUY'
  } else if (diff <= -10) {
    dealScore = 9
    verdictLabel = 'GOOD BUY'
  } else if (diff <= -3) {
    dealScore = 8.1
    verdictLabel = 'GOOD BUY'
  } else if (diff <= 5) {
    dealScore = 6.5
    verdictLabel = 'FAIR'
  } else if (diff <= 15) {
    dealScore = 4
    verdictLabel = 'OVERPRICED'
  } else {
    dealScore = 2
    verdictLabel = 'OVERPRICED'
  }

  return {
    differenceFromMedianPercent,
    dealScore,
    verdictLabel,
  }
}
