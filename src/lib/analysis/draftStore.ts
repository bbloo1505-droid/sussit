import type { IdentifiedProduct } from '@/types/domain'

const DRAFT_KEY = 'sussit:draft-product'
const META_KEY = 'sussit:draft-meta'

export type DraftMeta = {
  usedFallback: boolean
  source: 'image' | 'text' | 'demo'
}

export function saveDraft(
  product: IdentifiedProduct,
  meta: DraftMeta,
): void {
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify(product))
  sessionStorage.setItem(META_KEY, JSON.stringify(meta))
}

export function loadDraft(): IdentifiedProduct | null {
  const raw = sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as IdentifiedProduct
  } catch {
    return null
  }
}

export function loadDraftMeta(): DraftMeta | null {
  const raw = sessionStorage.getItem(META_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as DraftMeta
  } catch {
    return null
  }
}

export function clearDraft(): void {
  sessionStorage.removeItem(DRAFT_KEY)
  sessionStorage.removeItem(META_KEY)
}
