import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BrandMark } from '@/components/layout/BrandMark'
import {
  AnalysisStepper,
  type AnalysisStep,
} from '@/components/analysing/AnalysisStepper'
import { MOCK_ANALYSIS_ID } from '@/mocks/quest3-512'

const STEP_LABELS = [
  'Identified product',
  'Finding comparisons',
  'Checking model',
  'Calculating market range',
] as const

export function AnalysingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id') ?? MOCK_ANALYSIS_ID
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    if (activeIndex >= STEP_LABELS.length) {
      const timer = window.setTimeout(() => {
        navigate(`/result/${id}`, { replace: true })
      }, 400)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((i) => i + 1)
    }, 700)

    return () => window.clearTimeout(timer)
  }, [activeIndex, id, navigate])

  const steps: AnalysisStep[] = useMemo(
    () =>
      STEP_LABELS.map((label, index) => ({
        id: String(index),
        label,
        status:
          index < activeIndex
            ? 'done'
            : index === activeIndex
              ? 'active'
              : 'pending',
      })),
    [activeIndex],
  )

  return (
    <AppShell dark className="justify-center gap-10">
      <BrandMark light />
      <div className="space-y-8">
        <h1 className="font-display text-4xl font-extrabold tracking-tight">
          Sussing it out…
        </h1>
        <AnalysisStepper steps={steps} />
      </div>
    </AppShell>
  )
}
