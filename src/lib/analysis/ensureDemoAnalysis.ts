import { TestPricingProvider } from '@/lib/pricing/TestPricingProvider'
import { runAnalysis } from '@/lib/valuation/runAnalysis'
import { loadAnalysis, saveAnalysis } from '@/lib/analysis/sessionStore'
import { questDemoProduct, QUEST_DEMO_ID } from '@/lib/analysis/questDemoProduct'
import type { AnalysisResult } from '@/types/domain'

export async function ensureDemoAnalysis(
  id: string = QUEST_DEMO_ID,
): Promise<AnalysisResult> {
  const existing = loadAnalysis(id)
  if (existing) return existing

  const analysis = await runAnalysis({
    product: questDemoProduct,
    pricing: new TestPricingProvider(),
    id,
  })
  saveAnalysis(analysis)
  return analysis
}
