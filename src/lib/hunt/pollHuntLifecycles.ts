import { recordSearchSnapshot } from '@/lib/sellSpeed/recordSearchSnapshot'
import type { ComparableListing } from '@/types/domain'

type PollResponse =
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

export type PollHuntSummary = {
  source: 'ebay' | 'unavailable' | 'error'
  observedAt: string
  productCount: number
  listingCount: number
  errors: string[]
}

/**
 * Pull V0 hunt SKU comps from Browse API and record lifecycle snapshots
 * in the browser store (day-one path before Supabase persistence).
 */
export async function pollHuntLifecycles(): Promise<PollHuntSummary> {
  try {
    const res = await fetch('/api/poll-hunt', { method: 'POST' })
    const json = (await res.json()) as PollResponse

    if (!json.ok) {
      return {
        source: 'error',
        observedAt: new Date().toISOString(),
        productCount: 0,
        listingCount: 0,
        errors: [json.error],
      }
    }

    if (json.source === 'unavailable') {
      return {
        source: 'unavailable',
        observedAt: json.observedAt,
        productCount: json.results.length,
        listingCount: 0,
        errors: ['eBay API keys not configured'],
      }
    }

    let listingCount = 0
    const errors: string[] = []

    for (const row of json.results) {
      if (row.error) errors.push(`${row.label}: ${row.error}`)
      listingCount += row.listings.length
      recordSearchSnapshot({
        source: 'ebay',
        productId: row.productId,
        listings: row.listings,
        observedAt: json.observedAt,
      })
    }

    void import('@/lib/supabase/persist').then(async ({ persistObservations }) => {
      const { loadObservations } = await import('@/lib/sellSpeed/lifecycleStore')
      const recent = loadObservations().filter((o) => o.observedAt === json.observedAt)
      await persistObservations(recent)
    })

    return {
      source: 'ebay',
      observedAt: json.observedAt,
      productCount: json.results.length,
      listingCount,
      errors,
    }
  } catch (error) {
    return {
      source: 'error',
      observedAt: new Date().toISOString(),
      productCount: 0,
      listingCount: 0,
      errors: [error instanceof Error ? error.message : 'Poll failed'],
    }
  }
}
