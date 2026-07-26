import { useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { formatAud } from '@/lib/utils'
import { getMockAnalysis } from '@/mocks/quest3-512'

export function ComparablesPage() {
  const { id = '' } = useParams()
  const analysis = getMockAnalysis(id)

  if (!analysis) return null

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo={`/result/${id}`} detail="COMPS" />
      <h1 className="font-display text-[33px] leading-none font-black tracking-[-0.04em] text-cream">
        Current listings
      </h1>
      <p className="mt-3 max-w-[320px] text-[14px] leading-5 text-muted">
        These are current asking prices on eBay Australia. They indicate market
        positioning, not completed sale values.
      </p>

      <div className="mt-8 border-t border-white/10">
        {analysis.comps.map((comp) => (
          <article key={comp.title} className="border-b border-white/10 py-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] leading-5 font-medium text-cream">
                  {comp.title}
                </p>
                <p className="mt-2 text-[12px] text-muted">{comp.source}</p>
              </div>
              <strong className="shrink-0 font-display text-[22px] font-black tracking-[-0.03em] text-cream">
                {formatAud(comp.price)}
              </strong>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-8 border-l-2 border-lime pl-4">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          READING THE RANGE
        </p>
        <p className="mt-2 text-[14px] leading-5 text-muted">
          The {formatAud(analysis.askingPrice)} asking price is in the middle of
          the current {formatAud(analysis.comparableLow)}–
          {formatAud(analysis.comparableHigh)} range. Condition and included
          accessories still matter.
        </p>
      </div>
    </div>
  )
}
