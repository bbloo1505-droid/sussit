import type { AnalysisResult } from '@/types/domain'

const KEY = 'sussit:analysis:'

export function saveAnalysis(analysis: AnalysisResult): void {
  sessionStorage.setItem(KEY + analysis.id, JSON.stringify(analysis))
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
