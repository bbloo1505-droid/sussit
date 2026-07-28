import { browseSearchAu, buildSearchQuery, enrichBrowseQuery } from './ebay/browseSearch.ts'
import { ebayConfig } from './ebay/config.ts'
import type { ComparableListing } from './types/comparable.ts'

export type CompsRequestBody = {
  brand?: string
  model?: string
  variant?: string | null
  category?: string | null
  query?: string
  limit?: number
}

export type CompsResponse =
  | {
      ok: true
      source: 'ebay' | 'unavailable'
      query: string
      listings: ComparableListing[]
    }
  | { ok: false; error: string }

export async function handleComps(
  body: CompsRequestBody,
): Promise<CompsResponse> {
  const query =
    body.query?.trim() ||
    buildSearchQuery({
      brand: body.brand ?? '',
      model: body.model ?? '',
      variant: body.variant,
      category: body.category,
    })

  if (!query) {
    return { ok: false, error: 'Missing search query (brand/model or query).' }
  }

  // If caller passed a raw query, still enrich it
  const enriched =
    body.query?.trim()
      ? enrichBrowseQuery(body.query.trim(), body.category)
      : query

  if (!ebayConfig().configured) {
    return { ok: true, source: 'unavailable', query: enriched, listings: [] }
  }

  try {
    const listings = await browseSearchAu({
      query: enriched,
      limit: body.limit,
      category: body.category,
    })
    return { ok: true, source: 'ebay', query: enriched, listings }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'MISSING_EBAY_KEYS') {
      return { ok: true, source: 'unavailable', query: enriched, listings: [] }
    }
    console.error('[ebay/comps]', message)
    return { ok: false, error: message }
  }
}
