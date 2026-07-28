import type { ListingLifecycle, ListingObservation } from '@/types/sellSpeed'

const OBS_KEY = 'sussit:listing-observations'
const LIFE_KEY = 'sussit:listing-lifecycles'

const memory = new Map<string, string>()

function storageGet(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key)
  }
  return memory.get(key) ?? null
}

function storageSet(key: string, value: string) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, value)
    return
  }
  memory.set(key, value)
}

function readJson<T>(key: string, fallback: T): T {
  const raw = storageGet(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  storageSet(key, JSON.stringify(value))
}

export function loadObservations(): ListingObservation[] {
  return readJson(OBS_KEY, [])
}

export function loadLifecycles(): ListingLifecycle[] {
  return readJson(LIFE_KEY, [])
}

export function saveObservations(rows: ListingObservation[]) {
  writeJson(OBS_KEY, rows)
}

export function saveLifecycles(rows: ListingLifecycle[]) {
  writeJson(LIFE_KEY, rows)
}

export function clearLifecycleStore() {
  writeJson(OBS_KEY, [])
  writeJson(LIFE_KEY, [])
}

export function upsertObservation(obs: ListingObservation) {
  const all = loadObservations()
  all.push(obs)
  saveObservations(all)
  return syncLifecycleFromObservations(obs.source, obs.externalId)
}

function hoursBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60)
}

/**
 * Rebuild lifecycle for one listing from its observation trail.
 * UNAVAILABLE / missing from search → DISAPPEARED (not confirmed sold)
 * unless estimatedSoldQuantity increased → CONFIRMED_SOLD.
 */
export function syncLifecycleFromObservations(
  source: string,
  externalId: string,
): ListingLifecycle | null {
  const trail = loadObservations()
    .filter((o) => o.source === source && o.externalId === externalId)
    .sort(
      (a, b) =>
        new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
    )

  if (trail.length === 0) return null

  const first = trail[0]
  const last = trail[trail.length - 1]
  const prices = trail.map((t) => t.price)

  let outcome: ListingLifecycle['outcome'] = 'ACTIVE'
  let outcomeConfidence: ListingLifecycle['outcomeConfidence'] = 'LOW'
  let outcomeAt: string | null = null
  let confirmedSalePrice: number | null = null

  for (let i = 1; i < trail.length; i++) {
    const prev = trail[i - 1].estimatedSoldQuantity
    const curr = trail[i].estimatedSoldQuantity
    if (prev != null && curr != null && curr > prev) {
      outcome = 'CONFIRMED_SOLD'
      outcomeConfidence = 'HIGH'
      outcomeAt = trail[i].observedAt
      confirmedSalePrice = trail[i].price
      break
    }
  }

  if (outcome !== 'CONFIRMED_SOLD' && last.availability === 'UNAVAILABLE') {
    outcome = 'DISAPPEARED'
    outcomeConfidence = 'MEDIUM'
    outcomeAt = last.observedAt
  }

  const durationHours =
    outcomeAt != null ? hoursBetween(first.observedAt, outcomeAt) : null

  const lifecycle: ListingLifecycle = {
    source,
    externalId,
    productId: last.productId,
    firstSeenAt: first.observedAt,
    lastSeenAt: last.observedAt,
    firstPrice: first.price,
    lastPrice: last.price,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    observationCount: trail.length,
    outcome,
    outcomeConfidence,
    outcomeAt,
    durationHours,
    confirmedSalePrice,
  }

  const others = loadLifecycles().filter(
    (l) => !(l.source === source && l.externalId === externalId),
  )
  saveLifecycles([lifecycle, ...others])
  return lifecycle
}

export function markMissingAsDisappeared(input: {
  source: string
  productId: string
  seenExternalIds: string[]
  observedAt: string
}) {
  const seen = new Set(input.seenExternalIds)
  const lifecycles = loadLifecycles()
  const next = lifecycles.map((life) => {
    if (
      life.source !== input.source ||
      life.productId !== input.productId ||
      life.outcome !== 'ACTIVE' ||
      seen.has(life.externalId)
    ) {
      return life
    }

    return {
      ...life,
      lastSeenAt: input.observedAt,
      outcome: 'DISAPPEARED' as const,
      outcomeConfidence: 'MEDIUM' as const,
      outcomeAt: input.observedAt,
      durationHours: hoursBetween(life.firstSeenAt, input.observedAt),
    }
  })
  saveLifecycles(next)
}
