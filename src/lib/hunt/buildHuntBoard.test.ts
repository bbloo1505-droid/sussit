import { beforeEach, describe, expect, it } from 'vitest'
import { clearLifecycleStore } from '@/lib/sellSpeed/lifecycleStore'
import { seedV0SellSpeedFixtures } from '@/lib/sellSpeed/seedQuestLifecycle'
import { buildHuntBoard } from '@/lib/hunt/buildHuntBoard'
import { DEFAULT_HUNT_RULES } from '@/types/hunt'

describe('buildHuntBoard', () => {
  beforeEach(() => {
    clearLifecycleStore()
    seedV0SellSpeedFixtures()
  })

  it('returns ranked opportunities under budget with Max Buy', async () => {
    const board = await buildHuntBoard({
      ...DEFAULT_HUNT_RULES,
      budget: 1000,
      minProfit: 80,
      minRoiPercent: 20,
      maxSellDays: 21,
    })

    expect(board.opportunities.length).toBeGreaterThanOrEqual(2)
    expect(board.huntList.length).toBeGreaterThanOrEqual(2)
    expect(board.categorySuggestions.length).toBeGreaterThan(0)
    expect(
      board.categorySuggestions.some((g) => g.searches.length > 0),
    ).toBe(true)
    for (const row of board.opportunities) {
      expect(row.maxBuy).toBeGreaterThan(0)
      expect(row.maxBuy).toBeLessThanOrEqual(1000)
      expect(row.flipScore).not.toBeNull()
      expect(row.excludedReason).toBeNull()
      expect(row.category).toBeTruthy()
    }
    expect(board.disclaimer.toLowerCase()).toMatch(/asking|guide/)
  })

  it('filters category suggestions when a category is selected', async () => {
    const board = await buildHuntBoard({
      ...DEFAULT_HUNT_RULES,
      categories: ['phone'],
      budget: 1000,
      minProfit: 50,
      minRoiPercent: 15,
      maxSellDays: 21,
    })
    expect(board.categorySuggestions.every((g) => g.category === 'phone')).toBe(
      true,
    )
  })
})
