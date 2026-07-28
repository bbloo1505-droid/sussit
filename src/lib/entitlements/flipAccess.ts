/** Flip subscription gate. Stripe later — demo unlock for local/dev. */

const KEY = 'sussit:flip-subscription'
const memory = new Map<string, string>()

function storageGet(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key)
  }
  return memory.get(key) ?? null
}

function storageSet(key: string, value: string) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, value)
    return
  }
  memory.set(key, value)
}

export function hasFlipSubscription(): boolean {
  return storageGet(KEY) === 'active'
}

/** Demo unlock until Stripe billing exists */
export function activateFlipSubscriptionDemo() {
  storageSet(KEY, 'active')
}

export function clearFlipSubscription() {
  storageSet(KEY, '')
}
