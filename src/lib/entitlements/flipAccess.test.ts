import { describe, expect, it, beforeEach } from 'vitest'
import {
  activateFlipPlanDemo,
  clearFlipSubscription,
  getFlipPlan,
  hasFlipAccess,
  hasFlipAssistant,
  hasFlipPro,
  planAtLeast,
  setLegacyFlipUnlock,
} from '@/lib/entitlements/flipAccess'

describe('flipAccess plans', () => {
  beforeEach(() => {
    clearFlipSubscription()
  })

  it('starts at none', () => {
    expect(getFlipPlan()).toBe('none')
    expect(hasFlipAccess()).toBe(false)
  })

  it('ranks plans correctly', () => {
    expect(planAtLeast('pro', 'flip')).toBe(true)
    expect(planAtLeast('flip', 'pro')).toBe(false)
    expect(planAtLeast('assistant', 'pro')).toBe(true)
  })

  it('activates flip / pro / assistant', () => {
    activateFlipPlanDemo('flip')
    expect(hasFlipAccess()).toBe(true)
    expect(hasFlipPro()).toBe(false)

    activateFlipPlanDemo('pro')
    expect(hasFlipPro()).toBe(true)
    expect(hasFlipAssistant()).toBe(false)

    activateFlipPlanDemo('assistant')
    expect(hasFlipAssistant()).toBe(true)
    expect(getFlipPlan()).toBe('assistant')
  })

  it('migrates legacy active unlock to flip', () => {
    setLegacyFlipUnlock()
    expect(getFlipPlan()).toBe('flip')
    expect(hasFlipAccess()).toBe(true)
  })
})
