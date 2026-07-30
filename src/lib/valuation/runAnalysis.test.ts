import { describe, expect, it } from 'vitest'
import { TestPricingProvider } from '@/lib/pricing/TestPricingProvider'
import { runAnalysis } from '@/lib/valuation/runAnalysis'
import { questDemoProduct, QUEST_DEMO_ID } from '@/lib/analysis/questDemoProduct'

describe('runAnalysis', () => {
  it('produces market range and offer for Quest 3 512GB fixtures', async () => {
    const result = await runAnalysis({
      product: questDemoProduct,
      pricing: new TestPricingProvider(),
      id: QUEST_DEMO_ID,
    })

    expect(result.market).not.toBeNull()
    expect(result.market!.sampleCount).toBeGreaterThanOrEqual(8)
    expect(result.market!.median).toBeGreaterThan(680)
    expect(result.market!.median).toBeLessThan(850)
    expect(result.confidence.level).not.toBe('INSUFFICIENT')
    expect(result.offer?.openingOffer).toBeLessThan(questDemoProduct.askingPrice)
    expect(result.assessments.some((a) => !a.included)).toBe(true)
    expect(result.assessments.some((a) => a.included)).toBe(true)
  })

  it('returns real Buy/Offer verdicts for console fixtures (not LIMITED)', async () => {
    const product = {
      ...questDemoProduct,
      category: 'console' as const,
      brand: 'Nintendo',
      model: 'Switch OLED',
      variant: null,
      askingPrice: 340,
      includedAccessories: [],
      identificationConfidence: 0.88,
    }
    const result = await runAnalysis({
      product,
      pricing: new TestPricingProvider(),
    })

    expect(result.deal.verdictLabel).not.toBe('LIMITED MARKET DATA')
    expect(result.offer).not.toBeNull()
    expect(result.market).not.toBeNull()
  })
})
