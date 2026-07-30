import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Copy } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { formatAud } from '@/lib/utils'
import { useAnalysis } from '@/hooks/useAnalysis'
import { buildRelistCopy } from '@/lib/analysis/viewModel'
import { hasFlipAccess } from '@/lib/entitlements/flipAccess'
import { FlipPaywall } from '@/components/flip/FlipPaywall'

export function RelistPage() {
  const { id = '' } = useParams()
  const { analysis, loading } = useAnalysis(id)
  const [active] = useState(() => hasFlipAccess())
  const [copied, setCopied] = useState<'body' | 'title' | null>(null)

  if (!active) {
    return <FlipPaywall />
  }

  if (loading || !analysis) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-muted">
        Loading…
      </div>
    )
  }

  const copy = buildRelistCopy(analysis)
  const full = `${copy.title}\n\n${formatAud(copy.price)}\n\n${copy.body}`

  async function copyText(kind: 'body' | 'title', text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(kind)
      window.setTimeout(() => setCopied(null), 1600)
    } catch {
      // ignore
    }
  }

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo={`/result/${id}/flip`} detail="RELIST" />
      <h1 className="font-display text-[33px] leading-none font-black tracking-[-0.04em] text-cream">
        List it to sell
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">
        Copy ready for Marketplace / eBay. Prices come from comps and Flip
        sweet-spot — not an LLM guess.
      </p>

      <section className="mt-8 rounded-[22px] border border-lime/30 bg-surface p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
          LIST PRICE
        </p>
        <p className="mt-1 font-display text-[42px] font-black text-lime">
          {formatAud(copy.price)}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-[13px]">
          <div>
            <dt className="text-muted">Quick sale</dt>
            <dd className="font-semibold text-cream">
              {copy.quickSalePrice != null
                ? formatAud(copy.quickSalePrice)
                : '—'}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Stretch</dt>
            <dd className="font-semibold text-cream">
              {copy.maxProfitPrice != null
                ? formatAud(copy.maxProfitPrice)
                : '—'}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-5 rounded-[22px] border border-white/10 bg-surface p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
          TITLE
        </p>
        <p className="mt-2 text-[16px] font-semibold text-cream">{copy.title}</p>
        <button
          type="button"
          onClick={() => void copyText('title', copy.title)}
          className="mt-3 text-[13px] text-lime"
        >
          {copied === 'title' ? 'Copied' : 'Copy title'}
        </button>
      </section>

      <section className="mt-5 rounded-[22px] border border-white/10 bg-surface p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
          DESCRIPTION
        </p>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-[15px] leading-6 text-cream">
          {copy.body}
        </pre>
      </section>

      <button
        type="button"
        onClick={() => void copyText('body', full)}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 py-4 font-display text-[15px] font-bold text-cream transition hover:border-lime hover:text-lime"
      >
        {copied === 'body' ? (
          <>
            <CheckCircle2 size={18} className="text-lime" />
            Copied listing
          </>
        ) : (
          <>
            <Copy size={17} />
            Copy full listing
          </>
        )}
      </button>
    </div>
  )
}
