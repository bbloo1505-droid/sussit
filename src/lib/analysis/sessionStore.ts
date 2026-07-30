import type { AnalysisResult } from '@/types/domain'
import { pushRecentCheck } from '@/lib/analysis/recentChecks'

const KEY = 'sussit:analysis:'

export function saveAnalysis(analysis: AnalysisResult): void {
  sessionStorage.setItem(KEY + analysis.id, JSON.stringify(analysis))
  pushRecentCheck({
    id: analysis.id,
    label: analysis.productLabel,
    askingPrice: analysis.product.askingPrice,
  })
}

export function loadAnalysis(id: string): AnalysisResult | null {
  const raw = sessionStorage.getItem(KEY + id)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AnalysisResult
  } catch {
    return null
  }
}
