import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import { quest3512Fixtures } from '@/lib/pricing/fixtures/quest3-512'
import type { ComparableListing, IdentifiedProduct } from '@/types/domain'

function isQuest3512(product: IdentifiedProduct): boolean {
  const hay = `${product.brand} ${product.model} ${product.variant ?? ''}`.toLowerCase()
  return (
    hay.includes('quest 3') &&
    (hay.includes('512') || product.variant?.includes('512') === true)
  )
}

export class TestPricingProvider implements PricingProvider {
  async search(product: IdentifiedProduct): Promise<ComparableListing[]> {
    if (isQuest3512(product)) {
      return quest3512Fixtures
    }
    return []
  }
}
