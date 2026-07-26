import { formatAud } from '@/lib/utils'

type PriceStackProps = {
  comparableLow: number
  comparableHigh: number
  suggestedOffer: number
  goodBuyPrice: number
}

export function PriceStack({
  comparableLow,
  comparableHigh,
  suggestedOffer,
  goodBuyPrice,
}: PriceStackProps) {
  return (
    <dl className="space-y-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-sm text-muted">Comparable asking range</dt>
        <dd className="text-base font-semibold tabular-nums">
          {formatAud(comparableLow)} – {formatAud(comparableHigh)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-sm text-muted">Suggested opening offer</dt>
        <dd className="font-display text-2xl font-extrabold tabular-nums text-lime">
          {formatAud(suggestedOffer)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <dt className="text-sm text-muted">Good-buy price</dt>
        <dd className="text-base font-semibold tabular-nums">
          ≤ {formatAud(goodBuyPrice)}
        </dd>
      </div>
    </dl>
  )
}
