import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import { assessComparables } from '@/lib/valuation/matchComparable'
import { calculateMarketRange } from '@/lib/valuation/calculateMarketRange'
import { calculateConfidence } from '@/lib/valuation/calculateConfidence'
import { calculateOffer } from '@/lib/valuation/calculateOffer'
import { calculateDeal } from '@/lib/valuation/calculateDeal'
import {
  intelligenceTierForCategory,
} from '@/lib/intelligence/supportTier'
import { canonicalProductId } from '@/lib/intelligence/productGraph'
import type { AnalysisResult, IdentifiedProduct } from '@/types/domain'

function productLabel(product: IdentifiedProduct): string {
  return [product.brand, product.model, product.variant].filter(Boolean).join(' ')
}

export async function runAnalysis(input: {
  product: IdentifiedProduct
  pricing: PricingProvider
  id?: string
}): Promise<AnalysisResult> {
  const intelligenceTier = intelligenceTierForCategory(input.product.category)
  const productId = canonicalProductId(input.product)

  const listings = await input.pricing.search(input.product)
  const assessments = assessComparables(input.product, listings)
  const market = calculateMarketRange(assessments)
  let confidence = calculateConfidence({
    product: input.product,
    assessments,
    market,
  })

  // Basic categories: never fake Buy/Offer precision even if a few comps exist.
  if (intelligenceTier === 'basic') {
    confidence = {
      ...confidence,
      level: 'INSUFFICIENT',
      reasons: [
        `Limited market data — ${input.product.category} is accepted for search, but not yet supported for high-confidence pricing.`,
        ...confidence.reasons,
      ],
    }
  }

  // Emerging categories: allow comps, but soft-cap strong confidence until matchers mature.
  if (
    intelligenceTier === 'emerging' &&
    (confidence.level === 'HIGH' || confidence.level === 'MEDIUM')
  ) {
    confidence = {
      ...confidence,
      level: 'LOW',
      reasons: [
        'Growing category coverage — treat this as directional, not a firm Buy/Offer call yet.',
        ...confidence.reasons,
      ],
    }
  }

  let deal = calculateDeal({
    product: input.product,
    market,
    confidence,
  })

  if (intelligenceTier === 'basic') {
    deal = {
      differenceFromMedianPercent: deal.differenceFromMedianPercent,
      dealScore: null,
      verdictLabel: 'LIMITED MARKET DATA',
    }
  } else if (
    intelligenceTier === 'emerging' &&
    deal.verdictLabel !== 'INSUFFICIENT DATA'
  ) {
    // Keep market/offer visible but avoid punchy Buy/Overpriced framing.
    deal = {
      ...deal,
      dealScore: null,
      verdictLabel: 'LIMITED MARKET DATA',
    }
  }

  const offer =
    intelligenceTier === 'full' && market != null
      ? calculateOffer({
          product: input.product,
          market,
          confidence,
        })
      : null

  return {
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    product: input.product,
    productLabel: productLabel(input.product),
    productId,
    intelligenceTier,
    market,
    confidence,
    deal,
    offer,
    assessments,
  }
}
