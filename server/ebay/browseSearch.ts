import { ebayApiHost, ebayConfig } from './config.ts'
import { getEbayAccessToken } from './getAccessToken.ts'
import { mapBrowseItem } from './mapBrowseItem.ts'
import type { ComparableListing } from '../types/comparable.ts'

export async function browseSearchAu(input: {
  query: string
  limit?: number
}): Promise<ComparableListing[]> {
  const cfg = ebayConfig()
  const primary = await searchOnce({
    query: input.query,
    limit: input.limit,
    strictFilters: !cfg.isSandbox,
  })

  if (primary.length > 0 || !cfg.isSandbox) {
    return primary
  }

  // Sandbox inventory is sparse/fake — retry with broader keywords
  for (const broader of broadenQuery(input.query)) {
    const rows = await searchOnce({
      query: broader,
      limit: input.limit,
      strictFilters: false,
    })
    if (rows.length > 0) return rows
  }

  return primary
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
      ? [] // widest net for sandbox test data
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

/** Sandbox-friendly fallbacks when exact SKU search is empty */
function broadenQuery(query: string): string[] {
  const parts = query.split(/\s+/).filter(Boolean)
  const out: string[] = []
  if (parts.length >= 2) out.push(parts.slice(0, 2).join(' '))
  if (parts.length >= 1) out.push(parts[0])
  // Known sandbox keywords that return inventory
  const q = query.toLowerCase()
  if (q.includes('iphone')) out.push('iPhone')
  if (q.includes('xbox')) out.push('Xbox')
  if (q.includes('laptop') || q.includes('dell')) out.push('laptop')
  return [...new Set(out.filter((x) => x && x.toLowerCase() !== q))]
}

export function buildSearchQuery(product: {
  brand: string
  model: string
  variant?: string | null
}): string {
  return [product.brand, product.model, product.variant]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}
