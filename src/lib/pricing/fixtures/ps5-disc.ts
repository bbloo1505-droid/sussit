import type { ComparableListing } from '@/types/domain'

function row(
  id: string,
  title: string,
  price: number,
  extras: Partial<ComparableListing> = {},
): ComparableListing {
  return {
    id,
    source: 'fixture',
    externalId: id,
    title,
    price,
    currency: 'AUD',
    condition: 'used_good',
    shipping: 0,
    location: 'Brisbane, QLD',
    url: null,
    includedAccessories: ['dualsense', 'power cable', 'hdmi'],
    ...extras,
  }
}

export const ps5DiscFixtures: ComparableListing[] = [
  row('ps-1', 'Sony PlayStation 5 Disc console', 480),
  row('ps-2', 'PS5 Disc edition used', 490),
  row('ps-3', 'PlayStation 5 Disc with controller', 500),
  row('ps-4', 'Sony PS5 Disc console', 505),
  row('ps-5', 'PlayStation 5 Disc like new', 510, {
    condition: 'used_like_new',
  }),
  row('ps-6', 'PS5 Disc edition', 515),
  row('ps-7', 'Sony PlayStation 5 Disc', 520),
  row('ps-8', 'PS5 Disc + 2 controllers', 540),
  row('ps-9', 'PS5 Digital Edition', 420, {
    title: 'Sony PlayStation 5 Digital Edition',
  }),
]
