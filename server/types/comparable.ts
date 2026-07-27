/** Server-side mirror of client ComparableListing (avoid importing @/ from server). */

export type ProductCondition =
  | 'new'
  | 'used_like_new'
  | 'used_good'
  | 'used_fair'
  | 'for_parts'
  | 'unknown'

export type ComparableListing = {
  id: string
  source: 'ebay' | 'fixture' | 'manual'
  externalId: string | null
  title: string
  price: number
  currency: 'AUD' | 'USD' | string
  condition: ProductCondition | null
  shipping: number | null
  location: string | null
  url: string | null
  includedAccessories: string[]
  estimatedSoldQuantity?: number | null
  estimatedAvailableQuantity?: number | null
  itemCreatedAt?: string | null
  itemEndAt?: string | null
}
