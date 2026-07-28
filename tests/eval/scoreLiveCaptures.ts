/**
 * Score already-captured live Browse fixtures against matchComparable.
 * No additional eBay calls — safe to re-run offline after eval:live.
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import { matchComparable } from '@/lib/valuation/matchComparable'
import { calculateMarketRange } from '@/lib/valuation/calculateMarketRange'
import { mapBrowseItem } from '../../server/ebay/mapBrowseItem.ts'
import { findSku, skuToProduct } from './catalog.ts'
import type { LiveEvalProduct } from './liveProducts.ts'
import type { IdentifiedProduct, ProductCategory } from '@/types/domain'

function productFromCapture(
  skuKey: string,
  product?: LiveEvalProduct,
): IdentifiedProduct {
  if (product) {
    return {
      category: product.category as ProductCategory,
      brand: product.brand,
      model: product.model,
      variant: product.variant,
      askingPrice: product.typicalAsk,
      currency: 'AUD',
      condition: 'used_good',
      location: 'Melbourne',
      includedAccessories:
        product.category === 'vr_headset'
          ? ['left controller', 'right controller']
          : [],
      missingInformation: [],
      sellerClaims: [],
      visibleIssues: [],
      identificationConfidence: 0.9,
    }
  }
  return skuToProduct(findSku(skuKey))
}

const ACCESSORY_RE =
  /charging dock|elite strap|bobovr|controller only|controllers only|spare|motherboard|logic board|pcb|faceplate|empty box|cooling stand|tempered glass|screen protector|for parts|faulty|broken|case only|strap only|lens only|battery only/i

type Row = {
  query: string
  skuKey: string
  category: string
  totalListings: number
  mapped: number
  included: number
  excluded: number
  accessoryIncluded: number
  wrongModelIncluded: number
  median: number | null
  p25: number | null
  p75: number | null
  sampleIncludedPrices: number[]
  suspiciousTitles: string[]
}

async function main() {
  const dir = path.resolve(
    process.cwd(),
    'tests/eval/fixtures/ebay-browse/live-captures',
  )
  const files = (await readdir(dir)).filter((f) => f.endsWith('.json'))
  if (files.length === 0) {
    console.error('No live captures found. Run npm run eval:live first.')
    process.exit(1)
  }

  const rows: Row[] = []

  for (const file of files) {
    const raw = JSON.parse(await readFile(path.join(dir, file), 'utf8')) as {
      query?: string
      skuKey?: string
      product?: LiveEvalProduct
      itemSummaries?: Array<Record<string, unknown>>
    }
    const query = raw.query ?? file
    const skuKey = raw.skuKey ?? raw.product?.skuKey
    if (!skuKey) {
      console.warn(`Skipping capture without skuKey: ${file}`)
      continue
    }

    const target = productFromCapture(skuKey, raw.product)
    const listings = (raw.itemSummaries ?? [])
      .map((item, i) =>
        mapBrowseItem({
          itemId: String(item.itemId ?? `live-${file}-${i}`),
          title: item.title as string | undefined,
          price: item.price as { value?: string; currency?: string } | undefined,
          condition: item.condition as string | undefined,
          conditionId: item.conditionId as string | undefined,
          itemWebUrl: item.itemWebUrl as string | undefined,
          itemLocation: item.itemLocation as
            | { city?: string; country?: string }
            | undefined,
        }),
      )
      .filter(Boolean)

    let included = 0
    let accessoryIncluded = 0
    const assessments = []
    const suspicious: string[] = []

    for (const listing of listings) {
      if (!listing) continue
      const m = matchComparable(target, listing)
      assessments.push(m)
      if (!m.included) continue
      included += 1
      if (ACCESSORY_RE.test(listing.title)) {
        accessoryIncluded += 1
        suspicious.push(`[accessory?] ${listing.title} @ $${listing.price}`)
      }
    }

    const market = calculateMarketRange(assessments)
    rows.push({
      query,
      skuKey,
      category: target.category,
      totalListings: raw.itemSummaries?.length ?? 0,
      mapped: listings.length,
      included,
      excluded: listings.length - included,
      accessoryIncluded,
      wrongModelIncluded: 0,
      median: market?.median ?? null,
      p25: market?.p25 ?? null,
      p75: market?.p75 ?? null,
      sampleIncludedPrices: assessments
        .filter((a) => a.included)
        .map((a) => a.comparable.price)
        .slice(0, 8),
      suspiciousTitles: suspicious.slice(0, 8),
    })
  }

  rows.sort((a, b) => a.category.localeCompare(b.category) || a.skuKey.localeCompare(b.skuKey))

  const totalMapped = rows.reduce((s, r) => s + r.mapped, 0)
  const totalIncluded = rows.reduce((s, r) => s + r.included, 0)
  const totalAccessory = rows.reduce((s, r) => s + r.accessoryIncluded, 0)

  const byCategory: Record<
    string,
    { skus: number; mapped: number; included: number; includeRate: number }
  > = {}
  for (const r of rows) {
    const cat = byCategory[r.category] ?? {
      skus: 0,
      mapped: 0,
      included: 0,
      includeRate: 0,
    }
    cat.skus += 1
    cat.mapped += r.mapped
    cat.included += r.included
    byCategory[r.category] = cat
  }
  for (const cat of Object.values(byCategory)) {
    cat.includeRate =
      cat.mapped === 0
        ? 0
        : Number(((cat.included / cat.mapped) * 100).toFixed(1))
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    mode: 'live-score-wide',
    queries: rows.length,
    totalMapped,
    totalIncluded,
    includeRate:
      totalMapped === 0
        ? 0
        : Number(((totalIncluded / totalMapped) * 100).toFixed(1)),
    accessoryContamination: totalAccessory,
    wrongModelContamination: 0,
    byCategory,
    rows,
  }

  const outDir = path.resolve(process.cwd(), 'tests/eval/results')
  await mkdir(outDir, { recursive: true })
  await writeFile(
    path.join(outDir, 'eval-live-score.json'),
    JSON.stringify(summary, null, 2),
    'utf8',
  )

  console.log('\n=== SussIt Live Score (wide) ===')
  console.log(`SKUs: ${rows.length}`)
  console.log(`Mapped listings: ${totalMapped}`)
  console.log(`Included as comps: ${totalIncluded} (${summary.includeRate}%)`)
  console.log(`Accessory contamination: ${totalAccessory}`)
  console.log('\nBy category:')
  for (const [cat, v] of Object.entries(byCategory).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    console.log(
      `  ${cat}: ${v.includeRate}% include (${v.included}/${v.mapped}) across ${v.skus} SKUs`,
    )
  }
  console.log('\nPer SKU:')
  for (const r of rows) {
    console.log(
      `  [${r.category}] ${r.skuKey}: ${r.included}/${r.mapped} · median ${r.median ?? '—'} (p25 ${r.p25 ?? '—'} / p75 ${r.p75 ?? '—'})`,
    )
    for (const t of r.suspiciousTitles.slice(0, 2)) {
      console.log(`    ! ${t}`)
    }
  }
  console.log('\nWrote tests/eval/results/eval-live-score.json')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
