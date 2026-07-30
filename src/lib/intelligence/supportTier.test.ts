import { describe, expect, it } from 'vitest'
import {
  intelligenceTierForCategory,
  limitedMarketCopy,
} from '@/lib/intelligence/supportTier'
import {
  canonicalProductId,
  toProductNode,
} from '@/lib/intelligence/productGraph'
import type { IdentifiedProduct } from '@/types/domain'

const quest: IdentifiedProduct = {
  category: 'vr_headset',
  brand: 'Meta',
  model: 'Quest 3',
  variant: '512GB',
  askingPrice: 650,
  currency: 'AUD',
  condition: 'used_good',
  location: 'Melbourne',
  includedAccessories: ['left controller', 'right controller'],
  missingInformation: [],
  sellerClaims: [],
  visibleIssues: [],
  identificationConfidence: 0.9,
}

describe('supportTiers', () => {
  it('marks core electronics as full intelligence', () => {
    expect(intelligenceTierForCategory('phone')).toBe('full')
    expect(intelligenceTierForCategory('console')).toBe('full')
    expect(intelligenceTierForCategory('vr_headset')).toBe('full')
    expect(intelligenceTierForCategory('laptop')).toBe('full')
    expect(intelligenceTierForCategory('camera')).toBe('full')
    expect(intelligenceTierForCategory('audio')).toBe('full')
    expect(intelligenceTierForCategory('power_tool')).toBe('full')
  })

  it('marks broad marketplace categories as emerging', () => {
    expect(intelligenceTierForCategory('furniture')).toBe('emerging')
    expect(intelligenceTierForCategory('clothing')).toBe('emerging')
    expect(intelligenceTierForCategory('jewellery')).toBe('emerging')
    expect(intelligenceTierForCategory('collectible')).toBe('emerging')
    expect(intelligenceTierForCategory('vehicle')).toBe('emerging')
  })

  it('marks unknown/other as basic coverage', () => {
    expect(intelligenceTierForCategory('other')).toBe('basic')
    expect(intelligenceTierForCategory('unknown')).toBe('basic')
    expect(limitedMarketCopy('furniture')).toMatch(/directional/i)
  })
})

describe('productGraph', () => {
  it('normalizes Quest into a product node', () => {
    const node = toProductNode(quest)
    expect(node.productId).toBe('META_QUEST_3_512GB')
    expect(node.family).toBe('Quest')
    expect(node.storageGb).toBe(512)
    expect(node.bundle).toBe('Headset + Controllers')
    expect(node.intelligenceTier).toBe('full')
  })

  it('builds stable ids without inventing data', () => {
    expect(
      canonicalProductId({
        ...quest,
        brand: 'Apple',
        model: 'iPhone 14',
        variant: '128GB',
        category: 'phone',
      }),
    ).toBe('APPLE_IPHONE_14_128GB')
  })
})
