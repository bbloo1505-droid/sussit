import type { ProductCategory } from '@/types/domain'

/**
 * Curated Marketplace / Gumtree / eBay AU search playbooks.
 * Guide max-buy is directional — live hunt board Max Buy wins when scored.
 */
export type FlipSearchSuggestion = {
  label: string
  searchQuery: string
  /** Soft ceiling while hunting — not a computed Max Buy */
  guideMaxBuy: number
  why: string
}

export type FlipCategoryPlaybook = {
  category: ProductCategory
  title: string
  blurb: string
  searches: FlipSearchSuggestion[]
}

export const FLIP_CATEGORY_PLAYBOOKS: FlipCategoryPlaybook[] = [
  {
    category: 'phone',
    title: 'Phones',
    blurb: 'High volume on Marketplace — watch storage and battery health.',
    searches: [
      {
        label: 'iPhone 14 128GB',
        searchQuery: 'iPhone 14 128GB',
        guideMaxBuy: 480,
        why: 'Liquid AU demand; avoid locked / poor battery.',
      },
      {
        label: 'iPhone 15 128GB',
        searchQuery: 'iPhone 15 128GB -Pro -Max -Plus',
        guideMaxBuy: 620,
        why: 'Strong resale; exclude Pro/Max siblings in search.',
      },
      {
        label: 'Galaxy S24',
        searchQuery: 'Galaxy S24 128GB -Ultra -FE -case',
        guideMaxBuy: 520,
        why: 'Steady Android comps; confirm unlock status.',
      },
      {
        label: 'Pixel 8',
        searchQuery: 'Pixel 8 128GB -Pro -case',
        guideMaxBuy: 380,
        why: 'Clearer comps than vague “Pixel” searches.',
      },
    ],
  },
  {
    category: 'console',
    title: 'Consoles',
    blurb: 'Fast movers when Disc/Digital and Slim/Pro are clear.',
    searches: [
      {
        label: 'Switch OLED',
        searchQuery: 'Switch OLED console -Lite',
        guideMaxBuy: 280,
        why: 'Reliable flips; dock + Joy-Cons preferred.',
      },
      {
        label: 'PS5 Disc',
        searchQuery: 'PS5 Disc console -Digital -Slim -Pro -stand',
        guideMaxBuy: 480,
        why: 'Avoid Slim/Pro mix-ups; controller included helps.',
      },
      {
        label: 'Xbox Series X',
        searchQuery: 'Xbox Series X console -S -controller',
        guideMaxBuy: 500,
        why: 'Series S is a different SKU — keep it out.',
      },
      {
        label: 'Switch Lite',
        searchQuery: 'Switch Lite -OLED',
        guideMaxBuy: 140,
        why: 'Lower ticket, still liquid if clean.',
      },
    ],
  },
  {
    category: 'vr_headset',
    title: 'VR headsets',
    blurb: 'Thin AU inventory — only buy full headset + controllers.',
    searches: [
      {
        label: 'Quest 3 512GB',
        searchQuery: 'Quest 3 512GB headset -3S -strap -case',
        guideMaxBuy: 620,
        why: 'Flagship storage; reject strap-only noise.',
      },
      {
        label: 'Quest 3S',
        searchQuery: 'Quest 3S 128GB headset -strap',
        guideMaxBuy: 380,
        why: 'Cheaper entry; confirm both controllers.',
      },
      {
        label: 'Quest 2',
        searchQuery: 'Quest 2 128GB headset -3 -3S -Pro',
        guideMaxBuy: 220,
        why: 'Only when priced to clear fast.',
      },
    ],
  },
  {
    category: 'audio',
    title: 'Audio',
    blurb: 'Small and easy to ship — demand full sets only.',
    searches: [
      {
        label: 'AirPods Pro 2',
        searchQuery: 'AirPods Pro 2 -single -replacement -left -right',
        guideMaxBuy: 160,
        why: 'Full set + case; reject single buds.',
      },
      {
        label: 'Sony WH-1000XM5',
        searchQuery: 'WH-1000XM5 -earpad -cushion',
        guideMaxBuy: 220,
        why: 'Strong brand recognition on Marketplace.',
      },
    ],
  },
  {
    category: 'laptop',
    title: 'Laptops',
    blurb: 'Specs must match — RAM/SSD/chip before you bid.',
    searches: [
      {
        label: 'MacBook Air M2',
        searchQuery: 'MacBook Air M2 256GB -Pro -case',
        guideMaxBuy: 850,
        why: 'Liquid Apple SKU; confirm 8/256 vs higher configs.',
      },
      {
        label: 'ThinkPad T14',
        searchQuery: 'ThinkPad T14 -parts -charger',
        guideMaxBuy: 420,
        why: 'Business laptops flip if battery is healthy.',
      },
    ],
  },
  {
    category: 'tablet',
    title: 'Tablets',
    blurb: 'Storage and cellular vs Wi‑Fi change the comps.',
    searches: [
      {
        label: 'iPad Air M2',
        searchQuery: 'iPad Air M2 128GB -Pro -case -keyboard',
        guideMaxBuy: 650,
        why: 'Exclude Pencil/keyboard accessory listings.',
      },
    ],
  },
  {
    category: 'wearable',
    title: 'Wearables',
    blurb: 'Size + GPS/Cellular matter — ask before you buy.',
    searches: [
      {
        label: 'Apple Watch Series 9',
        searchQuery: 'Apple Watch Series 9 45mm GPS -SE -Ultra -band',
        guideMaxBuy: 320,
        why: '45mm GPS is the liquid mid SKU.',
      },
    ],
  },
  {
    category: 'power_tool',
    title: 'Power tools',
    blurb: 'Kits with batteries flip better than bare tools.',
    searches: [
      {
        label: 'Makita 18V impact',
        searchQuery: 'Makita DTD172 18V -battery -charger',
        guideMaxBuy: 140,
        why: 'Or hunt kits with 2× batteries for more margin.',
      },
      {
        label: 'DeWalt impact kit',
        searchQuery: 'DeWalt 18V impact kit battery',
        guideMaxBuy: 160,
        why: 'Bundled packs move faster than tool-only.',
      },
    ],
  },
  {
    category: 'camera',
    title: 'Cameras',
    blurb: 'Body vs kit and shutter count decide the deal.',
    searches: [
      {
        label: 'Sony A7 III body',
        searchQuery: 'Sony A7 III body -lens -kit',
        guideMaxBuy: 1100,
        why: 'Body-only comps; ask shutter count.',
      },
      {
        label: 'Canon EOS R6',
        searchQuery: 'Canon EOS R6 body -lens',
        guideMaxBuy: 1600,
        why: 'Higher ticket — only with clear photos + shutter.',
      },
    ],
  },
]

export const FLIP_CATEGORY_OPTIONS: Array<{
  id: ProductCategory | 'all'
  label: string
}> = [
  { id: 'all', label: 'All' },
  { id: 'phone', label: 'Phones' },
  { id: 'console', label: 'Consoles' },
  { id: 'vr_headset', label: 'VR' },
  { id: 'audio', label: 'Audio' },
  { id: 'laptop', label: 'Laptops' },
  { id: 'tablet', label: 'Tablets' },
  { id: 'wearable', label: 'Watches' },
  { id: 'power_tool', label: 'Tools' },
  { id: 'camera', label: 'Cameras' },
]

export function playbooksForCategories(
  categories: Array<ProductCategory | 'all'>,
): FlipCategoryPlaybook[] {
  if (categories.includes('all') || categories.length === 0) {
    return FLIP_CATEGORY_PLAYBOOKS
  }
  const set = new Set(categories)
  return FLIP_CATEGORY_PLAYBOOKS.filter((p) => set.has(p.category))
}
