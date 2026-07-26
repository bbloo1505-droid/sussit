import { formatAud } from '@/lib/utils'

type PriceStackProps = {
  askingPrice: number
  comparableLow: number
  comparableHigh: number
  suggestedOffer: number
}

export function PriceStack({
  askingPrice,
  comparableLow,
  comparableHigh,
  suggestedOffer,
}: PriceStackProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted">Seller asking</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatAud(askingPrice)}
        </span>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm text-muted">Comparable asking range</span>
        <span className="text-lg font-semibold tabular-nums">
          {formatAud(comparableLow)}–{formatAud(comparableHigh)}
        </span>
      </div>
      <div className="border-t border-ink/10 pt-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-ink">Suggested offer</span>
          <span className="font-display text-4xl font-extrabold tabular-nums tracking-tight">
            {formatAud(suggestedOffer)}
          </span>
        </div>
      </div>
    </div>
  )
}
