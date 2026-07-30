/** Flip hunt rules + board types. Max Buy is computed in code, never by an LLM. */

import type { ProductCategory } from '@/types/domain'
import type { SellSpeedLabel } from '@/types/sellSpeed'

export type HuntRules = {
  budget: number
  minProfit: number
  minRoiPercent: number
  maxSellDays: number
  /** UI only until Marketplace geo links exist */
  distanceKm: number
  /**
   * Categories to emphasise on the hunt board / search suggestions.
   * Empty or includes `all` → show every playbook category.
   */
  categories: Array<ProductCategory | 'all'>
}

export type BuyActionVerdict = 'BUY' | 'NEGOTIATE' | 'PASS' | 'INSUFFICIENT_DATA'

export type MaxBuyResult = {
  maxBuy: number
  expectedResale: number
  netAfterFees: number
  feeBufferPercent: number
  minProfit: number
  minRoiPercent: number
  constrainedBy: 'PROFIT' | 'ROI'
  negotiateCeiling: number
  /** Present when an asking price was provided */
  actionVerdict: BuyActionVerdict | null
}

export type HuntCatalogItem = {
  productId: string
  label: string
  searchQuery: string
  category: ProductCategory
  brand: string
  model: string
  variant: string | null
}

export type HuntBoardRow = {
  productId: string
  label: string
  searchQuery: string
  category: ProductCategory
  maxBuy: number
  typicalSaleLow: number
  typicalSaleHigh: number
  estProfit: number
  sellThroughLabel: SellSpeedLabel
  flipScore: number | null
  evidenceNote: string
  excludedReason: string | null
}

export type HuntBoard = {
  rules: HuntRules
  opportunities: HuntBoardRow[]
  /** Ranked search list that fits budget + rules */
  huntList: Array<{
    rank: number
    searchQuery: string
    label: string
    maxBuy: number
    category: ProductCategory
  }>
  /** Category playbooks with guide prices (and scored Max Buy when available) */
  categorySuggestions: Array<{
    category: ProductCategory
    title: string
    blurb: string
    searches: Array<{
      label: string
      searchQuery: string
      maxBuy: number
      source: 'scored' | 'guide'
      why: string
    }>
  }>
  falling: HuntBoardRow[]
  generatedAt: string
  disclaimer: string
}

export const DEFAULT_HUNT_RULES: HuntRules = {
  budget: 1000,
  minProfit: 100,
  minRoiPercent: 25,
  maxSellDays: 14,
  distanceKm: 25,
  categories: ['all'],
}

/** Platform + shipping drag placeholder until calibrated */
export const FEE_BUFFER_PERCENT = 0.12
