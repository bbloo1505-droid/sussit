import { formatAud } from '@/lib/utils'
import type { MockAnalysis } from '@/mocks/quest3-512'

type ProductSummaryProps = {
  analysis: MockAnalysis
}

export function ProductSummary({ analysis }: ProductSummaryProps) {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium text-muted">We think this is a</p>
        <h1 className="mt-2 font-display text-[2rem] font-extrabold leading-[1.1] tracking-tight">
          {analysis.productName}
        </h1>
      </div>

      <dl className="space-y-4 border-t border-ink/10 pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted">Seller asking</dt>
          <dd className="font-display text-2xl font-bold tabular-nums">
            {formatAud(analysis.askingPrice)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted">Condition</dt>
          <dd className="text-base font-semibold">{analysis.condition}</dd>
        </div>
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm text-muted">Includes</dt>
          <dd className="text-right text-base font-semibold">
            {analysis.includes.join(', ')}
          </dd>
        </div>
      </dl>
    </div>
  )
}
