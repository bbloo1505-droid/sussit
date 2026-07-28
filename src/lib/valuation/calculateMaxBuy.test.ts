import { describe, expect, it } from 'vitest'
import { calculateMaxBuy } from '@/lib/valuation/calculateMaxBuy'

describe('calculateMaxBuy', () => {
  it('caps by profit when ROI allows a higher buy', () => {
    const result = calculateMaxBuy({
      expectedResale: 580,
      rules: { minProfit: 100, minRoiPercent: 10 },
      feeBufferPercent: 0.12,
    })
    // net = 580 * 0.88 = 510.4; profit cap = 410.4 → 410
    expect(result.constrainedBy).toBe('PROFIT')
    expect(result.maxBuy).toBe(410)
  })

  it('caps by ROI when profit allows a higher buy', () => {
    const result = calculateMaxBuy({
      expectedResale: 580,
      rules: { minProfit: 50, minRoiPercent: 40 },
      feeBufferPercent: 0.12,
    })
    // net = 510.4; roi cap = 510.4 / 1.4 ≈ 364.6 → 365
    expect(result.constrainedBy).toBe('ROI')
    expect(result.maxBuy).toBe(365)
  })

  it('classifies BUY / NEGOTIATE / PASS from asking', () => {
    const base = {
      expectedResale: 580,
      rules: { minProfit: 100, minRoiPercent: 25 },
      feeBufferPercent: 0.12,
    }
    // net=510.4; profit=410.4; roi=408.32 → maxBuy 410
    expect(calculateMaxBuy({ ...base, askingPrice: 400 }).actionVerdict).toBe(
      'BUY',
    )
    expect(calculateMaxBuy({ ...base, askingPrice: 450 }).actionVerdict).toBe(
      'NEGOTIATE',
    )
    expect(calculateMaxBuy({ ...base, askingPrice: 520 }).actionVerdict).toBe(
      'PASS',
    )
  })
})
