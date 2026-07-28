import { describe, expect, it, beforeEach } from 'vitest'
import { clearLifecycleStore, loadLifecycles } from '@/lib/sellSpeed/lifecycleStore'
import {
  clearUserSales,
  recordUserConfirmedSale,
  loadUserSales,
} from '@/lib/sellSpeed/recordUserSale'

describe('recordUserConfirmedSale', () => {
  beforeEach(() => {
    clearLifecycleStore()
    clearUserSales()
  })

  it('stores a confirmed sale lifecycle with HIGH confidence', () => {
    const report = recordUserConfirmedSale({
      analysisId: 'a1',
      productId: 'META_QUEST_3_512',
      productLabel: 'Quest 3 512GB',
      purchasePrice: 420,
      purchaseAt: '2026-07-01T00:00:00.000Z',
      salePrice: 560,
      saleAt: '2026-07-05T00:00:00.000Z',
      channel: 'marketplace',
    })

    expect(report.daysToSell).toBe(4)
    expect(loadUserSales()).toHaveLength(1)

    const life = loadLifecycles().find((l) => l.source === 'user')
    expect(life?.outcome).toBe('CONFIRMED_SOLD')
    expect(life?.outcomeConfidence).toBe('HIGH')
    expect(life?.confirmedSalePrice).toBe(560)
    expect(life?.durationHours).toBe(96)
  })
})
