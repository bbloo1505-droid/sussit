import type { IdentifiedProduct, ProductCategory, ProductCondition } from '@/types/domain'
import { intelligenceTierForCategory } from '@/lib/intelligence/supportTier'

/**
 * Normalized product graph node — prefer this over free-text search strings
 * when persisting observations / polling a curated SKU universe.
 */
export type ProductNode = {
  productId: string
  category: ProductCategory
  brand: string
  family: string | null
  model: string
  variant: string | null
  storageGb: number | null
  condition: ProductCondition | null
  bundle: string | null
  intelligenceTier: ReturnType<typeof intelligenceTierForCategory>
}

export function extractStorageGb(text: string | null | undefined): number | null {
  if (!text) return null
  const match = text.toLowerCase().match(/(\d+)\s*gb/)
  return match ? Number(match[1]) : null
}

export function inferFamily(
  category: ProductCategory,
  brand: string,
  model: string,
): string | null {
  const hay = `${brand} ${model}`.toLowerCase()
  if (category === 'vr_headset' || hay.includes('quest')) return 'Quest'
  if (category === 'phone' && hay.includes('iphone')) return 'iPhone'
  if (category === 'phone' && hay.includes('galaxy')) return 'Galaxy'
  if (category === 'phone' && hay.includes('pixel')) return 'Pixel'
  if (category === 'console' && (hay.includes('playstation') || hay.includes('ps5'))) {
    return 'PlayStation'
  }
  if (category === 'console' && hay.includes('xbox')) return 'Xbox'
  if (category === 'console' && hay.includes('switch')) return 'Switch'
  if (category === 'console' && hay.includes('steam deck')) return 'Steam Deck'
  if (category === 'tablet' && hay.includes('ipad')) return 'iPad'
  if (category === 'laptop' && hay.includes('macbook')) return 'MacBook'
  if (category === 'wearable' && hay.includes('watch')) return 'Apple Watch'
  return null
}

export function inferBundle(product: IdentifiedProduct): string | null {
  const accessories = product.includedAccessories.map((a) => a.toLowerCase())
  if (accessories.length === 0) return null
  if (
    product.category === 'vr_headset' &&
    accessories.some((a) => a.includes('controller'))
  ) {
    return 'Headset + Controllers'
  }
  if (product.category === 'power_tool') {
    const hasBattery = accessories.some((a) => a.includes('battery'))
    const hasCharger = accessories.some((a) => a.includes('charger'))
    if (hasBattery && hasCharger) return 'Kit (tool + battery + charger)'
    if (hasBattery) return 'Tool + battery'
    return 'Tool only'
  }
  return accessories.slice(0, 3).join(' + ')
}

/** Stable SKU-ish id for lifecycle polling and observation grouping. */
export function canonicalProductId(product: IdentifiedProduct): string {
  const parts = [
    product.brand,
    product.model,
    product.variant ?? '',
  ]
    .map((p) =>
      p
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
    )
    .filter(Boolean)

  return parts.join('_') || 'UNKNOWN_PRODUCT'
}

export function toProductNode(product: IdentifiedProduct): ProductNode {
  return {
    productId: canonicalProductId(product),
    category: product.category,
    brand: product.brand,
    family: inferFamily(product.category, product.brand, product.model),
    model: product.model,
    variant: product.variant,
    storageGb:
      extractStorageGb(product.variant) ?? extractStorageGb(product.model),
    condition: product.condition,
    bundle: inferBundle(product),
    intelligenceTier: intelligenceTierForCategory(product.category),
  }
}
