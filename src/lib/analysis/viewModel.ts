import type { AnalysisResult } from '@/types/domain'
import { formatAud } from '@/lib/utils'
import { limitedMarketCopy } from '@/lib/intelligence/supportTier'

export function buildOfferMessage(analysis: AnalysisResult): string {
  const offer = analysis.offer?.openingOffer
  if (offer == null) {
    return 'Not enough data for a suggested offer yet.'
  }
  return `Hey mate, definitely interested. Would you take ${formatAud(offer)} if I can pick it up today?`
}

export function buildExplanation(analysis: AnalysisResult): string {
  if (analysis.deal.verdictLabel === 'LIMITED MARKET DATA') {
    return limitedMarketCopy(analysis.product.category)
  }

  if (analysis.deal.verdictLabel === 'INSUFFICIENT DATA' || !analysis.market) {
    return (
      analysis.confidence.reasons[0] ??
      "We don't have enough evidence to recommend buying or passing."
    )
  }

  const pct = Math.abs(analysis.deal.differenceFromMedianPercent)
  const side =
    analysis.deal.differenceFromMedianPercent <= 0 ? 'below' : 'above'

  return `At ${formatAud(analysis.product.askingPrice)}, this sits about ${pct}% ${side} the current comparable asking median of ${formatAud(analysis.market.median)}.`
}

/** Deterministic relist copy when Flip numbers exist — no LLM. */
export function buildRelistCopy(analysis: AnalysisResult): {
  title: string
  price: number
  body: string
  quickSalePrice: number | null
  maxProfitPrice: number | null
} {
  const flip = analysis.flip
  const sweet = flip?.pricingSweetSpot
  const listPrice =
    sweet != null
      ? Math.round((sweet.low + sweet.high) / 2 / 5) * 5
      : flip?.resaleLow != null && flip?.resaleHigh != null
        ? Math.round((flip.resaleLow + flip.resaleHigh) / 2 / 5) * 5
        : analysis.market?.median ?? analysis.product.askingPrice

  const title = [
    analysis.product.brand,
    analysis.product.model,
    analysis.product.variant,
  ]
    .filter(Boolean)
    .join(' ')

  const body = [
    `${title} for sale.`,
    ``,
    `Pick up preferred. Happy to meet locally.`,
    `Price is firm at ${formatAud(listPrice)} — priced to move.`,
  ].join('\n')

  return {
    title,
    price: listPrice,
    body,
    quickSalePrice:
      flip?.resaleLow != null ? Math.round(flip.resaleLow / 5) * 5 : null,
    maxProfitPrice:
      flip?.resaleHigh != null ? Math.round(flip.resaleHigh / 5) * 5 : null,
  }
}

export function includedComps(analysis: AnalysisResult) {
  return analysis.assessments
    .filter((a) => a.included)
    .map((a) => ({
      title: a.comparable.title,
      price: a.comparable.price,
      source:
        a.comparable.source === 'ebay'
          ? 'Current eBay Australia listing'
          : 'Offline fixture comps (not live eBay)',
      matchLabel: a.matchLabel,
    }))
}

export function excludedComps(analysis: AnalysisResult) {
  return analysis.assessments
    .filter((a) => !a.included)
    .map((a) => ({
      title: a.comparable.title,
      price: a.comparable.price,
      source: a.rejectionReason ?? 'Excluded',
      matchLabel: a.matchLabel,
    }))
}

export const demoRisks = [
  {
    title: 'Inspect the lenses',
    description: 'Look for scratches, haze or sun damage before payment.',
  },
  {
    title: 'Test both controllers',
    description: 'Check tracking, buttons, triggers and battery contacts.',
  },
  {
    title: 'Check the headset charge',
    description: 'Make sure it powers on, charges and holds connection.',
  },
  {
    title: 'Confirm the serial number',
    description: 'Match the headset and box, and ask about proof of purchase.',
  },
]
