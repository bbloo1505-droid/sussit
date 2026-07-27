import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import { ApiPricingProvider } from '@/lib/pricing/ApiPricingProvider'
import { TestPricingProvider } from '@/lib/pricing/TestPricingProvider'
import type { ComparableListing, IdentifiedProduct } from '@/types/domain'

/**
 * Prefer live eBay AU comps; fall back to fixtures when Browse is unavailable
 * or returns no rows for the SKU.
 */
export function createPricingProvider(): PricingProvider {
  const live = new ApiPricingProvider()
  const fixtures = new TestPricingProvider()

  return {
    async search(product: IdentifiedProduct): Promise<ComparableListing[]> {
      const ebay = await live.search(product)
      if (ebay.length > 0) return ebay
      return fixtures.search(product)
    },
  }
}
