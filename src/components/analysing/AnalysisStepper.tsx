import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type AnalysisStep = {
  id: string
  label: string
  status: 'done' | 'active' | 'pending'
}

type AnalysisStepperProps = {
  steps: AnalysisStep[]
}

export function AnalysisStepper({ steps }: AnalysisStepperProps) {
  return (
    <ol className="space-y-4">
      {steps.map((step) => (
        <li key={step.id} className="flex items-center gap-3">
          <span
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm',
              step.status === 'done' && 'bg-lime text-ink',
              step.status === 'active' && 'border-2 border-lime text-lime',
              step.status === 'pending' && 'border border-cream/20 text-cream/30',
            )}
          >
            {step.status === 'done' ? (
              <Check className="h-4 w-4" strokeWidth={2.5} />
            ) : step.status === 'active' ? (
              <span className="h-2 w-2 animate-pulse rounded-full bg-lime" />
            ) : null}
          </span>
          <span
            className={cn(
              'text-base',
              step.status === 'pending' ? 'text-cream/35' : 'text-cream',
              step.status === 'active' && 'font-semibold',
            )}
          >
            {step.label}
          </span>
        </li>
      ))}
    </ol>
  )
}
