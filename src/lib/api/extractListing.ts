import type { IdentifiedProduct } from '@/types/domain'

export type ExtractApiListing = {
  category: IdentifiedProduct['category']
  brand: string | null
  model: string | null
  variant: string | null
  askingPrice: number | null
  currency: 'AUD' | null
  condition: IdentifiedProduct['condition']
  location: string | null
  includedAccessories: string[]
  missingInformation: string[]
  sellerClaims: string[]
  visibleIssues: string[]
  identificationConfidence: number
  refused: boolean
  refusalReason: string | null
}

export type ExtractApiResponse =
  | { ok: true; listing: ExtractApiListing; usedFallback: boolean }
  | { ok: false; error: string }

export async function extractListing(input: {
  text?: string
  imageDataUrl?: string
}): Promise<ExtractApiResponse> {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: input.text,
      imageDataUrl: input.imageDataUrl,
      allowDemoFallback: true,
    }),
  })

  return (await response.json()) as ExtractApiResponse
}

export function toIdentifiedProduct(
  listing: ExtractApiListing,
): IdentifiedProduct | null {
  if (listing.refused) return null
  if (!listing.brand || !listing.model || listing.askingPrice == null) {
    return null
  }

  return {
    category: listing.category,
    brand: listing.brand,
    model: listing.model,
    variant: listing.variant,
    askingPrice: listing.askingPrice,
    currency: listing.currency ?? 'AUD',
    condition: listing.condition,
    location: listing.location,
    includedAccessories: listing.includedAccessories,
    missingInformation: listing.missingInformation,
    sellerClaims: listing.sellerClaims,
    visibleIssues: listing.visibleIssues,
    identificationConfidence: listing.identificationConfidence,
  }
}

export function productLabel(product: IdentifiedProduct): string {
  return [product.brand, product.model, product.variant].filter(Boolean).join(' ')
}

export function conditionLabel(condition: IdentifiedProduct['condition']): string {
  switch (condition) {
    case 'new':
      return 'New'
    case 'used_like_new':
      return 'Like new'
    case 'used_good':
      return 'Used'
    case 'used_fair':
      return 'Fair'
    case 'for_parts':
      return 'For parts'
    default:
      return 'Unknown'
  }
}
