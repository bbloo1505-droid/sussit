import {
  markMissingAsDisappeared,
  upsertObservation,
} from '@/lib/sellSpeed/lifecycleStore'
import type { ComparableListing } from '@/types/domain'

/**
 * Record a Browse-API-style search snapshot.
 * Compare item IDs over time → new / still active / disappeared.
 */
export function recordSearchSnapshot(input: {
  source: 'ebay' | 'fixture'
  productId: string
  listings: ComparableListing[]
  observedAt: string
}) {
  const seenExternalIds: string[] = []

  for (const listing of input.listings) {
    const externalId = listing.externalId ?? listing.id
    seenExternalIds.push(externalId)
    upsertObservation({
      source: input.source,
      externalId,
      productId: input.productId,
      title: listing.title,
      price: listing.price,
      currency: 'AUD',
      condition: listing.condition,
      availability:
        listing.estimatedAvailableQuantity === 0 ? 'UNAVAILABLE' : 'AVAILABLE',
      estimatedSoldQuantity: listing.estimatedSoldQuantity ?? null,
      estimatedAvailableQuantity: listing.estimatedAvailableQuantity ?? 1,
      itemCreatedAt: listing.itemCreatedAt ?? null,
      itemEndAt: listing.itemEndAt ?? null,
      observedAt: input.observedAt,
      url: listing.url,
    })
  }

  // Only reconcile disappearances for live eBay polls.
  // Fixture analysis snapshots must not wipe seeded lifecycle history.
  if (input.source === 'ebay') {
    markMissingAsDisappeared({
      source: input.source,
      productId: input.productId,
      seenExternalIds,
      observedAt: input.observedAt,
    })
  }
}
