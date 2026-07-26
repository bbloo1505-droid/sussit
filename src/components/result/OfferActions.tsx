import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatAud } from '@/lib/utils'

type OfferActionsProps = {
  suggestedOffer: number
  productName: string
}

export function OfferActions({ suggestedOffer, productName }: OfferActionsProps) {
  const [copied, setCopied] = useState(false)

  const message = `Hey mate, definitely interested in the ${productName}. Would you take ${formatAud(suggestedOffer)} if I can pick it up today?`

  async function copyOffer() {
    try {
      await navigator.clipboard.writeText(message)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard may be unavailable in some contexts
    }
  }

  return (
    <div className="space-y-3">
      <Button type="button" size="lg" className="w-full" onClick={copyOffer}>
        {copied ? (
          <>
            <Check className="h-4 w-4" />
            Copied
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" />
            Make an offer
          </>
        )}
      </Button>
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </div>
  )
}
