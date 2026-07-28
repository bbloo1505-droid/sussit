import { TestPricingProvider } from '@/lib/pricing/TestPricingProvider'
import { runAnalysis } from '@/lib/valuation/runAnalysis'
import { calculateMaxBuy } from '@/lib/valuation/calculateMaxBuy'
import { DEFAULT_HUNT_RULES } from '@/types/hunt'
import { HUNT_CATALOG } from '@/lib/hunt/catalog'
import { seedV0SellSpeedFixtures } from '@/lib/sellSpeed/seedQuestLifecycle'
import { clearLifecycleStore } from '@/lib/sellSpeed/lifecycleStore'
import type { IdentifiedProduct } from '@/types/domain'

type CaseResult = {
  label: string
  ok: boolean
  details: string
}

function productFromCatalog(
  item: (typeof HUNT_CATALOG)[number],
  askingPrice: number,
): IdentifiedProduct {
  return {
    category: item.category,
    brand: item.brand,
    model: item.model,
    variant: item.variant,
    askingPrice,
    currency: 'AUD',
    condition: 'used_good',
    location: 'Sydney',
    includedAccessories: [],
    missingInformation: [],
    sellerClaims: [],
    visibleIssues: [],
    identificationConfidence: 0.95,
  }
}

/**
 * Offline accuracy gate: every V0 hunt SKU must produce usable market + Max Buy.
 * Run: npm run test:benchmark
 */
export async function runBenchmark(): Promise<{
  passed: number
  failed: number
  results: CaseResult[]
}> {
  clearLifecycleStore()
  seedV0SellSpeedFixtures()
  const pricing = new TestPricingProvider()
  const results: CaseResult[] = []

  for (const item of HUNT_CATALOG) {
    const underAsk = productFromCatalog(item, 50)
    // Use a mid asking so deal math runs; Max Buy is independent of asking for board
    const analysis = await runAnalysis({
      product: productFromCatalog(item, 9999),
      pricing,
    })

    if (!analysis.market || analysis.market.sampleCount < 5) {
      results.push({
        label: item.label,
        ok: false,
        details: `Insufficient comps (n=${analysis.market?.sampleCount ?? 0})`,
      })
      continue
    }

    const target = Math.round(
      (analysis.market.median + analysis.market.p75) / 2,
    )
    const maxBuy = calculateMaxBuy({
      expectedResale: target,
      rules: DEFAULT_HUNT_RULES,
      askingPrice: underAsk.askingPrice,
    })

    if (maxBuy.maxBuy <= 0) {
      results.push({
        label: item.label,
        ok: false,
        details: `Max Buy not viable at resale ${target}`,
      })
      continue
    }

    const cheapAsk = Math.max(40, maxBuy.maxBuy - 40)
    const action = calculateMaxBuy({
      expectedResale: target,
      rules: DEFAULT_HUNT_RULES,
      askingPrice: cheapAsk,
    })

    if (action.actionVerdict !== 'BUY') {
      results.push({
        label: item.label,
        ok: false,
        details: `Expected BUY at ${cheapAsk}, got ${action.actionVerdict}`,
      })
      continue
    }

    results.push({
      label: item.label,
      ok: true,
      details: `n=${analysis.market.sampleCount} median=${analysis.market.median} maxBuy=${maxBuy.maxBuy} flip=${analysis.flip?.flipScore ?? '—'}`,
    })
  }

  const passed = results.filter((r) => r.ok).length
  const failed = results.length - passed
  return { passed, failed, results }
}
