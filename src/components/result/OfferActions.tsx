import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAud } from '@/lib/utils'

type OfferActionsProps = {
  suggestedOffer: number
  askingPrice: number
  productName: string
  expanded?: boolean
  onExpand?: () => void
}

export function OfferActions({
  suggestedOffer,
  askingPrice,
  productName,
  expanded = false,
  onExpand,
}: OfferActionsProps) {
  const [copied, setCopied] = useState(false)
  const message = `Hey mate, definitely interested. Would you take ${formatAud(suggestedOffer)} if I can pick it up today?`

  async function copyOffer() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  if (!expanded) {
    return (
      <Button type="button" size="lg" className="w-full" onClick={onExpand}>
        Make an offer
      </Button>
    )
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-surface p-4">
      <h2 className="font-display text-xl font-bold tracking-tight">
        Make your move.
      </h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Suggested opening offer</dt>
          <dd className="font-semibold text-lime tabular-nums">
            {formatAud(suggestedOffer)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Seller asking</dt>
          <dd className="font-semibold tabular-nums">{formatAud(askingPrice)}</dd>
        </div>
      </dl>
      <p className="rounded-2xl bg-ink px-4 py-3 text-sm leading-relaxed text-white/90">
        {message}
      </p>
      <p className="text-xs text-muted">For {productName}</p>
      <Button type="button" size="lg" className="w-full" onClick={copyOffer}>
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Copy message
          </>
        )}
      </Button>
    </div>
  )
}
