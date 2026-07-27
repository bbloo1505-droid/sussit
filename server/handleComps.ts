import { browseSearchAu, buildSearchQuery } from './ebay/browseSearch.ts'
import { ebayConfig } from './ebay/config.ts'
import type { ComparableListing } from './types/comparable.ts'

export type CompsRequestBody = {
  brand?: string
  model?: string
  variant?: string | null
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
    })

  if (!query) {
    return { ok: false, error: 'Missing search query (brand/model or query).' }
  }

  if (!ebayConfig().configured) {
    return { ok: true, source: 'unavailable', query, listings: [] }
  }

  try {
    const listings = await browseSearchAu({
      query,
      limit: body.limit,
    })
    return { ok: true, source: 'ebay', query, listings }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'MISSING_EBAY_KEYS') {
      return { ok: true, source: 'unavailable', query, listings: [] }
    }
    console.error('[ebay/comps]', message)
    return { ok: false, error: message }
  }
}
