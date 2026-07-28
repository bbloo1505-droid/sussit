/**
 * SussIt Eval Lab — shared types.
 * Offline-first; never mutates production algorithms or Supabase.
 */

import type {
  IdentifiedProduct,
  ProductCategory,
  ProductCondition,
} from '@/types/domain'

export type MatchExpectation = 'EXPECTED_INCLUDE' | 'EXPECTED_EXCLUDE' | 'AMBIGUOUS'

export type EvalSuite =
  | 'identification'
  | 'matching'
  | 'adversarial'
  | 'valuation'
  | 'verdict'
  | 'low_info'
  | 'ebay_replay'

export type EvalCaseBase = {
  id: string
  suite: EvalSuite
  category: ProductCategory | 'unknown' | 'ambiguous'
  modelKey: string
  description: string
}

export type IdentificationCase = EvalCaseBase & {
  suite: 'identification'
  inputText: string
  expected: {
    category: ProductCategory
    brand: string
    model: string
    variant: string | null
    storageGb: number | null
    condition: ProductCondition | null
    minConfidence?: number
    maxConfidence?: number
    mustNotBeHighConfidence?: boolean
  }
}

export type MatchingCase = EvalCaseBase & {
  suite: 'matching' | 'adversarial'
  target: IdentifiedProduct
  candidate: {
    title: string
    price: number
    condition: ProductCondition | null
    includedAccessories?: string[]
  }
  expectation: MatchExpectation
  tags: string[]
}

export type ValuationCase = EvalCaseBase & {
  suite: 'valuation'
  target: IdentifiedProduct
  prices: number[]
  /** Prices that must remain excluded / not dominate */
  outlierPrices?: number[]
  asserts: {
    minSample?: number
    medianMin?: number
    medianMax?: number
    maxDispersion?: number
    /** Median must not move more than this fraction when outliers added */
    outlierMedianShiftMax?: number
  }
}

export type VerdictCase = EvalCaseBase & {
  suite: 'verdict'
  product: IdentifiedProduct
  marketMedian: number
  marketP25: number
  marketP75: number
  sampleCount: number
  askingPrices: number[]
}

export type LowInfoCase = EvalCaseBase & {
  suite: 'low_info'
  inputText: string
}

export type EbayReplayCase = EvalCaseBase & {
  suite: 'ebay_replay'
  fixturePath: string
  target: IdentifiedProduct
  minIncluded?: number
  maxAccessoryContamination?: number
}

export type AnyEvalCase =
  | IdentificationCase
  | MatchingCase
  | ValuationCase
  | VerdictCase
  | LowInfoCase
  | EbayReplayCase

export type CaseResult = {
  id: string
  suite: EvalSuite
  category: string
  modelKey: string
  description: string
  passed: boolean
  severity: 'fail' | 'warn' | 'pass'
  reasons: string[]
  metrics?: Record<string, number | string | boolean | null>
}

export type SuiteSummary = {
  suite: EvalSuite
  total: number
  passed: number
  failed: number
  warned: number
  score: number
  metrics: Record<string, number>
}

export type EvalReport = {
  generatedAt: string
  mode: 'offline' | 'live'
  seed: number
  totalCases: number
  totalPassed: number
  totalFailed: number
  totalWarned: number
  overallScore: number
  runtimeMs: number
  suites: SuiteSummary[]
  byCategory: Record<
    string,
    { total: number; passed: number; failed: number; score: number }
  >
  byModel: Record<
    string,
    { total: number; passed: number; failed: number; score: number }
  >
  failures: CaseResult[]
  previous?: {
    overallScore: number
    totalFailed: number
    generatedAt: string
  } | null
  regressions: Array<{
    id: string
    description: string
    was: string
    now: string
  }>
  highlights: {
    identificationAccuracy: number
    comparablePrecision: number
    comparableRecall: number
    badCompRejectionRate: number
    wrongModelContamination: number
    accessoryContamination: number
    valuationFailures: number
    verdictConsistencyFailures: number
    lowConfidenceFailures: number
  }
}
