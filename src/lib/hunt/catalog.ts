import {
  IPHONE14_128_PRODUCT_ID,
  PS5_DISC_PRODUCT_ID,
  QUEST_PRODUCT_ID,
  SWITCH_OLED_PRODUCT_ID,
  XBOX_SERIES_X_PRODUCT_ID,
} from '@/lib/sellSpeed/seedQuestLifecycle'
import type { HuntCatalogItem } from '@/types/hunt'

/** V0 hunt SKUs with fixture comps + seeded lifecycle data */
export const HUNT_CATALOG: HuntCatalogItem[] = [
  {
    productId: QUEST_PRODUCT_ID,
    label: 'Quest 3 512GB',
    searchQuery: 'Quest 3 512GB',
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '512GB',
  },
  {
    productId: SWITCH_OLED_PRODUCT_ID,
    label: 'Switch OLED',
    searchQuery: 'Switch OLED',
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch OLED',
    variant: null,
  },
  {
    productId: IPHONE14_128_PRODUCT_ID,
    label: 'iPhone 14 128GB',
    searchQuery: 'iPhone 14 128',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14',
    variant: '128GB',
  },
  {
    productId: PS5_DISC_PRODUCT_ID,
    label: 'PS5 Disc',
    searchQuery: 'PS5 Disc',
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Disc',
  },
  {
    productId: XBOX_SERIES_X_PRODUCT_ID,
    label: 'Xbox Series X',
    searchQuery: 'Xbox Series X',
    category: 'console',
    brand: 'Microsoft',
    model: 'Xbox Series X',
    variant: null,
  },
]
