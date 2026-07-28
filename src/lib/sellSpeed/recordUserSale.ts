import {
  loadLifecycles,
  saveLifecycles,
  upsertObservation,
} from '@/lib/sellSpeed/lifecycleStore'
import type { ListingLifecycle } from '@/types/sellSpeed'

export type UserSaleReport = {
  id: string
  analysisId: string | null
  productId: string
  productLabel: string
  purchasePrice: number
  purchaseAt: string
  salePrice: number
  saleAt: string
  daysToSell: number
  channel: 'ebay' | 'marketplace' | 'gumtree' | 'other'
  createdAt: string
}

const KEY = 'sussit:user-sales'
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

export function loadUserSales(): UserSaleReport[] {
  const raw = storageGet(KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as UserSaleReport[]
  } catch {
    return []
  }
}

export function clearUserSales() {
  storageSet(KEY, '[]')
}

export function saveUserSale(report: UserSaleReport) {
  const next = [report, ...loadUserSales().filter((r) => r.id !== report.id)]
  storageSet(KEY, JSON.stringify(next))
}

/**
 * Highest-quality Flip signal: user confirms they sold.
 * Writes CONFIRMED_SOLD lifecycle so sell-speed can use it.
 */
export function recordUserConfirmedSale(input: {
  analysisId?: string | null
  productId: string
  productLabel: string
  purchasePrice: number
  purchaseAt: string
  salePrice: number
  saleAt: string
  channel: UserSaleReport['channel']
}): UserSaleReport {
  const purchaseMs = new Date(input.purchaseAt).getTime()
  const saleMs = new Date(input.saleAt).getTime()
  const daysToSell = Math.max(
    0,
    Number(((saleMs - purchaseMs) / (1000 * 60 * 60 * 24)).toFixed(1)),
  )

  const report: UserSaleReport = {
    id: crypto.randomUUID(),
    analysisId: input.analysisId ?? null,
    productId: input.productId,
    productLabel: input.productLabel,
    purchasePrice: input.purchasePrice,
    purchaseAt: input.purchaseAt,
    salePrice: input.salePrice,
    saleAt: input.saleAt,
    daysToSell,
    channel: input.channel,
    createdAt: new Date().toISOString(),
  }

  saveUserSale(report)

  // Best-effort cloud persist (no-op if Supabase keys missing)
  void import('@/lib/supabase/persist').then(({ persistUserSale }) =>
    persistUserSale(report),
  )

  const externalId = `user-sale-${report.id}`
  upsertObservation({
    source: 'user',
    externalId,
    productId: input.productId,
    title: input.productLabel,
    price: input.salePrice,
    currency: 'AUD',
    condition: 'used_good',
    availability: 'AVAILABLE',
    estimatedSoldQuantity: 0,
    estimatedAvailableQuantity: 1,
    itemCreatedAt: input.purchaseAt,
    itemEndAt: null,
    observedAt: input.purchaseAt,
    url: null,
  })
  upsertObservation({
    source: 'user',
    externalId,
    productId: input.productId,
    title: input.productLabel,
    price: input.salePrice,
    currency: 'AUD',
    condition: 'used_good',
    availability: 'UNAVAILABLE',
    estimatedSoldQuantity: 1,
    estimatedAvailableQuantity: 0,
    itemCreatedAt: input.purchaseAt,
    itemEndAt: input.saleAt,
    observedAt: input.saleAt,
    url: null,
  })

  // Force HIGH confidence confirmed sale on the lifecycle row
  const lifecycles = loadLifecycles()
  const next = lifecycles.map((row): ListingLifecycle => {
    if (!(row.source === 'user' && row.externalId === externalId)) return row
    return {
      ...row,
      outcome: 'CONFIRMED_SOLD',
      outcomeConfidence: 'HIGH',
      outcomeAt: input.saleAt,
      durationHours: daysToSell * 24,
      confirmedSalePrice: input.salePrice,
      firstSeenAt: input.purchaseAt,
      lastSeenAt: input.saleAt,
    }
  })
  saveLifecycles(next)

  return report
}
