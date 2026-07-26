import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Copy, Tag } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { formatAud } from '@/lib/utils'
import { useAnalysis } from '@/hooks/useAnalysis'
import { buildOfferMessage } from '@/lib/analysis/viewModel'

export function OfferPage() {
  const { id = '' } = useParams()
  const { analysis, loading } = useAnalysis(id)
  const [copied, setCopied] = useState(false)

  if (loading || !analysis) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-muted">
        Loading…
      </div>
    )
  }

  const message = buildOfferMessage(analysis)
  const offer = analysis.offer?.openingOffer

  async function copy() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore
    }
  }

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo={`/result/${id}`} detail="OFFER" />
      <h1 className="font-display text-[33px] leading-none font-black tracking-[-0.04em] text-cream">
        Make an offer
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">
        {offer != null
          ? `A ${formatAud(offer)} offer gives you room to start below the ${formatAud(analysis.product.askingPrice)} asking price while still being clear and ready to act.`
          : 'Not enough comparable data for a suggested offer.'}
      </p>

      <section className="mt-9 rounded-[22px] border border-white/10 bg-surface p-5">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-lime" />
          <span className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
            SUGGESTED OFFER
          </span>
        </div>
        <p className="mt-2 font-display text-[40px] font-black tracking-[-0.05em] text-cream">
          {offer != null ? formatAud(offer) : '—'}
        </p>
        <div className="my-5 h-px bg-white/10" />
        <p className="text-[16px] leading-7 text-cream">{message}</p>
      </section>

      <button
        type="button"
        onClick={copy}
        disabled={offer == null}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-4 font-display text-[15px] font-bold text-cream transition hover:border-lime hover:text-lime disabled:opacity-40"
      >
        {copied ? (
          <>
            <CheckCircle2 size={18} className="text-lime" />
            Copied
          </>
        ) : (
          <>
            <Copy size={17} />
            Copy message
          </>
        )}
      </button>
    </div>
  )
}
