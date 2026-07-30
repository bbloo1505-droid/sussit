import { describe, expect, it } from 'vitest'
import {
  FLIP_CATEGORY_PLAYBOOKS,
  playbooksForCategories,
} from '@/lib/hunt/flipPlaybooks'

describe('flipPlaybooks', () => {
  it('covers core flip categories with searchable queries', () => {
    const cats = FLIP_CATEGORY_PLAYBOOKS.map((p) => p.category)
    expect(cats).toContain('phone')
    expect(cats).toContain('console')
    expect(cats).toContain('vr_headset')
    expect(cats).toContain('audio')
    for (const book of FLIP_CATEGORY_PLAYBOOKS) {
      expect(book.searches.length).toBeGreaterThan(0)
      for (const s of book.searches) {
        expect(s.searchQuery.length).toBeGreaterThan(3)
        expect(s.guideMaxBuy).toBeGreaterThan(0)
      }
    }
  })

  it('filters playbooks by selected categories', () => {
    const phones = playbooksForCategories(['phone'])
    expect(phones).toHaveLength(1)
    expect(phones[0]!.category).toBe('phone')
  })
})
