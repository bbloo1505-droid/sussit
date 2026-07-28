import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import { quest3512Fixtures } from '@/lib/pricing/fixtures/quest3-512'
import { switchOledFixtures } from '@/lib/pricing/fixtures/switch-oled'
import { iphone14128Fixtures } from '@/lib/pricing/fixtures/iphone14-128'
import { ps5DiscFixtures } from '@/lib/pricing/fixtures/ps5-disc'
import { xboxSeriesXFixtures } from '@/lib/pricing/fixtures/xbox-series-x'
import type { ComparableListing, IdentifiedProduct } from '@/types/domain'

function haystack(product: IdentifiedProduct): string {
  return `${product.brand} ${product.model} ${product.variant ?? ''}`.toLowerCase()
}

export class TestPricingProvider implements PricingProvider {
  async search(product: IdentifiedProduct): Promise<ComparableListing[]> {
    const hay = haystack(product)

    if (hay.includes('quest 3')) {
      return quest3512Fixtures
    }
    if (hay.includes('switch oled')) {
      return switchOledFixtures
    }
    if (hay.includes('iphone 14')) {
      return iphone14128Fixtures
    }
    if (
      hay.includes('playstation 5') ||
      /\bps5\b/.test(hay) ||
      hay.includes('ps5 ')
    ) {
      return ps5DiscFixtures
    }
    if (hay.includes('xbox series x')) {
      return xboxSeriesXFixtures
    }

    return []
  }
}
