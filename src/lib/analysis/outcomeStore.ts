export type OutcomeDecision =
  | 'offer_less'
  | 'buy'
  | 'pass'
  | 'no_change'

/**
 * Ground-truth loop for real flipper validation.
 * Not every field is required — capture what the user knows now.
 */
export type AnalysisOutcome = {
  analysisId: string
  decision: OutcomeDecision
  changedDecision: boolean
  contactedSeller: boolean | null
  purchased: boolean | null
  actualPurchasePrice: number | null
  resold: boolean | null
  actualResalePrice: number | null
  /** ISO date when they resold (or null) */
  resoldAt: string | null
  /** User judgment: was SussIt's read correct? */
  verdictCorrect: boolean | null
  createdAt: string
  updatedAt: string
}

const KEY = 'sussit:outcomes'

export function saveOutcome(outcome: AnalysisOutcome): void {
  const all = loadOutcomes()
  const next = [
    outcome,
    ...all.filter((o) => o.analysisId !== outcome.analysisId),
  ]
  sessionStorage.setItem(KEY, JSON.stringify(next))
}

export function loadOutcomes(): AnalysisOutcome[] {
  const raw = sessionStorage.getItem(KEY)
  if (!raw) return []
  try {
    return (JSON.parse(raw) as AnalysisOutcome[]).map(normalizeOutcome)
  } catch {
    return []
  }
}

export function loadOutcome(analysisId: string): AnalysisOutcome | null {
  return loadOutcomes().find((o) => o.analysisId === analysisId) ?? null
}

/** Share of outcomes where the user said the verdict was correct. */
export function recommendationCorrectRate(
  outcomes: AnalysisOutcome[] = loadOutcomes(),
): number | null {
  const judged = outcomes.filter((o) => o.verdictCorrect != null)
  if (judged.length === 0) return null
  const correct = judged.filter((o) => o.verdictCorrect === true).length
  return correct / judged.length
}

function normalizeOutcome(raw: AnalysisOutcome): AnalysisOutcome {
  return {
    analysisId: raw.analysisId,
    decision: raw.decision,
    changedDecision: raw.changedDecision,
    contactedSeller: raw.contactedSeller ?? null,
    purchased: raw.purchased ?? null,
    actualPurchasePrice: raw.actualPurchasePrice ?? null,
    resold: raw.resold ?? null,
    actualResalePrice: raw.actualResalePrice ?? null,
    resoldAt: raw.resoldAt ?? null,
    verdictCorrect: raw.verdictCorrect ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? raw.createdAt,
  }
}
