import { TestPricingProvider } from '@/lib/pricing/TestPricingProvider'
import { runAnalysis } from '@/lib/valuation/runAnalysis'
import { loadAnalysis, saveAnalysis } from '@/lib/analysis/sessionStore'
import { loadDraft } from '@/lib/analysis/draftStore'
import { questDemoProduct, QUEST_DEMO_ID } from '@/lib/analysis/questDemoProduct'
import type { AnalysisResult, IdentifiedProduct } from '@/types/domain'

export async function runAndSaveAnalysis(input: {
  product: IdentifiedProduct
  id?: string
}): Promise<AnalysisResult> {
  const analysis = await runAnalysis({
    product: input.product,
    pricing: new TestPricingProvider(),
    id: input.id,
  })
  saveAnalysis(analysis)
  return analysis
}

/** Prefer draft product from extract/confirm; fall back to Quest demo. */
export async function ensureDemoAnalysis(
  id: string = QUEST_DEMO_ID,
): Promise<AnalysisResult> {
  const existing = loadAnalysis(id)
  if (existing) return existing

  const draft = loadDraft()
  return runAndSaveAnalysis({
    product: draft ?? questDemoProduct,
    id,
  })
}
