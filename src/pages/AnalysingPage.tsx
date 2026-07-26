import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { BrandMark } from '@/components/layout/BrandMark'
import { ListingLine } from '@/components/shared/ListingLine'
import { MOCK_ANALYSIS_ID, quest3512Analysis } from '@/mocks/quest3-512'
import { cn } from '@/lib/utils'

const STEPS = [
  'Finding current eBay Australia listings',
  'Checking listing quality',
  'Calculating a fair offer',
  'Assessing this listing',
] as const

export function AnalysingPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const id = params.get('id') ?? MOCK_ANALYSIS_ID
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setProgress(0)
    let current = 0
    const timer = window.setInterval(() => {
      current += 1
      setProgress(current)
      if (current === STEPS.length) {
        window.clearInterval(timer)
        window.setTimeout(() => navigate(`/result/${id}`, { replace: true }), 550)
      }
    }, 850)
    return () => window.clearInterval(timer)
  }, [id, navigate])

  return (
    <div className="flex min-h-full flex-col px-6 pt-5 pb-9">
      <BrandMark />
      <main className="flex flex-1 flex-col justify-center">
        <h1 className="font-display text-[42px] leading-[0.98] font-black tracking-[-0.04em] text-cream">
          Sussing it
          <br />
          <span className="text-lime">out…</span>
        </h1>
        <div className="mt-4">
          <ListingLine analysis={quest3512Analysis} />
        </div>
        <div className="mt-14 space-y-5">
          {STEPS.map((step, index) => {
            const complete = index < progress
            const active = index === progress
            return (
              <div className="flex items-center gap-4" key={step}>
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-full border',
                    complete && 'border-lime bg-lime text-ink',
                    active && 'border-2 border-lime text-lime',
                    !complete && !active && 'border-white/15 text-transparent',
                  )}
                >
                  {complete ? (
                    <Check size={15} strokeWidth={3} />
                  ) : active ? (
                    <span className="size-2 animate-pulse rounded-full bg-lime" />
                  ) : null}
                </span>
                <span
                  className={cn(
                    'text-[16px]',
                    complete || active
                      ? 'font-medium text-cream'
                      : 'text-muted',
                  )}
                >
                  {step}
                </span>
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
