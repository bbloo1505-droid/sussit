import type { IdentifiedProduct } from '@/types/domain'

/** Stand-in for OpenAI extraction until Phase 7 */
export const questDemoProduct: IdentifiedProduct = {
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
}

export const QUEST_DEMO_ID = 'quest3-512-demo'
