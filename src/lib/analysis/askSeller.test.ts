import { describe, expect, it } from 'vitest'
import {
  buildAskSellerMessage,
  buildAskSellerPrompts,
  shouldShowAskSeller,
} from '@/lib/analysis/askSeller'
import type { AnalysisResult, IdentifiedProduct } from '@/types/domain'

function phone(partial: Partial<IdentifiedProduct> = {}): IdentifiedProduct {
  return {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15',
    variant: null,
    askingPrice: 720,
    currency: 'AUD',
    condition: 'unknown',
    location: 'Sydney',
    includedAccessories: [],
    missingInformation: [],
    sellerClaims: [],
    visibleIssues: [],
    identificationConfidence: 0.72,
    ...partial,
  }
}

describe('buildAskSellerPrompts', () => {
  it('asks for storage and battery on a phone without variant', () => {
    const prompts = buildAskSellerPrompts(phone())
    const labels = prompts.map((p) => p.label)
    expect(labels).toContain('Storage')
    expect(labels).toContain('Battery health')
    expect(labels).toContain('Condition')
  })

  it('skips storage when capacity is already known', () => {
    const prompts = buildAskSellerPrompts(phone({ variant: '128GB' }))
    expect(prompts.map((p) => p.label)).not.toContain('Storage')
  })

  it('asks disc vs digital for ambiguous PS5', () => {
    const prompts = buildAskSellerPrompts({
      ...phone(),
      category: 'console',
      brand: 'Sony',
      model: 'PlayStation 5',
      variant: null,
      condition: 'used_good',
    })
    expect(prompts.map((p) => p.label)).toContain('Disc or Digital')
  })

  it('builds a paste-ready seller message', () => {
    const message = buildAskSellerMessage(buildAskSellerPrompts(phone()))
    expect(message).toMatch(/interested/i)
    expect(message).toMatch(/storage|128GB|battery/i)
  })
})

describe('shouldShowAskSeller', () => {
  it('shows on insufficient verdicts', () => {
    const analysis = {
      deal: { verdictLabel: 'INSUFFICIENT DATA' },
      confidence: { level: 'INSUFFICIENT' },
      product: phone({ variant: '128GB', condition: 'used_good' }),
    } as AnalysisResult
    expect(shouldShowAskSeller(analysis)).toBe(true)
  })
})
