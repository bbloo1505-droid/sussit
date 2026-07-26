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
  goodBuyPrice: number
  /** Mock UI only — private V0 engine will not publish scores until earned */
  mockScore: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT'
  strongComparisons: number
  verdictLabel: 'GOOD BUY' | 'FAIR' | 'NEGOTIATE' | 'PASS' | 'EXCEPTIONAL BUY'
  explanation: string
  risks: string[]
  questions: string[]
  comps: Array<{
    id: string
    title: string
    price: number
    condition: string
    included: boolean
    matchLabel: string
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
  includes: ['Controllers'],
  comparableLow: 520,
  comparableHigh: 580,
  medianAsk: 550,
  differenceFromMedianPercent: -5,
  suggestedOffer: 485,
  goodBuyPrice: 520,
  mockScore: 8.4,
  confidence: 'HIGH',
  strongComparisons: 19,
  verdictLabel: 'GOOD BUY',
  explanation:
    "You're around 5% below the current market benchmark. Based on 19 strong comparisons.",
  risks: [
    'Lens scratches',
    'Controller drift',
    'Battery condition',
    'Original charger',
  ],
  questions: [
    'How long have you owned it?',
    'Any scratches on the lenses?',
    'Any controller stick drift?',
    'Can I see it working in person?',
  ],
  comps: [
    {
      id: '1',
      title: 'Meta Quest 3 512GB VR Headset + Controllers',
      price: 525,
      condition: 'Used · Good',
      included: true,
      matchLabel: 'Strong match',
      reason: 'Exact model and storage',
    },
    {
      id: '2',
      title: 'Quest 3 512GB used — full kit',
      price: 560,
      condition: 'Used · Very good',
      included: true,
      matchLabel: 'Strong match',
      reason: 'Exact model and storage',
    },
    {
      id: '3',
      title: 'Meta Quest 3 512GB with case',
      price: 575,
      condition: 'Used · Good',
      included: true,
      matchLabel: 'Good match',
      reason: 'Exact model; minor bundle',
    },
    {
      id: '4',
      title: 'Quest 3 controllers only',
      price: 260,
      condition: 'Used',
      included: false,
      matchLabel: 'Excluded',
      reason: 'Accessories only',
    },
    {
      id: '5',
      title: 'Brand new Meta Quest 3 512GB',
      price: 799,
      condition: 'New',
      included: false,
      matchLabel: 'Excluded',
      reason: 'Brand new — not used benchmark',
    },
    {
      id: '6',
      title: 'Quest 3 128GB used',
      price: 420,
      condition: 'Used',
      included: false,
      matchLabel: 'Excluded',
      reason: 'Wrong storage',
    },
  ],
}

export function getMockAnalysis(id: string): MockAnalysis | null {
  if (id === MOCK_ANALYSIS_ID) return quest3512Analysis
  return null
}
