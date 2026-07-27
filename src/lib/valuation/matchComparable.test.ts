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

  it('rejects charging dock accessory', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '9',
        title: 'META Quest 3 Charging Dock',
        price: 159,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Accessory|parts|Not a full headset/i)
  })

  it('rejects elite strap accessory', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '10',
        title: 'Meta Quest 3 Elite strap with battery',
        price: 158,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Accessory|parts|Not a full headset/i)
  })

  it('rejects spare controller parts', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '11',
        title: 'Meta Quest 3 Controller Side Grip Cover (Left)',
        price: 54,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Accessory|parts|Not a full headset/i)
  })

  it('includes bare storage Quest title without the word headset', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '12',
        title: 'Meta Quest 3 512 GB',
        price: 690,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(true)
  })
})
