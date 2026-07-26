import { formatAud } from '@/lib/utils'
import type { MockAnalysis } from '@/mocks/quest3-512'

export function ListingLine({ analysis }: { analysis: MockAnalysis }) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <span className="text-lg">🥽</span>
      <span>
        {analysis.productName} ·{' '}
        <strong className="font-semibold text-cream">
          {formatAud(analysis.askingPrice)}
        </strong>
      </span>
    </div>
  )
}
