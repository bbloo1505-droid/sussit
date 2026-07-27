import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import { quest3512Fixtures } from '@/lib/pricing/fixtures/quest3-512'
import type { ComparableListing, IdentifiedProduct } from '@/types/domain'

function haystack(product: IdentifiedProduct): string {
  return `${product.brand} ${product.model} ${product.variant ?? ''}`.toLowerCase()
}

export class TestPricingProvider implements PricingProvider {
  async search(product: IdentifiedProduct): Promise<ComparableListing[]> {
    const hay = haystack(product)
    // Fixture fallback for any Quest 3 when live eBay returns nothing
    if (hay.includes('quest 3')) {
      return quest3512Fixtures
    }
    return []
  }
}
