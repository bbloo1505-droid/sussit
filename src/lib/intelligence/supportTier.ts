import type { ProductCategory } from '@/types/domain'

/**
 * Universal intake + comps-first intelligence.
 * Category tiers label coverage maturity; they no longer force LIMITED MARKET DATA.
 * Verdicts follow comparable quality (see calculateConfidence / runAnalysis).
 */
export type IntelligenceTier = 'full' | 'emerging' | 'basic'

/** Categories with the strongest matchers and AU inventory. */
export const FULL_INTELLIGENCE_CATEGORIES = new Set<ProductCategory>([
  'phone',
  'console',
  'vr_headset',
  'camera',
  'laptop',
  'tablet',
  'wearable',
  'audio',
  'gpu',
  'power_tool',
])

/**
 * Broad marketplace categories — real Buy/Offer when comps are solid.
 */
export const EMERGING_INTELLIGENCE_CATEGORIES = new Set<ProductCategory>([
  'furniture',
  'clothing',
  'jewellery',
  'collectible',
  'vehicle',
])

export function intelligenceTierForCategory(
  category: ProductCategory,
): IntelligenceTier {
  if (FULL_INTELLIGENCE_CATEGORIES.has(category)) return 'full'
  if (EMERGING_INTELLIGENCE_CATEGORIES.has(category)) return 'emerging'
  return 'basic'
}

export function tierLabel(tier: IntelligenceTier): string {
  switch (tier) {
    case 'full':
      return 'Strong category coverage'
    case 'emerging':
      return 'Broad marketplace coverage'
    case 'basic':
      return 'General item coverage'
  }
}

export function limitedMarketCopy(category: ProductCategory): string {
  return `We found some comparable listings for ${categoryLabel(category)}, but the evidence is still thin. Treat the range as directional.`
}

export function categoryLabel(category: ProductCategory): string {
  switch (category) {
    case 'phone':
      return 'phones'
    case 'console':
      return 'gaming consoles'
    case 'vr_headset':
      return 'VR headsets'
    case 'camera':
      return 'cameras'
    case 'laptop':
      return 'laptops'
    case 'tablet':
      return 'tablets'
    case 'wearable':
      return 'wearables'
    case 'audio':
      return 'audio gear'
    case 'gpu':
      return 'GPUs'
    case 'power_tool':
      return 'power tools'
    case 'furniture':
      return 'furniture'
    case 'clothing':
      return 'clothing'
    case 'vehicle':
      return 'vehicles'
    case 'jewellery':
      return 'jewellery'
    case 'collectible':
      return 'collectibles'
    case 'other':
      return 'this category'
    case 'unknown':
      return 'this item'
  }
}

/** Short positioning for home / marketing surfaces. */
export const SUSSIT_POSITIONING = {
  consumerHeadline: 'Know what to pay before you buy.',
  consumerSupport:
    'Paste a listing. We compare live eBay Australia asking prices and tell you what to pay.',
  flipHeadline: 'Know what will flip — and what to pay.',
} as const
