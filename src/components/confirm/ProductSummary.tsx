import { formatAud } from '@/lib/utils'
import type { MockAnalysis } from '@/mocks/quest3-512'

type ProductSummaryProps = {
  analysis: MockAnalysis
}

export function ProductSummary({ analysis }: ProductSummaryProps) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-muted">We think this is a</p>
        <h1 className="mt-1 font-display text-[1.75rem] font-extrabold leading-tight tracking-[-0.3px]">
          {analysis.productName}
        </h1>
      </div>

      <div className="overflow-hidden rounded-3xl bg-cream text-ink">
        <div className="flex h-36 items-center justify-center bg-subtle">
          <div className="rounded-2xl bg-ink px-4 py-3 text-center">
            <p className="font-display text-sm font-bold text-lime">
              {analysis.brand}
            </p>
            <p className="text-xs text-white/70">
              {analysis.model} · {analysis.variant}
            </p>
          </div>
        </div>
        <div className="space-y-3 px-5 py-4">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-semibold">{analysis.productName}</p>
            <p className="font-display text-xl font-bold tabular-nums">
              {formatAud(analysis.askingPrice)}
            </p>
          </div>
          <dl className="space-y-2 border-t border-ink/10 pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Seller asking</dt>
              <dd className="font-semibold tabular-nums">
                {formatAud(analysis.askingPrice)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Condition</dt>
              <dd className="font-semibold">{analysis.condition}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Includes</dt>
              <dd className="text-right font-semibold">
                {analysis.includes.join(', ')}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
