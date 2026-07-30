const KEY = 'sussit:recent-checks'
const MAX = 8

export type RecentCheck = {
  id: string
  label: string
  askingPrice: number
  at: string
}

function storageGet(): RecentCheck[] {
  if (typeof sessionStorage === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return []
    return JSON.parse(raw) as RecentCheck[]
  } catch {
    return []
  }
}

function storageSet(rows: RecentCheck[]) {
  if (typeof sessionStorage === 'undefined') return
  sessionStorage.setItem(KEY, JSON.stringify(rows))
}

export function pushRecentCheck(entry: Omit<RecentCheck, 'at'> & { at?: string }) {
  const next: RecentCheck = {
    ...entry,
    at: entry.at ?? new Date().toISOString(),
  }
  const rows = [next, ...storageGet().filter((r) => r.id !== next.id)].slice(
    0,
    MAX,
  )
  storageSet(rows)
}

export function loadRecentChecks(): RecentCheck[] {
  return storageGet()
}

export function latestRecentCheck(): RecentCheck | null {
  return storageGet()[0] ?? null
}
