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
    expect(
      `${result.reasons.join(' ')} ${result.rejectionReason ?? ''}`,
    ).toMatch(/bundle|strap|accessory/i)
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

  it('rejects Quest strap add-on even when GB mentioned', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '13',
        title: 'Meta Quest 3 512gb w/ BoboVR Headstrap - Original Box',
        price: 355,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
  })

  it('rejects empty box packaging', () => {
    const result = matchComparable(
      questDemoProduct,
      listing({
        id: '14',
        title: 'Empty box only for Meta Quest 3',
        price: 25,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Empty box/i)
  })

  it('rejects PS5 Slim when target is base PS5 Disc', () => {
    const ps5 = {
      ...questDemoProduct,
      category: 'console' as const,
      brand: 'Sony',
      model: 'PlayStation 5',
      variant: 'Disc',
      includedAccessories: [],
    }
    const result = matchComparable(
      ps5,
      listing({
        id: '15',
        title: 'PS5 Slim Disc Edition with controller',
        price: 580,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Slim/i)
  })

  it('rejects iPhone 15 Pro Max when target is iPhone 15 Pro', () => {
    const pro = {
      ...questDemoProduct,
      category: 'phone' as const,
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      variant: '256GB',
      includedAccessories: [],
    }
    const result = matchComparable(
      pro,
      listing({
        id: '16',
        title: 'iPhone 15 Pro Max 256GB unlocked used',
        price: 1100,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
    expect(result.rejectionReason).toMatch(/Pro Max/i)
  })

  it('rejects Switch Lite when target is Switch OLED', () => {
    const oled = {
      ...questDemoProduct,
      category: 'console' as const,
      brand: 'Nintendo',
      model: 'Switch OLED',
      variant: null,
      includedAccessories: [],
    }
    const result = matchComparable(
      oled,
      listing({
        id: '17',
        title: 'Nintendo Switch Lite turquoise used',
        price: 180,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
  })

  it('rejects phone case listing', () => {
    const phone = {
      ...questDemoProduct,
      category: 'phone' as const,
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      variant: '256GB',
      includedAccessories: [],
    }
    const result = matchComparable(
      phone,
      listing({
        id: '18',
        title: 'Case For Apple iPhone 15 Pro Max Magnetic Shockproof Cover',
        price: 9,
        condition: 'new',
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(false)
  })

  it('rejects single AirPods ear and keeps Pro 2 pair', () => {
    const buds = {
      ...questDemoProduct,
      category: 'audio' as const,
      brand: 'Apple',
      model: 'AirPods Pro 2',
      variant: null,
      includedAccessories: [],
    }
    expect(
      matchComparable(
        buds,
        listing({
          id: '19',
          title: 'Genuine Apple AirPods Pro 2nd Gen Replacement Earbud Single Right Ear ONLY',
          price: 70,
          includedAccessories: [],
        }),
      ).included,
    ).toBe(false)
    expect(
      matchComparable(
        buds,
        listing({
          id: '20',
          title: 'Apple AirPods Pro 2nd Generation USB-C Noise Cancelling',
          price: 180,
          includedAccessories: [],
        }),
      ).included,
    ).toBe(true)
  })

  it('rejects RTX 4070 laptop when targeting bare GPU', () => {
    const gpu = {
      ...questDemoProduct,
      category: 'gpu' as const,
      brand: 'NVIDIA',
      model: 'RTX 4070',
      variant: null,
      includedAccessories: [],
    }
    expect(
      matchComparable(
        gpu,
        listing({
          id: '21',
          title: 'ASUS TUF Gaming 15.6in Laptop RTX4070',
          price: 1518,
          includedAccessories: [],
        }),
      ).included,
    ).toBe(false)
    expect(
      matchComparable(
        gpu,
        listing({
          id: '22',
          title: 'Gigabyte Nvidia GeForce RTX 4070 AERO OC 12G Graphics Card',
          price: 805,
          includedAccessories: [],
        }),
      ).included,
    ).toBe(true)
  })

  it('includes MacBook Air M2 when title splits chip and capacity', () => {
    const mba = {
      ...questDemoProduct,
      category: 'laptop' as const,
      brand: 'Apple',
      model: 'MacBook Air M2',
      variant: '8GB 256GB',
      includedAccessories: [],
    }
    const result = matchComparable(
      mba,
      listing({
        id: '23',
        title: 'Apple MacBook Air 13.6" (256GB SSD, M2, 8GB) Laptop - Silver',
        price: 998,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(true)
  })

  it('allows high furniture prices that used to hit the $3500 ceiling', () => {
    const sofa = {
      ...questDemoProduct,
      category: 'furniture' as const,
      brand: 'IKEA',
      model: 'Kivik Sofa',
      variant: null,
      includedAccessories: [],
    }
    const result = matchComparable(
      sofa,
      listing({
        id: '24',
        title: 'IKEA Kivik 3 seater sofa grey fabric',
        price: 4200,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(true)
  })

  it('matches basic furniture on brand + token overlap', () => {
    const sofa = {
      ...questDemoProduct,
      category: 'furniture' as const,
      brand: 'IKEA',
      model: 'Kivik 3 Seater',
      variant: null,
      includedAccessories: [],
    }
    const result = matchComparable(
      sofa,
      listing({
        id: '25',
        title: 'IKEA Kivik sofa lounge suite Melbourne pickup',
        price: 380,
        includedAccessories: [],
      }),
    )
    expect(result.included).toBe(true)
  })

  it('rejects PS5 Pro Enhanced games and Hawk titles', () => {
    const pro = {
      ...questDemoProduct,
      category: 'console' as const,
      brand: 'Sony',
      model: 'PlayStation 5 Pro',
      variant: null,
      includedAccessories: [],
    }
    expect(
      matchComparable(
        pro,
        listing({
          id: '26',
          title: 'Nacon Hell is Us (PS5) Action PS5 Pro Enhanced Ultra HD',
          price: 40,
          includedAccessories: [],
        }),
      ).included,
    ).toBe(false)
    expect(
      matchComparable(
        pro,
        listing({
          id: '27',
          title: "Tony Hawk's Pro Skater 5 Sony PS4 Game",
          price: 25,
          includedAccessories: [],
        }),
      ).included,
    ).toBe(false)
  })

  it('rejects LEGO minifigures when hunting a set number', () => {
    const lego = {
      ...questDemoProduct,
      category: 'collectible' as const,
      brand: 'LEGO',
      model: '75192',
      variant: 'Millennium Falcon',
      includedAccessories: [],
    }
    expect(
      matchComparable(
        lego,
        listing({
          id: '28',
          title: 'R2-Q2 Astromech Droid Star Wars Lego minifigure sw0303',
          price: 12,
          includedAccessories: [],
        }),
      ).included,
    ).toBe(false)
  })
})
