import type { IdentifiedProduct } from '@/types/domain'
import { questDemoProduct } from '@/lib/analysis/questDemoProduct'

export type ExampleListing = {
  id: string
  label: string
  product: IdentifiedProduct
}

export const EXAMPLE_LISTINGS: ExampleListing[] = [
  {
    id: 'ex-iphone-15',
    label: 'iPhone 15',
    product: {
      category: 'phone',
      brand: 'Apple',
      model: 'iPhone 15',
      variant: '128GB',
      askingPrice: 780,
      currency: 'AUD',
      condition: 'used_good',
      location: 'Sydney',
      includedAccessories: [],
      missingInformation: ['battery health'],
      sellerClaims: [],
      visibleIssues: [],
      identificationConfidence: 0.92,
    },
  },
  {
    id: 'ex-ps5-slim',
    label: 'PS5 Slim',
    product: {
      category: 'console',
      brand: 'Sony',
      model: 'PlayStation 5 Slim',
      variant: 'Disc',
      askingPrice: 650,
      currency: 'AUD',
      condition: 'used_good',
      location: 'Melbourne',
      includedAccessories: ['dualsense'],
      missingInformation: [],
      sellerClaims: [],
      visibleIssues: [],
      identificationConfidence: 0.94,
    },
  },
  {
    id: 'ex-quest-3',
    label: 'Quest 3',
    product: {
      ...questDemoProduct,
      askingPrice: 720,
    },
  },
]
