import { describe, expect, it } from 'vitest'
import { heuristicExtractFromText } from './heuristicExtract.ts'

describe('heuristicExtractFromText', () => {
  it('parses a Quest 3 Marketplace paste', () => {
    const listing = heuristicExtractFromText(
      'Meta Quest 3 512GB for sale $520 Sydney. Used good condition with controllers.',
    )
    expect(listing).not.toBeNull()
    expect(listing!.brand).toBe('Meta')
    expect(listing!.model).toBe('Quest 3')
    expect(listing!.variant).toBe('512GB')
    expect(listing!.askingPrice).toBe(520)
    expect(listing!.location).toBe('Sydney')
  })

  it('parses Switch OLED', () => {
    const listing = heuristicExtractFromText(
      'Nintendo Switch OLED white $270 Melbourne like new',
    )
    expect(listing!.model).toBe('Switch OLED')
    expect(listing!.askingPrice).toBe(270)
    expect(listing!.condition).toBe('used_like_new')
  })

  it('returns null without a price', () => {
    expect(heuristicExtractFromText('Quest 3 512GB for sale')).toBeNull()
  })

  it('parses Makita power tool', () => {
    const listing = heuristicExtractFromText(
      'Makita 18V impact driver kit $185 Brisbane with batteries',
    )
    expect(listing).not.toBeNull()
    expect(listing!.brand).toBe('Makita')
    expect(listing!.category).toBe('power_tool')
    expect(listing!.askingPrice).toBe(185)
  })

  it('parses IKEA furniture via generic path', () => {
    const listing = heuristicExtractFromText(
      'IKEA Kivik 3 seater sofa grey $450 Melbourne pickup',
    )
    expect(listing).not.toBeNull()
    expect(listing!.brand).toBe('IKEA')
    expect(listing!.category).toBe('furniture')
    expect(listing!.askingPrice).toBe(450)
    expect(listing!.model!.toLowerCase()).toMatch(/kivik|sofa|furniture/)
  })

  it('parses unbranded furniture with a price', () => {
    const listing = heuristicExtractFromText(
      'Solid timber dining table 6 seater $320 Sydney',
    )
    expect(listing).not.toBeNull()
    expect(listing!.category).toBe('furniture')
    expect(listing!.askingPrice).toBe(320)
    expect(listing!.model!.length).toBeGreaterThan(3)
  })
})
