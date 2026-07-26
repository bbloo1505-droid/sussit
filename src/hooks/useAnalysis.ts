import { useEffect, useState } from 'react'
import { ensureDemoAnalysis } from '@/lib/analysis/ensureDemoAnalysis'
import type { AnalysisResult } from '@/types/domain'

export function useAnalysis(id: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    ensureDemoAnalysis(id)
      .then((result) => {
        if (alive) setAnalysis(result)
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [id])

  return { analysis, loading }
}
