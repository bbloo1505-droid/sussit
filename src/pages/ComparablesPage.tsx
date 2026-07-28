import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { formatAud, cn } from '@/lib/utils'
import { useAnalysis } from '@/hooks/useAnalysis'
import { excludedComps, includedComps } from '@/lib/analysis/viewModel'

export function ComparablesPage() {
  const { id = '' } = useParams()
  const { analysis, loading } = useAnalysis(id)
  const [tab, setTab] = useState<'included' | 'excluded'>('included')

  if (loading || !analysis) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-muted">
        Loading…
      </div>
    )
  }

  const included = includedComps(analysis)
  const excluded = excludedComps(analysis)
  const list = tab === 'included' ? included : excluded

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo={`/result/${id}`} detail="COMPS" />
      <h1 className="font-display text-[33px] leading-none font-black tracking-[-0.04em] text-cream">
        Current listings
      </h1>
      <p className="mt-3 max-w-[320px] text-[14px] leading-5 text-muted">
        {analysis.assessments.some((a) => a.comparable.source === 'ebay')
          ? 'These are current eBay Australia asking prices — not completed sale values.'
          : 'Showing offline fixture comps (live eBay unavailable or returned no usable matches). Asking prices only — not solds.'}
      </p>

      <div className="mt-6 flex gap-6 border-b border-white/10">
        <button
          type="button"
          onClick={() => setTab('included')}
          className={cn(
            'border-b-2 pb-3 text-sm font-semibold transition',
            tab === 'included'
              ? 'border-lime text-cream'
              : 'border-transparent text-muted',
          )}
        >
          Included ({included.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('excluded')}
          className={cn(
            'border-b-2 pb-3 text-sm font-semibold transition',
            tab === 'excluded'
              ? 'border-lime text-cream'
              : 'border-transparent text-muted',
          )}
        >
          Excluded ({excluded.length})
        </button>
      </div>

      <div className="mt-6 border-t border-white/10">
        {list.map((comp) => (
          <article key={comp.title + comp.price} className="border-b border-white/10 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] leading-5 font-medium text-cream">
                  {comp.title}
                </p>
                <p className="mt-2 text-[12px] text-muted">
                  {comp.matchLabel} · {comp.source}
                </p>
              </div>
              <strong className="shrink-0 font-display text-[22px] font-black tracking-[-0.03em] text-cream">
                {formatAud(comp.price)}
              </strong>
            </div>
          </article>
        ))}
      </div>

      {analysis.market ? (
        <div className="mt-8 border-l-2 border-lime pl-4">
          <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
            READING THE RANGE
          </p>
          <p className="mt-2 text-[14px] leading-5 text-muted">
            Median asking {formatAud(analysis.market.median)} from{' '}
            {analysis.market.sampleCount} accepted comps (
            {formatAud(analysis.market.askingLow)}–
            {formatAud(analysis.market.askingHigh)}).
          </p>
        </div>
      ) : null}
    </div>
  )
}
