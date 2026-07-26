import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Copy, Tag } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { formatAud } from '@/lib/utils'
import { getMockAnalysis } from '@/mocks/quest3-512'

export function OfferPage() {
  const { id = '' } = useParams()
  const analysis = getMockAnalysis(id)
  const [copied, setCopied] = useState(false)

  if (!analysis) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(analysis!.offerMessage)
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
        A {formatAud(analysis.suggestedOffer)} offer gives you room to start
        below the {formatAud(analysis.askingPrice)} asking price while still
        being clear and ready to act.
      </p>

      <section className="mt-9 rounded-[22px] border border-white/10 bg-surface p-5">
        <div className="flex items-center gap-2">
          <Tag size={16} className="text-lime" />
          <span className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
            SUGGESTED OFFER
          </span>
        </div>
        <p className="mt-2 font-display text-[40px] font-black tracking-[-0.05em] text-cream">
          {formatAud(analysis.suggestedOffer)}
        </p>
        <div className="my-5 h-px bg-white/10" />
        <p className="text-[16px] leading-7 text-cream">{analysis.offerMessage}</p>
      </section>

      <button
        type="button"
        onClick={copy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-4 font-display text-[15px] font-bold text-cream transition hover:border-lime hover:text-lime"
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
