import { DEFAULT_HUNT_RULES, type HuntRules } from '@/types/hunt'

const KEY = 'sussit:hunt-rules'
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

export function loadHuntRules(): HuntRules {
  const raw = storageGet(KEY)
  if (!raw) return { ...DEFAULT_HUNT_RULES }
  try {
    return { ...DEFAULT_HUNT_RULES, ...(JSON.parse(raw) as Partial<HuntRules>) }
  } catch {
    return { ...DEFAULT_HUNT_RULES }
  }
}

export function saveHuntRules(rules: HuntRules) {
  storageSet(KEY, JSON.stringify(rules))
}

export function updateHuntRules(partial: Partial<HuntRules>): HuntRules {
  const next = { ...loadHuntRules(), ...partial }
  saveHuntRules(next)
  return next
}
