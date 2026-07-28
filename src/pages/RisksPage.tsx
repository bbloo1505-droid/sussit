import { useParams } from 'react-router-dom'
import { CircleAlert } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { useAnalysis } from '@/hooks/useAnalysis'
import { risksForCategory } from '@/lib/analysis/viewModel'

export function RisksPage() {
  const { id = '' } = useParams()
  const { analysis, loading } = useAnalysis(id)

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-muted">
        Loading…
      </div>
    )
  }

  const category = analysis?.product.category ?? 'other'
  const risks = risksForCategory(category)
  const itemWord =
    category === 'vr_headset'
      ? 'headset'
      : category === 'vehicle'
        ? 'vehicle'
        : 'item'

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo={`/result/${id}`} detail="CHECK" />
      <h1 className="font-display text-[33px] leading-none font-black tracking-[-0.04em] text-cream">
        What to check
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">
        A good price only matters if the {itemWord} is in good nick.
      </p>

      <div className="mt-8">
        {risks.map((risk, index) => (
          <div key={risk.title} className="flex gap-4 border-b border-white/10 py-5">
            <span className="mt-0.5 font-display text-[12px] font-black text-lime">
              0{index + 1}
            </span>
            <div>
              <h2 className="font-display text-[18px] font-extrabold text-cream">
                {risk.title}
              </h2>
              <p className="mt-1 text-[13px] leading-5 text-muted">
                {risk.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-7 flex gap-3 border-l-2 border-lime pl-4">
        <CircleAlert size={18} className="mt-0.5 shrink-0 text-lime" />
        <p className="text-[13px] leading-5 text-muted">
          If the seller won&apos;t let you inspect it properly, factor that
          uncertainty into your decision.
        </p>
      </div>
    </div>
  )
}
