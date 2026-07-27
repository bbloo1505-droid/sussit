import { useEffect, useState } from 'react'
import { ensureDemoAnalysis } from '@/lib/analysis/ensureDemoAnalysis'
import { loadAnalysis } from '@/lib/analysis/sessionStore'
import type { AnalysisResult } from '@/types/domain'

export function useAnalysis(id: string | undefined) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(() =>
    id ? loadAnalysis(id) : null,
  )
  const [loading, setLoading] = useState(!analysis)

  useEffect(() => {
    let alive = true
    const cached = id ? loadAnalysis(id) : null
    if (cached) {
      setAnalysis(cached)
      setLoading(false)
      return
    }

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
