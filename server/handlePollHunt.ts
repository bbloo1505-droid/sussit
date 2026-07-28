import { browseSearchAu } from './ebay/browseSearch.ts'
import { ebayConfig } from './ebay/config.ts'
import type { ComparableListing } from './types/comparable.ts'

/** Keep in sync with src/lib/hunt/catalog.ts */
const HUNT_TARGETS = [
  {
    productId: 'META_QUEST_3_512',
    label: 'Quest 3 512GB',
    query: 'Quest 3 512GB',
    category: 'vr_headset',
  },
  {
    productId: 'NINTENDO_SWITCH_OLED_BASE',
    label: 'Switch OLED',
    query: 'Switch OLED',
    category: 'console',
  },
  {
    productId: 'APPLE_IPHONE_14_128GB',
    label: 'iPhone 14 128GB',
    query: 'iPhone 14 128GB',
    category: 'phone',
  },
  {
    productId: 'SONY_PLAYSTATION_5_DISC',
    label: 'PS5 Disc',
    query: 'PS5 Disc',
    category: 'console',
  },
  {
    productId: 'MICROSOFT_XBOX_SERIES_X_BASE',
    label: 'Xbox Series X',
    query: 'Xbox Series X',
    category: 'console',
  },
] as const

export type PollHuntResponse =
  | {
      ok: true
      source: 'ebay' | 'unavailable'
      observedAt: string
      results: Array<{
        productId: string
        label: string
        query: string
        listings: ComparableListing[]
        error?: string
      }>
    }
  | { ok: false; error: string }

export async function handlePollHunt(): Promise<PollHuntResponse> {
  const observedAt = new Date().toISOString()

  if (!ebayConfig().configured) {
    return {
      ok: true,
      source: 'unavailable',
      observedAt,
      results: HUNT_TARGETS.map((t) => ({
        productId: t.productId,
        label: t.label,
        query: t.query,
        listings: [],
      })),
    }
  }

  const results: Array<{
    productId: string
    label: string
    query: string
    listings: ComparableListing[]
    error?: string
  }> = []

  for (const target of HUNT_TARGETS) {
    try {
      const listings = await browseSearchAu({
        query: target.query,
        limit: 40,
        category: target.category,
      })
      results.push({
        productId: target.productId,
        label: target.label,
        query: target.query,
        listings,
      })
      // Gentle pacing for app-rate limits
      await sleep(250)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Search failed'
      results.push({
        productId: target.productId,
        label: target.label,
        query: target.query,
        listings: [],
        error: message,
      })
    }
  }

  return { ok: true, source: 'ebay', observedAt, results }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
