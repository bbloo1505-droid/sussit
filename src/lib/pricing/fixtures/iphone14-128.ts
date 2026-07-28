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
    location: 'Melbourne, VIC',
    url: null,
    includedAccessories: ['charger'],
    ...extras,
  }
}

export const iphone14128Fixtures: ComparableListing[] = [
  row('ip-1', 'Apple iPhone 14 128GB Midnight unlocked', 520),
  row('ip-2', 'iPhone 14 128GB used excellent', 530),
  row('ip-3', 'Apple iPhone 14 128GB', 540),
  row('ip-4', 'iPhone 14 128GB Blue', 545),
  row('ip-5', 'Apple iPhone 14 128GB like new', 550, {
    condition: 'used_like_new',
  }),
  row('ip-6', 'iPhone 14 128GB unlocked', 555),
  row('ip-7', 'Apple iPhone 14 128GB', 560),
  row('ip-8', 'iPhone 14 128GB + case', 575),
  row('ip-9', 'iPhone 14 Pro 128GB', 780, {
    title: 'Apple iPhone 14 Pro 128GB',
  }),
  row('ip-10', 'iPhone 14 128GB battery health 72%', 390, {
    title: 'Apple iPhone 14 128GB poor battery',
    condition: 'used_fair',
  }),
]
