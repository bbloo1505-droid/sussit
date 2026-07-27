import type { ComparableListing, ProductCondition } from '../types/comparable.ts'

type EbayMoney = { value?: string; currency?: string }
type EbayItemSummary = {
  itemId?: string
  title?: string
  price?: EbayMoney
  condition?: string
  conditionId?: string
  itemWebUrl?: string
  itemHref?: string
  itemCreationDate?: string
  itemEndDate?: string
  itemLocation?: { city?: string; country?: string }
  shippingOptions?: Array<{
    shippingCost?: EbayMoney
  }>
  estimatedAvailabilities?: Array<{
    estimatedAvailableQuantity?: number
    estimatedSoldQuantity?: number
    availabilityThreshold?: number
  }>
}

export function mapBrowseItem(item: EbayItemSummary): ComparableListing | null {
  const price = Number(item.price?.value)
  if (!item.itemId || !item.title || !Number.isFinite(price)) return null

  const avail = item.estimatedAvailabilities?.[0]
  const shippingRaw = item.shippingOptions?.[0]?.shippingCost?.value
  const shipping = shippingRaw != null ? Number(shippingRaw) : null

  const locationParts = [item.itemLocation?.city, item.itemLocation?.country]
    .filter(Boolean)
    .join(', ')

  return {
    id: `ebay-${item.itemId}`,
    source: 'ebay',
    externalId: item.itemId,
    title: item.title,
    price,
    currency: (item.price?.currency as 'AUD') || 'AUD',
    condition: mapCondition(item.condition, item.conditionId),
    shipping: Number.isFinite(shipping) ? shipping : null,
    location: locationParts || null,
    url: item.itemWebUrl ?? item.itemHref ?? null,
    includedAccessories: [],
    estimatedSoldQuantity: avail?.estimatedSoldQuantity ?? null,
    estimatedAvailableQuantity: avail?.estimatedAvailableQuantity ?? null,
    itemCreatedAt: item.itemCreationDate ?? null,
    itemEndAt: item.itemEndDate ?? null,
  }
}

function mapCondition(
  condition?: string,
  conditionId?: string,
): ProductCondition | null {
  const id = conditionId ?? ''
  const text = (condition ?? '').toLowerCase()

  if (id === '1000' || text.includes('new')) return 'new'
  if (id === '1500' || text.includes('open box') || text.includes('new other')) {
    return 'used_like_new'
  }
  if (
    id === '2000' ||
    id === '2010' ||
    id === '2020' ||
    text.includes('certified refurbished') ||
    text.includes('excellent') ||
    text.includes('like new')
  ) {
    return 'used_like_new'
  }
  if (id === '2500' || id === '3000' || id === '4000' || id === '5000') {
    return 'used_good'
  }
  if (id === '6000' || text.includes('acceptable') || text.includes('fair')) {
    return 'used_fair'
  }
  if (id === '7000' || text.includes('for parts') || text.includes('not working')) {
    return 'for_parts'
  }
  if (text.includes('used') || text.includes('good')) return 'used_good'

  return text ? 'used_good' : 'unknown'
}
