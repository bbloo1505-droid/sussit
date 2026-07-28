import { HUNT_CATALOG } from '@/lib/hunt/catalog'
import { createPricingProvider } from '@/lib/pricing/createPricingProvider'
import { assessComparables } from '@/lib/valuation/matchComparable'
import { calculateMarketRange } from '@/lib/valuation/calculateMarketRange'
import { calculateConfidence } from '@/lib/valuation/calculateConfidence'
import { calculateMaxBuy } from '@/lib/valuation/calculateMaxBuy'
import { calculateFlipScore } from '@/lib/sellSpeed/calculateFlipScore'
import { seedV0SellSpeedFixtures } from '@/lib/sellSpeed/seedQuestLifecycle'
import { loadLifecycles } from '@/lib/sellSpeed/lifecycleStore'
import type { HuntBoard, HuntBoardRow, HuntRules } from '@/types/hunt'
import type { IdentifiedProduct } from '@/types/domain'

function ensureSeed() {
  if (loadLifecycles().length > 0) return
  seedV0SellSpeedFixtures()
}

function asProduct(item: (typeof HUNT_CATALOG)[number]): IdentifiedProduct {
  return {
    category: item.category,
    brand: item.brand,
    model: item.model,
    variant: item.variant,
    askingPrice: 0,
    currency: 'AUD',
    condition: 'used_good',
    location: null,
    includedAccessories: [],
    missingInformation: [],
    sellerClaims: [],
    visibleIssues: [],
    identificationConfidence: 0.95,
  }
}

function sellThroughText(label: HuntBoardRow['sellThroughLabel']): string {
  switch (label) {
    case 'VERY_FAST':
      return 'Very high'
    case 'FAST':
      return 'High'
    case 'MODERATE':
      return 'Medium'
    case 'SLOW':
      return 'Low'
    default:
      return 'Unknown'
  }
}

export { sellThroughText }

export async function buildHuntBoard(rules: HuntRules): Promise<HuntBoard> {
  ensureSeed()
  const pricing = createPricingProvider()
  const rows: HuntBoardRow[] = []

  for (const item of HUNT_CATALOG) {
    const product = asProduct(item)
    const listings = await pricing.search(product)
    const assessments = assessComparables(product, listings)
    const market = calculateMarketRange(assessments)
    const confidence = calculateConfidence({ product, assessments, market })

    if (!market || confidence.level === 'INSUFFICIENT') {
      rows.push({
        productId: item.productId,
        label: item.label,
        searchQuery: item.searchQuery,
        maxBuy: 0,
        typicalSaleLow: 0,
        typicalSaleHigh: 0,
        estProfit: 0,
        sellThroughLabel: 'UNKNOWN',
        flipScore: null,
        evidenceNote: 'Insufficient asking comps',
        excludedReason: 'INSUFFICIENT_DATA',
      })
      continue
    }

    const targetResale = Math.round((market.median + market.p75) / 2)
    const maxBuy = calculateMaxBuy({
      expectedResale: targetResale,
      rules,
    })

    const flip = calculateFlipScore({
      productId: item.productId,
      buyPrice: maxBuy.maxBuy,
      market,
      confidence,
      rules,
      askingPrice: maxBuy.maxBuy,
    })

    let excludedReason: string | null = null
    if (maxBuy.maxBuy <= 0) excludedReason = 'MAX_BUY_NOT_VIABLE'
    else if (maxBuy.maxBuy > rules.budget) excludedReason = 'OVER_BUDGET'
    else if (
      flip.sellSpeed.estimatedDaysLow != null &&
      flip.sellSpeed.estimatedDaysLow > rules.maxSellDays
    ) {
      excludedReason = 'TOO_SLOW'
    }     else if (flip.sellSpeed.evidence === 'INSUFFICIENT') {
      excludedReason = 'INSUFFICIENT_SPEED_DATA'
    }

    const estProfit = Math.round(targetResale - maxBuy.maxBuy)
    if (estProfit < rules.minProfit) {
      excludedReason = excludedReason ?? 'BELOW_MIN_PROFIT'
    }

    const roi =
      maxBuy.maxBuy > 0
        ? ((targetResale - maxBuy.maxBuy) / maxBuy.maxBuy) * 100
        : 0
    if (roi < rules.minRoiPercent) {
      excludedReason = excludedReason ?? 'BELOW_MIN_ROI'
    }

    rows.push({
      productId: item.productId,
      label: item.label,
      searchQuery: item.searchQuery,
      maxBuy: maxBuy.maxBuy,
      typicalSaleLow: market.median,
      typicalSaleHigh: Math.max(market.p75, market.median),
      estProfit,
      sellThroughLabel: flip.sellSpeed.label,
      flipScore: flip.flipScore,
      evidenceNote:
        flip.sellSpeed.evidence === 'CONFIRMED_SALES'
          ? 'Comps + confirmed sale signals'
          : 'Asking comps + observed movement',
      excludedReason,
    })
  }

  const opportunities = rows
    .filter((r) => r.excludedReason == null && r.flipScore != null)
    .sort((a, b) => (b.flipScore ?? 0) - (a.flipScore ?? 0))

  const huntList = opportunities.slice(0, 5).map((r, i) => ({
    rank: i + 1,
    searchQuery: r.searchQuery,
    label: r.label,
    maxBuy: r.maxBuy,
  }))

  // Falling / avoid: slow sell-through with elevated active supply
  const falling = rows
    .filter((r) => {
      if (r.sellThroughLabel !== 'SLOW' && r.sellThroughLabel !== 'MODERATE') {
        return false
      }
      const active = loadLifecycles().filter(
        (l) => l.productId === r.productId && l.outcome === 'ACTIVE',
      ).length
      return active >= 3 && r.flipScore != null
    })
    .sort((a, b) => (a.flipScore ?? 0) - (b.flipScore ?? 0))
    .slice(0, 3)

  return {
    rules,
    opportunities,
    huntList,
    falling,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Typical sale uses current AU asking comps — not eBay sold prices. Sell-through is observed listing movement, not Terapeak sell-through %.',
  }
}
