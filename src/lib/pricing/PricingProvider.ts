import type { ComparableListing, IdentifiedProduct } from '@/types/domain'

export interface PricingProvider {
  search(product: IdentifiedProduct): Promise<ComparableListing[]>
}
