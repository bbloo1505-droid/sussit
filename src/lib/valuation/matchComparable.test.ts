import { describe, expect, it } from 'vitest'
import { matchComparable } from '@/lib/valuation/matchComparable'
import { questDemoProduct } from '@/lib/analysis/questDemoProduct'
import type { ComparableListing } from '@/types/domain'

function listing(partial: Partial<ComparableListing> & Pick<ComparableListing, 'id' | 'title' | 'price'>): ComparableListing {
  return {
    source: 'fixture',
    externalId: partial.id,
    currency: 'AUD',
    condition: 'used_good',
    shipping: 0,
    location: 'Sydney, NSW',
    url: null,
    includedAccessories: ['left controller', 'right controller'],
    ...partial,
  }
}

describe('matchComparable', () => {
  it('includes exact Quest 3 512GB used match', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '1',
        title: 'Meta Quest 3 512GB VR Headset with Controllers',
        price: 540,
      }),
    )
    expect(result.included).toBe(true)
    expect(result.matchScore).toBeGreaterThanOrEqual(80)
    expect(result.reasons.join(' ')).toMatch(/Exact model/i)
  })

  it('rejects wrong storage', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '2',
        title: 'Meta Quest 3 128GB used with controllers',
        price: 420,
      }),
    )
    expect(result.included).toBe(false)
    expect(result.reasons.join(' ') + (result.rejectionReason ?? '')).toMatch(
      /storage|threshold|Different/i,
    )
  })

  it('rejects controllers only', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '3',
        title: 'Meta Quest 3 controllers only — pair',
        price: 180,
        includedAccessories: ['left controller', 'right controller'],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Parts|accessories/i)
  })

  it('rejects broken item', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '4',
        title: 'Meta Quest 3 512GB faulty broken screen',
        price: 240,
        condition: 'for_parts',
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Broken|parts/i)
  })

  it('rejects brand new item', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '5',
        title: 'Brand new Meta Quest 3 512GB sealed',
        price: 799,
        condition: 'new',
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Brand new/i)
  })

  it('rejects wrong generation', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '6',
        title: 'Meta Quest 2 256GB VR headset',
        price: 280,
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Wrong generation|Model not matched/i)
  })

  it('penalises / excludes large bundle', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '7',
        title:
          'Meta Quest 3 512GB + Elite Strap + battery pack + case + games bundle',
        price: 720,
        includedAccessories: [
          'left controller',
          'right controller',
          'elite strap',
          'battery pack',
          'case',
          'games',
        ],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.reasons.join(' ')).toMatch(/bundle/i)
  })

  it('penalises headset only', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '8',
        title: 'Meta Quest 3 512GB headset only — no controllers',
        price: 390,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.reasons.join(' ')).toMatch(/Headset only/i)
  })
})
