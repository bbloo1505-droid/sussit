import type { PricingProvider } from '@/lib/pricing/PricingProvider'
import type { ComparableListing, IdentifiedProduct } from '@/types/domain'

type CompsApiResponse =
  | {
      ok: true
      source: 'ebay' | 'unavailable'
      listings: ComparableListing[]
    }
  | { ok: false; error: string }

/**
 * Client-side provider that calls server Browse API.
 * Returns [] when eBay keys are missing so callers can fall back to fixtures.
 */
export class ApiPricingProvider implements PricingProvider {
  async search(product: IdentifiedProduct): Promise<ComparableListing[]> {
    try {
      const res = await fetch('/api/comps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand: product.brand,
          model: product.model,
          variant: product.variant,
          limit: 50,
        }),
      })
      const raw = await res.text()
      let json: CompsApiResponse
      try {
        json = JSON.parse(raw) as CompsApiResponse
      } catch {
        return []
      }
      if (!json.ok || json.source === 'unavailable') return []
      return json.listings.map((row) => ({
        ...row,
        currency: 'AUD',
        includedAccessories: row.includedAccessories ?? [],
      }))
    } catch {
      return []
    }
  }
}
