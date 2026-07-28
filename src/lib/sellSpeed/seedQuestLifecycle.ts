import {
  clearLifecycleStore,
  saveLifecycles,
  saveObservations,
} from '@/lib/sellSpeed/lifecycleStore'
import type { ListingLifecycle, ListingObservation } from '@/types/sellSpeed'

export const QUEST_PRODUCT_ID = 'META_QUEST_3_512'
export const SWITCH_OLED_PRODUCT_ID = 'NINTENDO_SWITCH_OLED_BASE'
export const IPHONE14_128_PRODUCT_ID = 'APPLE_IPHONE_14_128GB'
export const PS5_DISC_PRODUCT_ID = 'SONY_PLAYSTATION_5_DISC'
export const XBOX_SERIES_X_PRODUCT_ID = 'MICROSOFT_XBOX_SERIES_X_BASE'

type SeedSpec = {
  productId: string
  title: string
  /** Closed listings: [price, days, outcome] */
  closed: Array<[number, number, 'CONFIRMED_SOLD' | 'DISAPPEARED']>
  activePrices: number[]
}

const SPECS: SeedSpec[] = [
  {
    productId: QUEST_PRODUCT_ID,
    title: 'Meta Quest 3 512GB',
    closed: [
      [525, 3, 'CONFIRMED_SOLD'],
      [535, 2, 'CONFIRMED_SOLD'],
      [540, 4, 'DISAPPEARED'],
      [549, 5, 'CONFIRMED_SOLD'],
      [555, 3, 'DISAPPEARED'],
      [565, 7, 'CONFIRMED_SOLD'],
      [575, 9, 'DISAPPEARED'],
      [580, 8, 'CONFIRMED_SOLD'],
      [590, 11, 'DISAPPEARED'],
      [625, 16, 'DISAPPEARED'],
      [640, 21, 'DISAPPEARED'],
      [660, 28, 'DISAPPEARED'],
    ],
    activePrices: [570, 585, 599],
  },
  {
    productId: SWITCH_OLED_PRODUCT_ID,
    title: 'Nintendo Switch OLED',
    closed: [
      [265, 2, 'CONFIRMED_SOLD'],
      [270, 3, 'CONFIRMED_SOLD'],
      [275, 4, 'DISAPPEARED'],
      [280, 3, 'CONFIRMED_SOLD'],
      [285, 5, 'DISAPPEARED'],
      [290, 6, 'CONFIRMED_SOLD'],
      [295, 8, 'DISAPPEARED'],
      [310, 14, 'DISAPPEARED'],
      [320, 18, 'DISAPPEARED'],
    ],
    activePrices: [278, 288, 299],
  },
  {
    productId: IPHONE14_128_PRODUCT_ID,
    title: 'Apple iPhone 14 128GB',
    closed: [
      [520, 4, 'CONFIRMED_SOLD'],
      [530, 5, 'CONFIRMED_SOLD'],
      [540, 6, 'DISAPPEARED'],
      [545, 5, 'CONFIRMED_SOLD'],
      [550, 7, 'DISAPPEARED'],
      [560, 9, 'CONFIRMED_SOLD'],
      [575, 12, 'DISAPPEARED'],
      [600, 20, 'DISAPPEARED'],
      [620, 25, 'DISAPPEARED'],
    ],
    activePrices: [548, 559, 569],
  },
  {
    productId: PS5_DISC_PRODUCT_ID,
    title: 'Sony PlayStation 5 Disc',
    closed: [
      [480, 5, 'CONFIRMED_SOLD'],
      [490, 6, 'CONFIRMED_SOLD'],
      [500, 7, 'DISAPPEARED'],
      [505, 6, 'CONFIRMED_SOLD'],
      [510, 8, 'DISAPPEARED'],
      [520, 10, 'CONFIRMED_SOLD'],
      [540, 16, 'DISAPPEARED'],
      [560, 22, 'DISAPPEARED'],
    ],
    activePrices: [515, 525, 535],
  },
  {
    productId: XBOX_SERIES_X_PRODUCT_ID,
    title: 'Microsoft Xbox Series X',
    closed: [
      [525, 4, 'CONFIRMED_SOLD'],
      [535, 5, 'CONFIRMED_SOLD'],
      [540, 6, 'DISAPPEARED'],
      [545, 5, 'CONFIRMED_SOLD'],
      [550, 7, 'DISAPPEARED'],
      [560, 9, 'CONFIRMED_SOLD'],
      [580, 14, 'DISAPPEARED'],
      [600, 20, 'DISAPPEARED'],
    ],
    activePrices: [548, 558, 568],
  },
]

/** Synthetic AU lifecycle history so Flip / hunt board work before eBay polling. */
export function seedV0SellSpeedFixtures() {
  clearLifecycleStore()

  // Keep all closed outcomes inside a rolling ~28d window so liquidity scores stay valid
  const day = 24 * 60 * 60 * 1000
  const now = Date.now()

  const lifecycles: ListingLifecycle[] = []
  const observations: ListingObservation[] = []

  SPECS.forEach((spec) => {
    let offset = 0
    for (const [price, days, outcome] of spec.closed) {
      // End ~1–24 days ago; start = end - duration
      const endMs = now - (2 + offset * 2) * day
      const startMs = endMs - days * day
      const row = life(
        spec.productId,
        `${spec.productId}-${offset}`,
        price,
        days,
        outcome,
        startMs,
      )
      lifecycles.push(row)
      observations.push(...obsFromLife(spec.title, row))
      offset += 1
    }
    for (const price of spec.activePrices) {
      const startMs = now - (1 + offset) * day
      const row = life(
        spec.productId,
        `${spec.productId}-a${offset}`,
        price,
        null,
        'ACTIVE',
        startMs,
      )
      lifecycles.push(row)
      observations.push(...obsFromLife(spec.title, row))
      offset += 1
    }
  })

  saveObservations(observations)
  saveLifecycles(lifecycles)
}

/** @deprecated use seedV0SellSpeedFixtures */
export function seedQuest3SellSpeedFixtures() {
  seedV0SellSpeedFixtures()
}

function life(
  productId: string,
  id: string,
  price: number,
  days: number | null,
  outcome: ListingLifecycle['outcome'],
  startMs: number,
): ListingLifecycle {
  const firstSeenAt = new Date(startMs).toISOString()
  const outcomeAt =
    days == null ? null : new Date(startMs + days * 24 * 60 * 60 * 1000).toISOString()

  return {
    source: 'fixture',
    externalId: id,
    productId,
    firstSeenAt,
    lastSeenAt: outcomeAt ?? firstSeenAt,
    firstPrice: price,
    lastPrice: price,
    minPrice: price,
    maxPrice: price,
    observationCount: days == null ? 1 : 2,
    outcome,
    outcomeConfidence: outcome === 'CONFIRMED_SOLD' ? 'HIGH' : 'MEDIUM',
    outcomeAt,
    durationHours: days == null ? null : days * 24,
    confirmedSalePrice: outcome === 'CONFIRMED_SOLD' ? price : null,
  }
}

function obsFromLife(title: string, l: ListingLifecycle): ListingObservation[] {
  const first: ListingObservation = {
    source: 'fixture',
    externalId: l.externalId,
    productId: l.productId,
    title,
    price: l.firstPrice,
    currency: 'AUD',
    condition: 'used_good',
    availability: 'AVAILABLE',
    estimatedSoldQuantity: l.outcome === 'CONFIRMED_SOLD' ? 0 : null,
    estimatedAvailableQuantity: 1,
    itemCreatedAt: l.firstSeenAt,
    itemEndAt: null,
    observedAt: l.firstSeenAt,
    url: null,
  }

  if (l.outcome === 'ACTIVE' || l.outcomeAt == null) {
    return [first]
  }

  const last: ListingObservation = {
    ...first,
    price: l.lastPrice,
    availability:
      l.outcome === 'CONFIRMED_SOLD' || l.outcome === 'DISAPPEARED'
        ? 'UNAVAILABLE'
        : 'AVAILABLE',
    estimatedSoldQuantity: l.outcome === 'CONFIRMED_SOLD' ? 1 : null,
    estimatedAvailableQuantity: l.outcome === 'CONFIRMED_SOLD' ? 0 : 1,
    observedAt: l.outcomeAt,
  }
  return [first, last]
}
