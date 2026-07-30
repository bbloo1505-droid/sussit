import { cn } from '@/lib/utils'

type PriceJudgementBarProps = {
  /** Asking price marker position 0–100 */
  askPercent: number
  className?: string
  /** Compact label row under the bar */
  showZones?: boolean
}

/**
 * SussIt brand device — price range with good / fair / bad zones
 * and a lime judgement notch for the asking price.
 */
export function PriceJudgementBar({
  askPercent,
  className,
  showZones = true,
}: PriceJudgementBarProps) {
  const clamped = Math.max(4, Math.min(96, askPercent))

  return (
    <div className={cn('w-full', className)}>
      <div className="relative h-2.5 overflow-hidden rounded-[10px] bg-ink">
        <div
          className="absolute inset-y-0 left-0 bg-[#2f5d2a]"
          style={{ width: '38%' }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 bg-[#5c5a22]"
          style={{ left: '38%', width: '32%' }}
          aria-hidden
        />
        <div
          className="absolute inset-y-0 right-0 bg-[#5a2e24]"
          style={{ left: '70%' }}
          aria-hidden
        />
        {/* Lime judgement notch */}
        <div
          className="absolute top-1/2 z-10 h-4 w-[3px] -translate-y-1/2 rounded-full bg-lime shadow-[0_0_0_3px_rgba(9,11,9,0.9)] transition-[left] duration-500 ease-out"
          style={{ left: `calc(${clamped}% - 1.5px)` }}
          aria-hidden
        />
      </div>
      {showZones ? (
        <div className="mt-2 flex justify-between text-[11px] tracking-wide text-muted">
          <span>Good</span>
          <span>Fair</span>
          <span>High</span>
        </div>
      ) : null}
    </div>
  )
}
