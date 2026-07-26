export type MockAnalysis = {
  id: string
  productName: string
  brand: string
  model: string
  variant: string
  askingPrice: number
  condition: string
  includes: string[]
  listedOn: string
  comparableLow: number
  comparableHigh: number
  suggestedOffer: number
  mockScore: number
  confidence: string
  explanation: string
  comps: Array<{ title: string; price: number; source: string }>
  offerMessage: string
  risks: Array<{ title: string; description: string }>
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
  listedOn: 'Marketplace',
  comparableLow: 520,
  comparableHigh: 580,
  suggestedOffer: 485,
  mockScore: 8.1,
  confidence: 'Medium',
  explanation:
    'At $550, this sits within the range of similar current eBay Australia listings.',
  comps: [
    {
      title: 'Meta Quest 3 512GB + controllers',
      price: 520,
      source: 'Current eBay Australia listing',
    },
    {
      title: 'Meta Quest 3 512GB, used',
      price: 549,
      source: 'Current eBay Australia listing',
    },
    {
      title: 'Meta Quest 3 512GB + case',
      price: 580,
      source: 'Current eBay Australia listing',
    },
  ],
  offerMessage:
    'Hey mate, definitely interested. Would you take $485 if I can pick it up today?',
  risks: [
    {
      title: 'Inspect the lenses',
      description: 'Look for scratches, haze or sun damage before payment.',
    },
    {
      title: 'Test both controllers',
      description: 'Check tracking, buttons, triggers and battery contacts.',
    },
    {
      title: 'Check the headset charge',
      description: 'Make sure it powers on, charges and holds connection.',
    },
    {
      title: 'Confirm the serial number',
      description:
        'Match the headset and box, and ask about proof of purchase.',
    },
  ],
}

export function getMockAnalysis(id: string): MockAnalysis | null {
  if (id === MOCK_ANALYSIS_ID) return quest3512Analysis
  return null
}
