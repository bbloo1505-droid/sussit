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
    location: 'Sydney, NSW',
    url: null,
    includedAccessories: ['controller', 'power cable', 'hdmi'],
    ...extras,
  }
}

export const xboxSeriesXFixtures: ComparableListing[] = [
  row('xsx-1', 'Xbox Series X console 1TB', 520),
  row('xsx-2', 'Microsoft Xbox Series X used', 530),
  row('xsx-3', 'Xbox Series X with controller', 540),
  row('xsx-4', 'Xbox Series X 1TB', 545),
  row('xsx-5', 'Microsoft Xbox Series X like new', 550, {
    condition: 'used_like_new',
  }),
  row('xsx-6', 'Xbox Series X console', 555),
  row('xsx-7', 'Xbox Series X', 560),
  row('xsx-8', 'Xbox Series X + 2 controllers', 580),
  row('xsx-9', 'Xbox Series S', 320, {
    title: 'Microsoft Xbox Series S 512GB',
  }),
]
