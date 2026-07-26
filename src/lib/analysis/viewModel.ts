import type { AnalysisResult } from '@/types/domain'
import { formatAud } from '@/lib/utils'

export function buildOfferMessage(analysis: AnalysisResult): string {
  const offer = analysis.offer?.openingOffer
  if (offer == null) {
    return 'Not enough data for a suggested offer yet.'
  }
  return `Hey mate, definitely interested. Would you take ${formatAud(offer)} if I can pick it up today?`
}

export function buildExplanation(analysis: AnalysisResult): string {
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

export function includedComps(analysis: AnalysisResult) {
  return analysis.assessments
    .filter((a) => a.included)
    .map((a) => ({
      title: a.comparable.title,
      price: a.comparable.price,
      source: 'Current eBay Australia listing (fixture)',
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
