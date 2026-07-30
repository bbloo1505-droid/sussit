import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import {
  buildAskSellerMessage,
  buildAskSellerPrompts,
  shouldShowAskSeller,
} from '@/lib/analysis/askSeller'
import type { AnalysisResult } from '@/types/domain'

export function AskSellerCard({ analysis }: { analysis: AnalysisResult }) {
  const [copied, setCopied] = useState(false)

  if (!shouldShowAskSeller(analysis)) return null

  const prompts = buildAskSellerPrompts(analysis.product)
  if (prompts.length === 0) return null

  const message = buildAskSellerMessage(prompts)
  const weakRead =
    analysis.deal.verdictLabel === 'INSUFFICIENT DATA' ||
    analysis.confidence.level === 'INSUFFICIENT' ||
    analysis.confidence.level === 'LOW'

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // ignore — user can still read the questions
    }
  }

  return (
    <section className="mt-8 rounded-[22px] border border-lime/25 bg-lime/[0.04] p-5">
      <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
        ASK THE SELLER
      </p>
      <h2 className="mt-2 font-display text-[22px] font-black tracking-[-0.03em] text-cream">
        {weakRead
          ? 'Need a couple of details'
          : 'Worth confirming before you buy'}
      </h2>
      <p className="mt-2 text-[13px] leading-5 text-muted">
        {weakRead
          ? 'A clearer listing answer usually tightens the price read.'
          : 'These gaps can move the fair price.'}
      </p>

      <ol className="mt-5 space-y-4">
        {prompts.map((prompt, index) => (
          <li key={prompt.label} className="flex gap-3">
            <span className="mt-0.5 font-display text-[12px] font-black text-lime">
              0{index + 1}
            </span>
            <div>
              <p className="font-display text-[15px] font-extrabold text-cream">
                {prompt.label}
              </p>
              <p className="mt-1 text-[14px] leading-5 text-cream/90">
                {prompt.question}
              </p>
              <p className="mt-1 text-[12px] leading-5 text-muted">{prompt.why}</p>
            </div>
          </li>
        ))}
      </ol>

      <button
        type="button"
        onClick={() => void copyMessage()}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-ink/40 py-3.5 font-display text-[14px] font-bold text-cream transition hover:border-lime/40"
      >
        {copied ? (
          <>
            <Check size={16} className="text-lime" /> Copied message
          </>
        ) : (
          <>
            <Copy size={16} /> Copy message to seller
          </>
        )}
      </button>
    </section>
  )
}
