import { describe, expect, it, beforeEach } from 'vitest'
import {
  clearFlipPositions,
  closeFlipPosition,
  openPositions,
  portfolioSummary,
  recordFlipBuy,
} from '@/lib/flip/flipLedger'
import { clearUserSales } from '@/lib/sellSpeed/recordUserSale'
import { buildAssistantBrief } from '@/lib/flip/assistantBrief'

describe('flipLedger', () => {
  beforeEach(() => {
    clearFlipPositions()
    clearUserSales()
  })

  it('tracks open buy then closes with profit', () => {
    const buy = recordFlipBuy({
      productId: 'TEST_SKU',
      productLabel: 'Test Item',
      purchasePrice: 400,
      purchaseAt: new Date('2026-07-01').toISOString(),
      targetResale: 520,
    })
    expect(openPositions()).toHaveLength(1)
    expect(portfolioSummary().capitalInStock).toBe(400)

    const { sale } = closeFlipPosition({
      positionId: buy.id,
      salePrice: 520,
      saleAt: new Date('2026-07-10').toISOString(),
      channel: 'marketplace',
    })
    expect(sale.salePrice - sale.purchasePrice).toBe(120)
    expect(openPositions()).toHaveLength(0)
    expect(portfolioSummary().realizedProfit).toBe(120)
    expect(portfolioSummary().closedCount).toBe(1)
  })
})

describe('assistantBrief', () => {
  beforeEach(() => {
    clearFlipPositions()
    clearUserSales()
  })

  it('flags stuck stock and empty capital message', () => {
    const empty = buildAssistantBrief({})
    expect(empty.actions.some((a) => a.id === 'empty')).toBe(true)

    recordFlipBuy({
      productId: 'STUCK',
      productLabel: 'Stuck Switch',
      purchasePrice: 250,
      purchaseAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    })
    const brief = buildAssistantBrief({})
    expect(brief.stuck.length).toBeGreaterThan(0)
    expect(brief.actions.some((a) => a.tone === 'alert')).toBe(true)
    expect(brief.summary.capitalInStock).toBe(250)
  })
})
