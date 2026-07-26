export type MockAnalysis = {
  id: string
  productName: string
  brand: string
  model: string
  variant: string
  askingPrice: number
  condition: string
  includes: string[]
  comparableLow: number
  comparableHigh: number
  medianAsk: number
  differenceFromMedianPercent: number
  suggestedOffer: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT'
  strongComparisons: number
  verdictLabel: 'GOOD BUY' | 'FAIR' | 'NEGOTIATE' | 'PASS'
  comps: Array<{
    id: string
    title: string
    price: number
    condition: string
    included: boolean
    reason: string
  }>
}

export const MOCK_ANALYSIS_ID = 'quest3-512-demo'

export const quest3512Analysis: MockAnalysis = {
  id: MOCK_ANALYSIS_ID,
  productName: 'Meta Quest 3 512GB',
  brand: 'Meta',
  model: 'Quest 3',
  variant: '512GB',
  askingPrice: 550,
  condition: 'Used',
  includes: ['Left controller', 'Right controller'],
  comparableLow: 520,
  comparableHigh: 580,
  medianAsk: 550,
  differenceFromMedianPercent: 0,
  suggestedOffer: 485,
  confidence: 'HIGH',
  strongComparisons: 19,
  verdictLabel: 'GOOD BUY',
  comps: [
    {
      id: '1',
      title: 'Meta Quest 3 512GB VR Headset + Controllers',
      price: 520,
      condition: 'Used',
      included: true,
      reason: 'Exact model and storage',
    },
    {
      id: '2',
      title: 'Quest 3 512GB used — full kit',
      price: 535,
      condition: 'Used',
      included: true,
      reason: 'Exact model and storage',
    },
    {
      id: '3',
      title: 'Meta Quest 3 512GB',
      price: 550,
      condition: 'Used',
      included: true,
      reason: 'Exact model and storage',
    },
    {
      id: '4',
      title: 'Quest 3 512GB with Elite Strap',
      price: 575,
      condition: 'Used',
      included: true,
      reason: 'Exact model; minor bundle',
    },
    {
      id: '5',
      title: 'Quest 3 controllers only',
      price: 180,
      condition: 'Used',
      included: false,
      reason: 'Parts only — rejected',
    },
    {
      id: '6',
      title: 'Brand new Meta Quest 3 512GB',
      price: 799,
      condition: 'New',
      included: false,
      reason: 'Brand new — rejected for used benchmark',
    },
  ],
}

export function getMockAnalysis(id: string): MockAnalysis | null {
  if (id === MOCK_ANALYSIS_ID) return quest3512Analysis
  return null
}
