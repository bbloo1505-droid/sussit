/** Flip subscription plans. Stripe later — demo unlock for local/dev. */

export type FlipPlan = 'none' | 'flip' | 'pro' | 'assistant'

const KEY = 'sussit:flip-plan'
/** Legacy boolean unlock from earlier builds */
const LEGACY_KEY = 'sussit:flip-subscription'
const memory = new Map<string, string>()

const PLAN_RANK: Record<FlipPlan, number> = {
  none: 0,
  flip: 1,
  pro: 2,
  assistant: 3,
}

function storageGet(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    const v = sessionStorage.getItem(key)
    if (v !== null) return v
  }
  return memory.get(key) ?? null
}

function storageSet(key: string, value: string) {
  memory.set(key, value)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, value)
  }
}

function storageRemove(key: string) {
  memory.delete(key)
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(key)
  }
}

function parsePlan(raw: string | null): FlipPlan | null {
  if (raw === 'flip' || raw === 'pro' || raw === 'assistant' || raw === 'none') {
    return raw
  }
  return null
}

/** Current plan, migrating legacy `active` unlock → `flip`. */
export function getFlipPlan(): FlipPlan {
  const plan = parsePlan(storageGet(KEY))
  if (plan) return plan

  if (storageGet(LEGACY_KEY) === 'active') {
    storageSet(KEY, 'flip')
    return 'flip'
  }

  return 'none'
}

export function planAtLeast(plan: FlipPlan, min: FlipPlan): boolean {
  return PLAN_RANK[plan] >= PLAN_RANK[min]
}

export function hasFlipAccess(): boolean {
  return planAtLeast(getFlipPlan(), 'flip')
}

export function hasFlipPro(): boolean {
  return planAtLeast(getFlipPlan(), 'pro')
}

export function hasFlipAssistant(): boolean {
  return planAtLeast(getFlipPlan(), 'assistant')
}

/** @deprecated use hasFlipAccess */
export function hasFlipSubscription(): boolean {
  return hasFlipAccess()
}

export function activateFlipPlanDemo(plan: Exclude<FlipPlan, 'none'>) {
  storageSet(KEY, plan)
  storageSet(LEGACY_KEY, 'active')
}

/** @deprecated use activateFlipPlanDemo('flip') */
export function activateFlipSubscriptionDemo() {
  activateFlipPlanDemo('flip')
}

export function clearFlipSubscription() {
  storageRemove(KEY)
  storageRemove(LEGACY_KEY)
}

/** Test/migrate helper: legacy boolean unlock with no plan key. */
export function setLegacyFlipUnlock() {
  storageRemove(KEY)
  storageSet(LEGACY_KEY, 'active')
}

export const FLIP_PLAN_META: Record<
  Exclude<FlipPlan, 'none'>,
  {
    name: string
    priceLabel: string
    tagline: string
    features: string[]
  }
> = {
  flip: {
    name: 'Flip',
    priceLabel: '$5',
    tagline: 'Hunt board + Max Buy',
    features: [
      'Today’s Top Flips with Max Buy',
      'Category search suggestions',
      'Listing Flip read: BUY / NEGOTIATE / PASS',
    ],
  },
  pro: {
    name: 'Flip Pro',
    priceLabel: '$9.99',
    tagline: 'Track every flip + profit',
    features: [
      'Everything in Flip',
      'Open inventory log',
      'Closed flips + P&L stats',
      'Capital and days-to-sell tracking',
    ],
  },
  assistant: {
    name: 'Flip Assistant',
    priceLabel: '$19.99',
    tagline: 'Your flipping desk',
    features: [
      'Everything in Pro',
      'Daily coach brief',
      'Stuck stock + capital alerts',
      'Next hunts matched to free capital',
    ],
  },
}
