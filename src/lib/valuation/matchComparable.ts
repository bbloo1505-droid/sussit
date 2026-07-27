import type {
  ComparableAssessment,
  ComparableListing,
  IdentifiedProduct,
} from '@/types/domain'

const REJECT_SCORE = 0
const INCLUDE_THRESHOLD = 80

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function titleOf(listing: ComparableListing): string {
  return norm(listing.title)
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(norm(t)))
}

function extractStorageGb(text: string): number | null {
  const match = text.match(/(\d+)\s*gb/)
  if (!match) return null
  return Number(match[1])
}

function targetStorageGb(product: IdentifiedProduct): number | null {
  if (!product.variant) return null
  return extractStorageGb(norm(product.variant))
}

/**
 * Deterministic comparable matcher.
 * AI must not set prices — this decides include/exclude + match score.
 */
export function matchComparable(
  product: IdentifiedProduct,
  comparable: ComparableListing,
): ComparableAssessment {
  const title = titleOf(comparable)
  const reasons: string[] = []
  let score = 0

  const model = norm(product.model)
  const brand = norm(product.brand)

  // Hard rejects
  if (
    hasAny(title, ['for parts', 'faulty', 'broken', 'spares', 'not working']) ||
    comparable.condition === 'for_parts'
  ) {
    return reject(comparable, 'Broken / for parts', reasons)
  }

  if (
    hasAny(title, [
      'controllers only',
      'controller only',
      'accessories only',
      'strap only',
      'case only',
    ])
  ) {
    return reject(comparable, 'Parts / accessories only', reasons)
  }

  if (
    comparable.condition === 'new' ||
    hasAny(title, ['brand new', 'sealed', 'unopened', 'bnib'])
  ) {
    return reject(comparable, 'Brand new — rejected for used benchmark', reasons)
  }

  // Wrong generation / adjacent SKUs (Quest-specific + generic)
  if (
    model.includes('quest 3') &&
    !model.includes('quest 3s') &&
    (hasAny(title, ['quest 2', 'quest2', 'quest pro']) ||
      /\bquest\s*3s\b/.test(title))
  ) {
    return reject(comparable, 'Wrong generation', reasons)
  }
  if (model.includes('quest 3') && !hasAny(title, ['quest 3', 'quest3'])) {
    return reject(comparable, 'Model not matched', reasons)
  }

  // Accessory / peripheral listings that mention the product name
  if (
    hasAny(title, [
      'charging dock',
      'charge dock',
      'tactsuit',
      'haptic',
      'holster',
      'link cable only',
      'carrying case only',
      'head strap only',
    ])
  ) {
    return reject(comparable, 'Accessory listing', reasons)
  }

  // Exact model required (+ common AU marketplace aliases)
  const modelAliases = [model, model.replaceAll(' ', '')]
  if (model.includes('playstation 5') || model === 'ps5') {
    modelAliases.push('ps5', 'playstation 5', 'play station 5')
  }
  if (model.includes('switch oled')) {
    modelAliases.push('switch oled', 'oled switch')
  }

  if (model && hasAny(title, modelAliases)) {
    score += 40
    reasons.push('Exact model')
  } else if (brand && title.includes(brand) && model.split(' ').some((p) => title.includes(p))) {
    score += 25
    reasons.push('Partial model match')
  } else {
    return reject(comparable, 'Exact model required', reasons)
  }

  // Reject digital when hunting disc (and vice versa)
  if (
    (model.includes('playstation 5') || model.includes('ps5')) &&
    norm(product.variant ?? '').includes('disc') &&
    hasAny(title, ['digital'])
  ) {
    return reject(comparable, 'Wrong PS5 edition (digital)', reasons)
  }

  // Storage
  const targetGb = targetStorageGb(product)
  const listingGb = extractStorageGb(title)
  const looksLikeFullHeadset = hasAny(title, [
    'headset',
    'standalone',
    'vr headset',
    'with controllers',
    'touch plus',
  ])
  if (targetGb != null && listingGb != null) {
    if (listingGb === targetGb) {
      score += 25
      reasons.push('Exact storage')
    } else {
      score -= 30
      reasons.push(`Different storage (${listingGb}GB vs ${targetGb}GB)`)
    }
  } else if (targetGb != null && listingGb == null) {
    // Live eBay titles often omit GB on otherwise valid headsets
    if (looksLikeFullHeadset) {
      score += 15
      reasons.push('Storage omitted on headset listing')
    } else {
      score -= 10
      reasons.push('Storage unclear')
    }
  } else if (targetGb == null) {
    // Required so used + model clears the include threshold without a GB variant
    score += 25
    reasons.push('No storage variant required')
  }

  // Used condition
  if (
    comparable.condition === 'used_good' ||
    comparable.condition === 'used_like_new' ||
    comparable.condition === 'used_fair' ||
    hasAny(title, ['used'])
  ) {
    score += 15
    reasons.push('Used condition')
  }

  // Controllers / normal accessories
  const hasControllers =
    hasAny(title, ['controller', 'controllers']) ||
    comparable.includedAccessories.some((a) => norm(a).includes('controller'))

  const headsetOnly = hasAny(title, [
    'headset only',
    'no controllers',
    'without controllers',
  ])

  if (headsetOnly) {
    score -= 20
    reasons.push('Headset only')
  } else if (hasControllers) {
    score += 5
    reasons.push('Controllers included')
  }

  // Large bundle
  const bundleHits = [
    'elite strap',
    'battery pack',
    'games bundle',
    'full bundle',
    'accessory bundle',
  ].filter((t) => title.includes(t)).length
  if (bundleHits >= 2 || comparable.includedAccessories.length >= 5) {
    score -= 20
    reasons.push('Large bundle')
  } else if (bundleHits === 1) {
    score -= 5
    reasons.push('Minor bundle extras')
  }

  // AU location soft bonus
  if (comparable.location && /nsw|vic|qld|wa|sa|tas|act|australia|au/i.test(comparable.location)) {
    score += 5
    reasons.push('AU listing')
  }

  score = Math.max(0, Math.min(100, score))

  if (score < INCLUDE_THRESHOLD) {
    return {
      comparable,
      included: false,
      matchScore: score,
      rejectionReason: reasons[reasons.length - 1] ?? 'Below match threshold',
      matchLabel: 'Excluded',
      reasons,
    }
  }

  return {
    comparable,
    included: true,
    matchScore: score,
    rejectionReason: null,
    matchLabel: score >= 90 ? 'Strong match' : 'Good match',
    reasons,
  }
}

function reject(
  comparable: ComparableListing,
  reason: string,
  reasons: string[],
): ComparableAssessment {
  return {
    comparable,
    included: false,
    matchScore: REJECT_SCORE,
    rejectionReason: reason,
    matchLabel: 'Excluded',
    reasons: [...reasons, reason],
  }
}

export function assessComparables(
  product: IdentifiedProduct,
  listings: ComparableListing[],
): ComparableAssessment[] {
  return listings.map((listing) => matchComparable(product, listing))
}

export const MATCH_INCLUDE_THRESHOLD = INCLUDE_THRESHOLD
