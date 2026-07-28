import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { HUNT_CATALOG } from '@/lib/hunt/catalog'
import type { ListingObservation } from '@/types/sellSpeed'
import type { UserSaleReport } from '@/lib/sellSpeed/recordUserSale'

export async function seedHuntProducts(): Promise<{ ok: boolean; count: number }> {
  if (!isSupabaseConfigured()) return { ok: false, count: 0 }
  const sb = getSupabase()
  if (!sb) return { ok: false, count: 0 }

  const rows = HUNT_CATALOG.map((item) => ({
    id: item.productId,
    category: item.category,
    brand: item.brand,
    model: item.model,
    variant: item.variant,
    aliases: [item.searchQuery, item.label],
  }))

  const { error } = await sb.from('products').upsert(rows, { onConflict: 'id' })
  if (error) {
    console.warn('[supabase] seed products', error.message)
    return { ok: false, count: 0 }
  }
  return { ok: true, count: rows.length }
}

export async function persistUserSale(report: UserSaleReport): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const sb = getSupabase()
  if (!sb) return false

  await sb.from('products').upsert(
    {
      id: report.productId,
      category: 'unknown',
      brand: report.productLabel.split(' ')[0] ?? 'Unknown',
      model: report.productLabel,
      variant: null,
    },
    { onConflict: 'id' },
  )

  const { error } = await sb.from('user_transactions').insert({
    id: report.id,
    analysis_id: report.analysisId,
    product_id: report.productId,
    purchase_price: report.purchasePrice,
    purchase_at: report.purchaseAt,
    sale_price: report.salePrice,
    sale_at: report.saleAt,
    days_to_sell: report.daysToSell,
    channel: report.channel,
    created_at: report.createdAt,
  })

  if (error) {
    console.warn('[supabase] user sale', error.message)
    return false
  }
  return true
}

export async function persistObservations(
  rows: ListingObservation[],
): Promise<boolean> {
  if (!isSupabaseConfigured() || rows.length === 0) return false
  const sb = getSupabase()
  if (!sb) return false

  const payload = rows.map((o) => ({
    source: o.source,
    external_id: o.externalId,
    product_id: o.productId,
    title: o.title,
    price: o.price,
    currency: o.currency,
    condition: o.condition,
    availability: o.availability,
    estimated_sold_quantity: o.estimatedSoldQuantity,
    estimated_available_quantity: o.estimatedAvailableQuantity,
    item_created_at: o.itemCreatedAt,
    item_end_at: o.itemEndAt,
    observed_at: o.observedAt,
    url: o.url,
  }))

  const { error } = await sb.from('listing_observations').upsert(payload, {
    onConflict: 'source,external_id,observed_at',
    ignoreDuplicates: true,
  })

  if (error) {
    console.warn('[supabase] observations', error.message)
    return false
  }
  return true
}
