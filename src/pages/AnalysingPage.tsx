import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { LoaderCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import {
  AnalysisStepper,
  type AnalysisStep,
} from '@/components/analysing/AnalysisStepper'
import { MOCK_ANALYSIS_ID } from '@/mocks/quest3-512'

const STEP_LABELS = [
  'Identified product',
  'Finding comparable 512GB',
  'Checking model & condition',
  'Calculating market range',
  'Building your offer',
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
      }, 350)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setActiveIndex((i) => i + 1)
    }, 650)

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
    <AppShell className="justify-between gap-10 pt-16">
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="font-display text-[2.125rem] font-extrabold tracking-[-0.5px]">
            Sussing it out…
          </h1>
          <p className="text-base text-muted">Better matches = better advice.</p>
        </div>
        <AnalysisStepper steps={steps} />
      </div>

      <div className="flex items-center justify-center gap-2 text-sm text-muted">
        <LoaderCircle className="h-4 w-4 animate-spin text-lime" />
        This usually takes 15–30 seconds.
      </div>
    </AppShell>
  )
}
