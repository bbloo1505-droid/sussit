import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import { ApiPricingProvider } from '@/lib/pricing/ApiPricingProvider'
import { TestPricingProvider } from '@/lib/pricing/TestPricingProvider'
import { assessComparables } from '@/lib/valuation/matchComparable'
import type { ComparableListing, IdentifiedProduct } from '@/types/domain'

function includedCount(
  product: IdentifiedProduct,
  listings: ComparableListing[],
): number {
  return assessComparables(product, listings).filter((a) => a.included).length
}

/**
 * Prefer live eBay AU comps; fall back to fixtures when Browse is unavailable
 * or returns only noise that the matcher excludes.
 */
export function createPricingProvider(): PricingProvider {
  const live = new ApiPricingProvider()
  const fixtures = new TestPricingProvider()

  return {
    async search(product: IdentifiedProduct): Promise<ComparableListing[]> {
      const ebay = await live.search(product)
      if (ebay.length > 0 && includedCount(product, ebay) > 0) {
        return ebay
      }

      const fallback = await fixtures.search(product)
      if (fallback.length > 0) return fallback
      return ebay
    },
  }
}
