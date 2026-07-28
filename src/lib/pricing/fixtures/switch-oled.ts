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
    includedAccessories: ['dock', 'joy-cons'],
    ...extras,
  }
}

export const switchOledFixtures: ComparableListing[] = [
  row('sw-1', 'Nintendo Switch OLED white console', 265),
  row('sw-2', 'Switch OLED used — full kit', 270),
  row('sw-3', 'Nintendo Switch OLED', 275),
  row('sw-4', 'Switch OLED console + dock', 280),
  row('sw-5', 'Nintendo Switch OLED nearly new', 285, {
    condition: 'used_like_new',
  }),
  row('sw-6', 'Switch OLED black', 288),
  row('sw-7', 'Nintendo Switch OLED', 295),
  row('sw-8', 'Switch OLED with games', 310, {
    title: 'Nintendo Switch OLED + Mario Kart bundle',
  }),
  row('sw-9', 'Broken Switch OLED for parts', 90, {
    condition: 'for_parts',
    title: 'Nintendo Switch OLED for parts cracked screen',
  }),
]
