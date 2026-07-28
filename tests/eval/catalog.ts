import type { IdentifiedProduct, ProductCategory, ProductCondition } from '@/types/domain'

export type CatalogSku = {
  key: string
  category: ProductCategory
  brand: string
  model: string
  variant: string | null
  storageGb: number | null
  family: string
  /** Typical used AU asking mid for synthetic comps */
  typicalAsk: number
  neighbours: string[]
  wrongGen: string[]
}

export const EVAL_CATALOG: CatalogSku[] = [
  {
    key: 'quest-2',
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 2',
    variant: '128GB',
    storageGb: 128,
    family: 'Quest',
    typicalAsk: 280,
    neighbours: ['quest-3', 'quest-3s'],
    wrongGen: ['quest-3', 'quest-3s'],
  },
  {
    key: 'quest-3',
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '512GB',
    storageGb: 512,
    family: 'Quest',
    typicalAsk: 750,
    neighbours: ['quest-3s', 'quest-2'],
    wrongGen: ['quest-2'],
  },
  {
    key: 'quest-3-128',
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '128GB',
    storageGb: 128,
    family: 'Quest',
    typicalAsk: 620,
    neighbours: ['quest-3', 'quest-3s'],
    wrongGen: ['quest-2'],
  },
  {
    key: 'quest-3s',
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3S',
    variant: '128GB',
    storageGb: 128,
    family: 'Quest',
    typicalAsk: 450,
    neighbours: ['quest-3', 'quest-2'],
    wrongGen: ['quest-2'],
  },
  {
    key: 'ps5',
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Disc',
    storageGb: null,
    family: 'PlayStation',
    typicalAsk: 550,
    neighbours: ['ps5-slim', 'ps5-pro', 'ps5-digital'],
    wrongGen: [],
  },
  {
    key: 'ps5-slim',
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5 Slim',
    variant: 'Disc',
    storageGb: null,
    family: 'PlayStation',
    typicalAsk: 580,
    neighbours: ['ps5', 'ps5-pro', 'ps5-digital'],
    wrongGen: [],
  },
  {
    key: 'ps5-pro',
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5 Pro',
    variant: null,
    storageGb: null,
    family: 'PlayStation',
    typicalAsk: 850,
    neighbours: ['ps5', 'ps5-slim'],
    wrongGen: [],
  },
  {
    key: 'ps5-digital',
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Digital',
    storageGb: null,
    family: 'PlayStation',
    typicalAsk: 480,
    neighbours: ['ps5', 'ps5-slim'],
    wrongGen: [],
  },
  {
    key: 'switch',
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch',
    variant: null,
    storageGb: null,
    family: 'Switch',
    typicalAsk: 280,
    neighbours: ['switch-oled', 'switch-lite'],
    wrongGen: [],
  },
  {
    key: 'switch-oled',
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch OLED',
    variant: null,
    storageGb: null,
    family: 'Switch',
    typicalAsk: 380,
    neighbours: ['switch', 'switch-lite'],
    wrongGen: [],
  },
  {
    key: 'switch-lite',
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch Lite',
    variant: null,
    storageGb: null,
    family: 'Switch',
    typicalAsk: 180,
    neighbours: ['switch', 'switch-oled'],
    wrongGen: [],
  },
  {
    key: 'iphone-13-128',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 13',
    variant: '128GB',
    storageGb: 128,
    family: 'iPhone',
    typicalAsk: 420,
    neighbours: ['iphone-14-128', 'iphone-15-128'],
    wrongGen: [],
  },
  {
    key: 'iphone-14-128',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14',
    variant: '128GB',
    storageGb: 128,
    family: 'iPhone',
    typicalAsk: 520,
    neighbours: ['iphone-13-128', 'iphone-15-128', 'iphone-15-pro'],
    wrongGen: [],
  },
  {
    key: 'iphone-15-128',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15',
    variant: '128GB',
    storageGb: 128,
    family: 'iPhone',
    typicalAsk: 720,
    neighbours: ['iphone-14-128', 'iphone-15-pro', 'iphone-15-pro-max'],
    wrongGen: [],
  },
  {
    key: 'iphone-15-pro',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    variant: '256GB',
    storageGb: 256,
    family: 'iPhone',
    typicalAsk: 980,
    neighbours: ['iphone-15-128', 'iphone-15-pro-max', 'iphone-16'],
    wrongGen: [],
  },
  {
    key: 'iphone-15-pro-max',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    variant: '256GB',
    storageGb: 256,
    family: 'iPhone',
    typicalAsk: 1150,
    neighbours: ['iphone-15-pro', 'iphone-16'],
    wrongGen: [],
  },
  {
    key: 'iphone-16',
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 16',
    variant: '128GB',
    storageGb: 128,
    family: 'iPhone',
    typicalAsk: 980,
    neighbours: ['iphone-15-128', 'iphone-15-pro'],
    wrongGen: [],
  },
]

export function skuToProduct(
  sku: CatalogSku,
  overrides: Partial<IdentifiedProduct> = {},
): IdentifiedProduct {
  return {
    category: sku.category,
    brand: sku.brand,
    model: sku.model,
    variant: sku.variant,
    askingPrice: sku.typicalAsk,
    currency: 'AUD',
    condition: 'used_good',
    location: 'Melbourne',
    includedAccessories:
      sku.category === 'vr_headset'
        ? ['left controller', 'right controller']
        : [],
    missingInformation: [],
    sellerClaims: [],
    visibleIssues: [],
    identificationConfidence: 0.92,
    ...overrides,
  }
}

export function findSku(key: string): CatalogSku {
  const sku = EVAL_CATALOG.find((s) => s.key === key)
  if (!sku) throw new Error(`Unknown catalog sku: ${key}`)
  return sku
}

export const CONDITIONS: ProductCondition[] = [
  'used_good',
  'used_like_new',
  'used_fair',
  'unknown',
]
