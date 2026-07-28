import { heuristicExtractFromText } from '../../../server/heuristicExtract.ts'
import { extractStorageGb } from '@/lib/intelligence/productGraph'
import { matchComparable } from '@/lib/valuation/matchComparable'
import { calculateMarketRange } from '@/lib/valuation/calculateMarketRange'
import { calculateDeal } from '@/lib/valuation/calculateDeal'
import { calculateConfidence } from '@/lib/valuation/calculateConfidence'
import { calculateFlipScore } from '@/lib/sellSpeed/calculateFlipScore'
import type { ComparableAssessment, ComparableListing } from '@/types/domain'
import type {
  CaseResult,
  IdentificationCase,
  LowInfoCase,
  MatchingCase,
  ValuationCase,
  VerdictCase,
  EbayReplayCase,
} from '../types.ts'

function fail(
  c: { id: string; suite: CaseResult['suite']; category: string; modelKey: string; description: string },
  reasons: string[],
  metrics?: CaseResult['metrics'],
): CaseResult {
  return {
    id: c.id,
    suite: c.suite,
    category: String(c.category),
    modelKey: c.modelKey,
    description: c.description,
    passed: false,
    severity: 'fail',
    reasons,
    metrics,
  }
}

function pass(
  c: { id: string; suite: CaseResult['suite']; category: string; modelKey: string; description: string },
  metrics?: CaseResult['metrics'],
): CaseResult {
  return {
    id: c.id,
    suite: c.suite,
    category: String(c.category),
    modelKey: c.modelKey,
    description: c.description,
    passed: true,
    severity: 'pass',
    reasons: [],
    metrics,
  }
}

export function evalIdentification(c: IdentificationCase): CaseResult {
  const got = heuristicExtractFromText(c.inputText)
  if (!got) {
    // Heuristic may not cover every spelling — warn not fail for exotic spellings
    if (/quest3|iphone1[3-6]|ps5|switch/i.test(c.inputText.replace(/\s+/g, ''))) {
      return fail(c, ['Heuristic returned null for recognizable product text'])
    }
    return {
      ...pass(c, { identified: false }),
      severity: 'warn',
      passed: true,
      reasons: ['Heuristic null — acceptable for sparse patterns'],
    }
  }

  const reasons: string[] = []
  if (got.category !== c.expected.category) {
    reasons.push(`category ${got.category} != ${c.expected.category}`)
  }
  if (got.brand?.toLowerCase() !== c.expected.brand.toLowerCase()) {
    // Meta vs Oculus soft
    if (
      !(
        c.expected.brand === 'Meta' &&
        /meta|oculus/i.test(got.brand ?? '')
      )
    ) {
      reasons.push(`brand ${got.brand} != ${c.expected.brand}`)
    }
  }
  const modelOk =
    got.model?.toLowerCase() === c.expected.model.toLowerCase() ||
    (c.expected.model === 'PlayStation 5' && /ps5|playstation 5/i.test(got.model ?? '')) ||
    (c.expected.model.includes('PlayStation 5') &&
      /ps5|playstation 5/i.test(got.model ?? ''))
  if (!modelOk) {
    reasons.push(`model ${got.model} != ${c.expected.model}`)
  }
  if (c.expected.variant && got.variant !== c.expected.variant) {
    // soft if storage still matches
    const gotGb = extractStorageGb(got.variant)
    if (gotGb !== c.expected.storageGb) {
      reasons.push(`variant ${got.variant} != ${c.expected.variant}`)
    }
  }
  if (c.expected.storageGb != null) {
    const gb =
      extractStorageGb(got.variant) ?? extractStorageGb(got.model) ?? null
    if (gb !== c.expected.storageGb) {
      reasons.push(`storage ${gb} != ${c.expected.storageGb}`)
    }
  }

  return reasons.length ? fail(c, reasons) : pass(c)
}

export function evalMatching(c: MatchingCase): CaseResult {
  const listing: ComparableListing = {
    id: c.id,
    source: 'fixture',
    externalId: c.id,
    title: c.candidate.title,
    price: c.candidate.price,
    currency: 'AUD',
    condition: c.candidate.condition,
    shipping: 0,
    location: 'AU',
    url: null,
    includedAccessories: c.candidate.includedAccessories ?? [],
  }
  const result = matchComparable(c.target, listing)
  const included = result.included

  const baseMetrics = {
    included,
    matchScore: result.matchScore,
    expectation: c.expectation,
    accessory: c.tags.includes('accessory'),
    wrongModel: c.tags.includes('wrong_model'),
  }

  if (c.expectation === 'AMBIGUOUS') {
    return pass(c, baseMetrics)
  }
  if (c.expectation === 'EXPECTED_INCLUDE' && !included) {
    return fail(c, [
      `Expected INCLUDE but excluded (${result.rejectionReason ?? result.reasons.at(-1)})`,
    ], baseMetrics)
  }
  if (c.expectation === 'EXPECTED_EXCLUDE' && included) {
    return fail(c, [
      `Expected EXCLUDE but included (score ${result.matchScore})`,
    ], baseMetrics)
  }
  return pass(c, baseMetrics)
}

export function evalValuation(c: ValuationCase): CaseResult {
  const toAssessments = (prices: number[]): ComparableAssessment[] =>
    prices.map((price, i) => ({
      comparable: {
        id: `${c.id}-${i}`,
        source: 'fixture' as const,
        externalId: String(i),
        title: `${c.target.brand} ${c.target.model} ${c.target.variant ?? ''}`.trim(),
        price,
        currency: 'AUD' as const,
        condition: 'used_good' as const,
        shipping: 0,
        location: 'AU',
        url: null,
        includedAccessories: c.target.includedAccessories,
      },
      included: true,
      matchScore: 90,
      rejectionReason: null,
      matchLabel: 'Strong match',
      reasons: ['eval'],
    }))

  const baseMarket = calculateMarketRange(toAssessments(c.prices))
  if (!baseMarket) return fail(c, ['No market from base prices'])

  const reasons: string[] = []
  if (c.asserts.minSample && baseMarket.sampleCount < c.asserts.minSample) {
    reasons.push(`sample ${baseMarket.sampleCount} < ${c.asserts.minSample}`)
  }
  if (c.asserts.medianMin != null && baseMarket.median < c.asserts.medianMin) {
    reasons.push(`median ${baseMarket.median} < ${c.asserts.medianMin}`)
  }
  if (c.asserts.medianMax != null && baseMarket.median > c.asserts.medianMax) {
    reasons.push(`median ${baseMarket.median} > ${c.asserts.medianMax}`)
  }
  if (
    c.asserts.maxDispersion != null &&
    baseMarket.priceDispersion > c.asserts.maxDispersion
  ) {
    reasons.push(
      `dispersion ${baseMarket.priceDispersion} > ${c.asserts.maxDispersion}`,
    )
  }

  if (c.outlierPrices?.length && c.asserts.outlierMedianShiftMax != null) {
    // Outliers are INCLUDED in this stress test to check algorithm robustness
    const withOutliers = calculateMarketRange(
      toAssessments([...c.prices, ...c.outlierPrices]),
    )
    if (!withOutliers) return fail(c, ['No market with outliers'])
    const shift =
      Math.abs(withOutliers.median - baseMarket.median) / baseMarket.median
    if (shift > c.asserts.outlierMedianShiftMax) {
      reasons.push(
        `outlier median shift ${(shift * 100).toFixed(1)}% > ${(c.asserts.outlierMedianShiftMax * 100).toFixed(0)}% (base ${baseMarket.median} → ${withOutliers.median})`,
      )
    }
  }

  return reasons.length
    ? fail(c, reasons, { median: baseMarket.median })
    : pass(c, { median: baseMarket.median })
}

const VERDICT_RANK: Record<string, number> = {
  'EXCEPTIONAL BUY': 5,
  'GOOD BUY': 4,
  FAIR: 3,
  OVERPRICED: 2,
  'INSUFFICIENT DATA': 1,
  'LIMITED MARKET DATA': 1,
}

export function evalVerdict(c: VerdictCase): CaseResult {
  const market = {
    median: c.marketMedian,
    p25: c.marketP25,
    p75: c.marketP75,
    sampleCount: c.sampleCount,
    priceDispersion: (c.marketP75 - c.marketP25) / c.marketMedian,
    askingLow: c.marketP25,
    askingHigh: c.marketP75,
  }

  const assessments: ComparableAssessment[] = Array.from(
    { length: c.sampleCount },
    (_, i) => ({
      comparable: {
        id: `${c.id}-c${i}`,
        source: 'fixture' as const,
        externalId: String(i),
        title: `${c.product.brand} ${c.product.model}`,
        price: c.marketMedian,
        currency: 'AUD' as const,
        condition: 'used_good' as const,
        shipping: 0,
        location: 'AU',
        url: null,
        includedAccessories: [],
      },
      included: true,
      matchScore: 92,
      rejectionReason: null,
      matchLabel: 'Strong match',
      reasons: [],
    }),
  )

  let prevRank = 99
  let prevDiff = -Infinity
  let prevDealScore = Infinity
  let prevFlip: number | null = null
  let prevProfitHigh = Infinity

  for (const ask of c.askingPrices) {
    const product = { ...c.product, askingPrice: ask }
    const confidence = calculateConfidence({
      product,
      assessments,
      market,
    })
    // Force usable confidence for monotonic deal check when comps exist
    const conf =
      confidence.level === 'INSUFFICIENT'
        ? { ...confidence, level: 'MEDIUM' as const }
        : confidence
    const deal = calculateDeal({ product, market, confidence: conf })
    const flip = calculateFlipScore({
      productId: `${c.product.brand}-${c.product.model}`.toLowerCase(),
      buyPrice: ask,
      market,
      confidence: conf,
      askingPrice: ask,
    })

    const rank = VERDICT_RANK[deal.verdictLabel] ?? 0
    if (rank > prevRank) {
      return fail(c, [
        `Ask $${ask} improved verdict to ${deal.verdictLabel} vs previous (higher price must not improve deal)`,
      ])
    }
    if (deal.differenceFromMedianPercent + 1e-9 < prevDiff) {
      return fail(c, [
        `Ask $${ask} improved differenceFromMedianPercent (${deal.differenceFromMedianPercent} < ${prevDiff})`,
      ])
    }
    if (
      deal.dealScore != null &&
      Number.isFinite(prevDealScore) &&
      deal.dealScore > prevDealScore + 1e-9
    ) {
      return fail(c, [
        `Ask $${ask} improved dealScore ${deal.dealScore} > previous ${prevDealScore}`,
      ])
    }
    if (
      flip.flipScore != null &&
      prevFlip != null &&
      flip.flipScore > prevFlip
    ) {
      return fail(c, [
        `Ask $${ask} improved Flip Score ${flip.flipScore} > previous ${prevFlip}`,
      ])
    }
    if (flip.grossProfitHigh > prevProfitHigh + 1e-9) {
      return fail(c, [
        `Ask $${ask} improved expected profit high ${flip.grossProfitHigh} > previous ${prevProfitHigh}`,
      ])
    }

    prevRank = rank
    prevDiff = deal.differenceFromMedianPercent
    if (deal.dealScore != null) prevDealScore = deal.dealScore
    if (flip.flipScore != null) prevFlip = flip.flipScore
    prevProfitHigh = flip.grossProfitHigh
  }

  // Condition consistency: worse condition must not improve deal vs used_good
  const ask = c.askingPrices[Math.floor(c.askingPrices.length / 2)]!
  const goodProduct = {
    ...c.product,
    askingPrice: ask,
    condition: 'used_good' as const,
  }
  const fairProduct = {
    ...c.product,
    askingPrice: ask,
    condition: 'used_fair' as const,
  }
  const confGood = {
    ...calculateConfidence({
      product: goodProduct,
      assessments,
      market,
    }),
    level: 'MEDIUM' as const,
  }
  const dealGood = calculateDeal({
    product: goodProduct,
    market,
    confidence: confGood,
  })
  const dealFair = calculateDeal({
    product: fairProduct,
    market,
    confidence: confGood,
  })
  const rankGood = VERDICT_RANK[dealGood.verdictLabel] ?? 0
  const rankFair = VERDICT_RANK[dealFair.verdictLabel] ?? 0
  // Current algorithm ignores condition in deal math — warn only if fair somehow ranks better
  if (rankFair > rankGood) {
    return fail(c, [
      `Worse condition improved verdict (${dealFair.verdictLabel} > ${dealGood.verdictLabel})`,
    ])
  }

  return pass(c)
}

export function evalLowInfo(c: LowInfoCase): CaseResult {
  const got = heuristicExtractFromText(c.inputText)
  if (!got) {
    return pass(c, { identified: false })
  }
  // If heuristic somehow returns a product, confidence must not be high-ish without model specificity
  if (got.identificationConfidence >= 0.85 && !/\d/.test(c.inputText)) {
    return fail(c, [
      `Low-info input received high identificationConfidence ${got.identificationConfidence}`,
    ])
  }
  // Vague "iPhone" alone matching a specific model is contamination
  if (
    /^(iphone|ps5 stuff|old camera|makita drill|console|vr headset)$/i.test(
      c.inputText.trim(),
    ) &&
    got.model &&
    got.identificationConfidence >= 0.8
  ) {
    return fail(c, [
      `Vague input mapped to ${got.brand} ${got.model} at confidence ${got.identificationConfidence}`,
    ])
  }
  return pass(c, {
    identified: true,
    confidence: got.identificationConfidence,
  })
}

export async function evalEbayReplay(c: EbayReplayCase): Promise<CaseResult> {
  const { readFile } = await import('node:fs/promises')
  const { pathToFileURL } = await import('node:url')
  const path = await import('node:path')
  const file = path.resolve(process.cwd(), c.fixturePath)
  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch {
    return fail(c, [`Missing fixture ${c.fixturePath}`])
  }
  const json = JSON.parse(raw) as {
    itemSummaries?: Array<{
      itemId?: string
      title?: string
      price?: { value?: string; currency?: string }
      condition?: string
      conditionId?: string
      itemWebUrl?: string
    }>
  }
  const { mapBrowseItem } = await import('../../../server/ebay/mapBrowseItem.ts')
  const listings = (json.itemSummaries ?? [])
    .map((item, index) =>
      mapBrowseItem({
        itemId: item.itemId ?? `replay-${c.id}-${index}`,
        title: item.title,
        price: item.price,
        condition: item.condition,
        conditionId: item.conditionId,
        itemWebUrl: item.itemWebUrl,
      }),
    )
    .filter(Boolean)

  void pathToFileURL
  let included = 0
  let accessoryHits = 0
  for (const listing of listings) {
    if (!listing) continue
    const m = matchComparable(c.target, listing)
    if (m.included) included += 1
    if (
      /dock|strap|case|cable|controller only|spare|part|faceplate|empty box/i.test(
        listing.title,
      ) && m.included
    ) {
      accessoryHits += 1
    }
  }

  const reasons: string[] = []
  if (c.minIncluded != null && included < c.minIncluded) {
    reasons.push(`included ${included} < min ${c.minIncluded}`)
  }
  if (
    c.maxAccessoryContamination != null &&
    accessoryHits > c.maxAccessoryContamination
  ) {
    reasons.push(
      `accessory contamination ${accessoryHits} > ${c.maxAccessoryContamination}`,
    )
  }
  return reasons.length
    ? fail(c, reasons, { included, accessoryHits })
    : pass(c, { included, accessoryHits })
}
