import { describe, expect, it } from 'vitest'
import {
  buildSearchQuery,
  enrichBrowseQuery,
} from './buildBrowseQuery.ts'

describe('buildSearchQuery', () => {
  it('adds headset + VR negations for Quest 3 512GB', () => {
    const q = buildSearchQuery({
      brand: 'Meta',
      model: 'Quest 3',
      variant: '512GB',
      category: 'vr_headset',
    })
    expect(q).toMatch(/Quest 3 512GB/i)
    expect(q).toMatch(/headset/i)
    expect(q).toMatch(/-dock|-bobovr/)
    expect(q).toMatch(/-3S|-3s/)
    expect(q).not.toMatch(/^Meta /i)
  })

  it('suppresses cases for iPhone 15 Pro', () => {
    const q = buildSearchQuery({
      brand: 'Apple',
      model: 'iPhone 15 Pro',
      variant: '256GB',
      category: 'phone',
    })
    expect(q).toMatch(/iPhone 15 Pro 256GB/i)
    expect(q).toMatch(/-case/)
    expect(q).toMatch(/-Max/)
    expect(q).not.toMatch(/-Pro\b/)
  })

  it('builds PS5 Slim Disc without Digital/Pro noise', () => {
    const q = buildSearchQuery({
      brand: 'Sony',
      model: 'PlayStation 5 Slim',
      variant: 'Disc',
      category: 'console',
    })
    expect(q).toMatch(/PS5 Slim Disc/i)
    expect(q).toMatch(/console/i)
    expect(q).toMatch(/-Digital/)
    expect(q).toMatch(/-Pro/)
    expect(q).toMatch(/-Drive/)
  })

  it('builds PlayStation 5 Pro query that suppresses PES / game noise', () => {
    const q = buildSearchQuery({
      brand: 'Sony',
      model: 'PlayStation 5 Pro',
      variant: null,
      category: 'console',
    })
    expect(q).toMatch(/PlayStation 5 Pro/i)
    expect(q).toMatch(/console/i)
    expect(q).toMatch(/-Slim/)
    expect(q).toMatch(/-PES|-Soccer|-PS2/)
    expect(q).toMatch(/-Hawk|-Tony/)
  })

  it('builds Slim Digital without Disc/Pro', () => {
    const q = buildSearchQuery({
      brand: 'Sony',
      model: 'PlayStation 5 Slim',
      variant: 'Digital',
      category: 'console',
    })
    expect(q).toMatch(/PS5 Slim Digital/i)
    expect(q).toMatch(/-Disc/)
    expect(q).toMatch(/-Pro/)
  })

  it('enrichBrowseQuery is idempotent on negations', () => {
    const once = enrichBrowseQuery('iPhone 15 Pro 256GB', 'phone')
    const twice = enrichBrowseQuery(once, 'phone')
    expect(twice).toBe(once)
  })
})
