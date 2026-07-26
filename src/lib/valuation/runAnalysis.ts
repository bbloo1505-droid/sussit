import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import { assessComparables } from '@/lib/valuation/matchComparable'
import { calculateMarketRange } from '@/lib/valuation/calculateMarketRange'
import { calculateConfidence } from '@/lib/valuation/calculateConfidence'
import { calculateOffer } from '@/lib/valuation/calculateOffer'
import { calculateDeal } from '@/lib/valuation/calculateDeal'
import type { AnalysisResult, IdentifiedProduct } from '@/types/domain'

function productLabel(product: IdentifiedProduct): string {
  return [product.brand, product.model, product.variant].filter(Boolean).join(' ')
}

export async function runAnalysis(input: {
  product: IdentifiedProduct
  pricing: PricingProvider
  id?: string
}): Promise<AnalysisResult> {
  const listings = await input.pricing.search(input.product)
  const assessments = assessComparables(input.product, listings)
  const market = calculateMarketRange(assessments)
  const confidence = calculateConfidence({
    product: input.product,
    assessments,
    market,
  })
  const deal = calculateDeal({
    product: input.product,
    market,
    confidence,
  })
  const offer =
    market == null
      ? null
      : calculateOffer({
          product: input.product,
          market,
          confidence,
        })

  return {
    id: input.id ?? crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    product: input.product,
    productLabel: productLabel(input.product),
    market,
    confidence,
    deal,
    offer,
    assessments,
  }
}
