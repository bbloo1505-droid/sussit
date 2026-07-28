import { ebayApiHost, ebayConfig } from './config.ts'
import { getEbayAccessToken } from './getAccessToken.ts'
import { mapBrowseItem } from './mapBrowseItem.ts'
import {
  buildSearchQuery,
  coreBrowseQuery,
  enrichBrowseQuery,
  relaxBrowseQuery,
} from './buildBrowseQuery.ts'
import type { ComparableListing } from '../types/comparable.ts'

export { buildSearchQuery, enrichBrowseQuery, relaxBrowseQuery, coreBrowseQuery }

const SPARSE_THRESHOLD = 8

export async function browseSearchAu(input: {
  query: string
  limit?: number
  category?: string | null
}): Promise<ComparableListing[]> {
  const cfg = ebayConfig()
  const strictQuery = enrichBrowseQuery(input.query, input.category)

  const primary = await searchOnce({
    query: strictQuery,
    limit: input.limit,
    strictFilters: !cfg.isSandbox,
  })

  if (cfg.isSandbox) {
    if (primary.length > 0) return primary
    for (const broader of broadenQuery(input.query)) {
      const rows = await searchOnce({
        query: enrichBrowseQuery(broader, input.category),
        limit: input.limit,
        strictFilters: false,
      })
      if (rows.length > 0) return rows
    }
    return primary
  }

  if (primary.length >= SPARSE_THRESHOLD) return primary

  // Production sparse fallback: keep sibling guards, drop accessory noise filters
  const relaxed = await searchOnce({
    query: relaxBrowseQuery(strictQuery),
    limit: input.limit,
    strictFilters: true,
  })
  if (relaxed.length > primary.length) {
    if (relaxed.length >= SPARSE_THRESHOLD) return relaxed
  }

  const bestSoFar = relaxed.length > primary.length ? relaxed : primary
  if (bestSoFar.length >= 3) return bestSoFar

  // Last resort: core keywords, still USED + AU
  const core = await searchOnce({
    query: coreBrowseQuery(strictQuery),
    limit: input.limit,
    strictFilters: true,
  })
  if (core.length > bestSoFar.length) return core
  return bestSoFar
}

async function searchOnce(input: {
  query: string
  limit?: number
  strictFilters: boolean
}): Promise<ComparableListing[]> {
  const cfg = ebayConfig()
  const token = await getEbayAccessToken()
  const host = ebayApiHost(cfg.environment)
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 50)

  const filterParts = input.strictFilters
    ? [
        'conditions:{USED}',
        `itemLocationCountry:${cfg.itemLocationCountry}`,
        'buyingOptions:{FIXED_PRICE}',
      ]
    : cfg.isSandbox
      ? []
      : [`itemLocationCountry:${cfg.itemLocationCountry}`]

  const params = new URLSearchParams({
    q: input.query,
    limit: String(limit),
    sort: 'newlyListed',
  })
  if (filterParts.length > 0) {
    params.set('filter', filterParts.join(','))
  }

  const countryCtx = cfg.itemLocationCountry
  const res = await fetch(
    `${host}/buy/browse/v1/item_summary/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': cfg.marketplaceId,
        'X-EBAY-C-ENDUSERCTX': `contextualLocation=country%3D${countryCtx}`,
        Accept: 'application/json',
      },
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`EBAY_SEARCH_FAILED:${res.status}:${text.slice(0, 240)}`)
  }

  const json = (await res.json()) as { itemSummaries?: unknown[] }
  const summaries = json.itemSummaries ?? []

  return summaries
    .map((raw) => mapBrowseItem(raw as Parameters<typeof mapBrowseItem>[0]))
    .filter((row): row is ComparableListing => row != null)
}

function broadenQuery(query: string): string[] {
  const core = query
    .split(/\s+/)
    .filter((t) => t && !t.startsWith('-'))
    .join(' ')
  const parts = core.split(/\s+/).filter(Boolean)
  const out: string[] = []
  if (parts.length >= 2) out.push(parts.slice(0, 2).join(' '))
  if (parts.length >= 1) out.push(parts[0]!)
  const q = core.toLowerCase()
  if (q.includes('iphone')) out.push('iPhone')
  if (q.includes('xbox')) out.push('Xbox')
  if (q.includes('laptop') || q.includes('dell')) out.push('laptop')
  return [...new Set(out.filter((x) => x && x.toLowerCase() !== q))]
}
