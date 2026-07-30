import { HUNT_CATALOG } from '@/lib/hunt/catalog'
import { playbooksForCategories } from '@/lib/hunt/flipPlaybooks'
import { createPricingProvider } from '@/lib/pricing/createPricingProvider'
import { assessComparables } from '@/lib/valuation/matchComparable'
import { calculateMarketRange } from '@/lib/valuation/calculateMarketRange'
import { calculateConfidence } from '@/lib/valuation/calculateConfidence'
import { calculateMaxBuy } from '@/lib/valuation/calculateMaxBuy'
import { calculateFlipScore } from '@/lib/sellSpeed/calculateFlipScore'
import { seedV0SellSpeedFixtures } from '@/lib/sellSpeed/seedQuestLifecycle'
import { loadLifecycles } from '@/lib/sellSpeed/lifecycleStore'
import type { HuntBoard, HuntBoardRow, HuntRules } from '@/types/hunt'
import type { IdentifiedProduct, ProductCategory } from '@/types/domain'

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

function categorySelected(
  rules: HuntRules,
  category: ProductCategory,
): boolean {
  const cats = rules.categories ?? ['all']
  if (cats.length === 0 || cats.includes('all')) return true
  return cats.includes(category)
}

function normQuery(q: string): string {
  return q.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export async function buildHuntBoard(rules: HuntRules): Promise<HuntBoard> {
  ensureSeed()
  const pricing = createPricingProvider()
  const rows: HuntBoardRow[] = []

  const catalog = HUNT_CATALOG.filter((item) =>
    categorySelected(rules, item.category),
  )

  for (const item of catalog) {
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
        category: item.category,
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
    } else if (flip.sellSpeed.evidence === 'INSUFFICIENT') {
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
      category: item.category,
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

  const huntList = opportunities.slice(0, 8).map((r, i) => ({
    rank: i + 1,
    searchQuery: r.searchQuery,
    label: r.label,
    maxBuy: r.maxBuy,
    category: r.category,
  }))

  const scoredByQuery = new Map<string, HuntBoardRow>()
  for (const row of opportunities) {
    scoredByQuery.set(normQuery(row.searchQuery), row)
    scoredByQuery.set(normQuery(row.label), row)
  }

  const categorySuggestions = playbooksForCategories(
    rules.categories ?? ['all'],
  ).map((book) => ({
    category: book.category,
    title: book.title,
    blurb: book.blurb,
    searches: book.searches
      .map((s) => {
        const scored =
          scoredByQuery.get(normQuery(s.searchQuery)) ??
          scoredByQuery.get(normQuery(s.label))
        const maxBuy = scored
          ? Math.min(scored.maxBuy, rules.budget)
          : Math.min(s.guideMaxBuy, rules.budget)
        return {
          label: s.label,
          searchQuery: s.searchQuery,
          maxBuy,
          source: scored ? ('scored' as const) : ('guide' as const),
          why: s.why,
        }
      })
      .filter((s) => s.maxBuy > 0)
      .sort((a, b) => b.maxBuy - a.maxBuy),
  })).filter((book) => book.searches.length > 0)

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
    categorySuggestions,
    falling,
    generatedAt: new Date().toISOString(),
    disclaimer:
      'Search suggestions are category playbooks. Scored Max Buy uses live/fixture AU asking comps — not eBay sold prices. Guide prices are directional until that SKU clears the hunt board.',
  }
}
