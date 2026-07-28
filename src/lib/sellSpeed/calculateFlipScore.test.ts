import { beforeEach, describe, expect, it } from 'vitest'
import { clearLifecycleStore } from '@/lib/sellSpeed/lifecycleStore'
import { seedV0SellSpeedFixtures, QUEST_PRODUCT_ID } from '@/lib/sellSpeed/seedQuestLifecycle'
import { calculateFlipScore } from '@/lib/sellSpeed/calculateFlipScore'

describe('calculateFlipScore', () => {
  beforeEach(() => {
    clearLifecycleStore()
    seedV0SellSpeedFixtures()
  })

  it('ranks Quest flip with sell speed and capital velocity', () => {
    const flip = calculateFlipScore({
      productId: QUEST_PRODUCT_ID,
      buyPrice: 385,
      askingPrice: 385,
      market: {
        median: 550,
        p25: 530,
        p75: 575,
        sampleCount: 10,
        priceDispersion: 0.08,
        askingLow: 530,
        askingHigh: 575,
      },
      confidence: {
        level: 'HIGH',
        reasons: [],
        identificationConfidence: 0.96,
        acceptedCount: 10,
        averageMatchQuality: 90,
        priceDispersion: 0.08,
      },
    })

    expect(flip.flipScore).not.toBeNull()
    expect(flip.flipScore!).toBeGreaterThanOrEqual(70)
    expect(flip.sellSpeed.label).not.toBe('UNKNOWN')
    expect(flip.sellSpeed.estimatedDaysLow).not.toBeNull()
    expect(flip.capitalVelocity.label).not.toBe('UNKNOWN')
    expect(flip.verdict).not.toBe('INSUFFICIENT_DATA')
    expect(flip.maxBuy).not.toBeNull()
    expect(flip.maxBuy!.maxBuy).toBeGreaterThan(0)
    expect(flip.actionVerdict).toBe('BUY')
    expect(flip.sellSpeed.disclaimer.toLowerCase()).toMatch(/disappear|confirmed/)
  })

  it('prefers faster capital turnover in velocity math', () => {
    const flip = calculateFlipScore({
      productId: QUEST_PRODUCT_ID,
      buyPrice: 500,
      market: {
        median: 550,
        p25: 530,
        p75: 575,
        sampleCount: 10,
        priceDispersion: 0.08,
        askingLow: 530,
        askingHigh: 575,
      },
      confidence: {
        level: 'HIGH',
        reasons: [],
        identificationConfidence: 0.96,
        acceptedCount: 10,
        averageMatchQuality: 90,
        priceDispersion: 0.08,
      },
    })

    expect(flip.capitalVelocity.profitPerDay).not.toBeNull()
    expect(flip.capitalVelocity.expectedDaysMid).toBeLessThan(20)
  })
})
