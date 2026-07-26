import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'
import { formatAud } from '@/lib/utils'
import { ensureDemoAnalysis } from '@/lib/analysis/ensureDemoAnalysis'
import { QUEST_DEMO_ID, questDemoProduct } from '@/lib/analysis/questDemoProduct'

export function ConfirmPage() {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const a = questDemoProduct
  const productName = [a.brand, a.model, a.variant].filter(Boolean).join(' ')

  const fields = [
    ['ASKING PRICE', formatAud(a.askingPrice)],
    ['CONDITION', 'Used'],
    ['INCLUDED', 'Controllers'],
    ['LISTED ON', 'Marketplace'],
  ] as const

  async function startAnalysis() {
    setBusy(true)
    try {
      await ensureDemoAnalysis(QUEST_DEMO_ID)
      navigate(`/analysing?id=${QUEST_DEMO_ID}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo="/" detail="LISTING" />
      <h1 className="font-display text-[32px] leading-none font-black tracking-[-0.035em] text-cream">
        Confirm listing
      </h1>
      <p className="mt-2 text-[15px] text-muted">Is this the right product?</p>

      <section className="mt-7 overflow-hidden rounded-[22px] border border-white/10 bg-surface">
        <div className="grid h-36 place-items-center border-b border-white/10 bg-[#161616] text-[66px]">
          🥽
        </div>
        <div className="p-5">
          <div className="flex justify-between gap-4">
            <div>
              <h2 className="font-display text-[21px] font-black tracking-[-0.025em] text-cream">
                {productName}
              </h2>
              <span className="mt-2 inline-block rounded-full bg-panel px-2 py-1 font-display text-[10px] font-bold tracking-[0.12em] text-muted">
                USED
              </span>
            </div>
            <strong className="font-display text-[28px] font-black tracking-[-0.04em] text-cream">
              {formatAud(a.askingPrice)}
            </strong>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-xl bg-panel px-3 py-3">
                <p className="font-display text-[9px] font-bold tracking-[0.11em] text-muted">
                  {label}
                </p>
                <p className="mt-1 text-[14px] font-semibold text-cream">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-4 space-y-2">
        <PrimaryButton onClick={startAnalysis} disabled={busy}>
          {busy ? 'Preparing…' : 'Looks right'} <ArrowRight size={18} />
        </PrimaryButton>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="w-full rounded-2xl border border-white/15 py-3.5 font-display text-[15px] font-bold text-cream"
        >
          Fix product details
        </button>
      </div>
    </div>
  )
}
