/** Deterministic PRNG (mulberry32) + helpers. Fixed seed → reproducible suites. */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!
}

export function pickN<T>(rng: () => number, items: readonly T[], n: number): T[] {
  const copy = [...items]
  const out: T[] = []
  while (out.length < n && copy.length > 0) {
    const i = Math.floor(rng() * copy.length)
    out.push(copy.splice(i, 1)[0]!)
  }
  return out
}

export function intBetween(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

export const EVAL_SEED = 20260727
