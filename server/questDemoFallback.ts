import type { ExtractedListing } from './listingSchema.ts'

/** Used when OPENAI_API_KEY is missing so local UI keeps working */
export const questDemoFallback: ExtractedListing = {
  category: 'vr_headset',
  brand: 'Meta',
  model: 'Quest 3',
  variant: '512GB',
  askingPrice: 850,
  currency: 'AUD',
  condition: 'used_good',
  location: 'Brisbane',
  includedAccessories: ['left controller', 'right controller'],
  missingInformation: ['charger', 'lens condition', 'battery condition'],
  sellerClaims: ['barely used'],
  visibleIssues: [],
  identificationConfidence: 0.96,
  refused: false,
  refusalReason: null,
}
