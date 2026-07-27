export type OutcomeDecision =
  | 'offer_less'
  | 'buy'
  | 'pass'
  | 'no_change'

export type AnalysisOutcome = {
  analysisId: string
  decision: OutcomeDecision
  changedDecision: boolean
  purchased: boolean | null
  actualPurchasePrice: number | null
  createdAt: string
}

const KEY = 'sussit:outcomes'

export function saveOutcome(outcome: AnalysisOutcome): void {
  const all = loadOutcomes()
  const next = [outcome, ...all.filter((o) => o.analysisId !== outcome.analysisId)]
  sessionStorage.setItem(KEY, JSON.stringify(next))
}

export function loadOutcomes(): AnalysisOutcome[] {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as AnalysisOutcome[]
  } catch {
    return []
  }
}

export function loadOutcome(analysisId: string): AnalysisOutcome | null {
  return loadOutcomes().find((o) => o.analysisId === analysisId) ?? null
}
