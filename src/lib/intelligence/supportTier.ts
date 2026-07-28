import type { ProductCategory } from '@/types/domain'

/**
 * Universal intake, narrow intelligence.
 * Accept any listing; only `full` categories earn strong Buy/Offer verdicts.
 */
export type IntelligenceTier = 'full' | 'emerging' | 'basic'

/** Categories where SussIt aims for high-confidence pricing. */
export const FULL_INTELLIGENCE_CATEGORIES = new Set<ProductCategory>([
  'phone',
  'console',
  'vr_headset',
])

/**
 * Target expansion categories — accept + analyse, but don't over-claim
 * until comps/matchers are as strong as phones/gaming/VR.
 */
export const EMERGING_INTELLIGENCE_CATEGORIES = new Set<ProductCategory>([
  'camera',
  'laptop',
  'tablet',
  'wearable',
  'audio',
  'gpu',
  'power_tool',
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
      return 'High-confidence category'
    case 'emerging':
      return 'Growing category coverage'
    case 'basic':
      return 'Limited category coverage'
  }
}

export function limitedMarketCopy(category: ProductCategory): string {
  return `We found some comparable listings, but ${categoryLabel(category)} isn't currently supported for high-confidence pricing. Treat this as a rough check — not a Buy/Offer call.`
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
    'Paste a listing. Strong Buy/Offer where our comps are proven — honest limits everywhere else.',
  flipHeadline: 'Know what will flip — and what to pay.',
} as const
