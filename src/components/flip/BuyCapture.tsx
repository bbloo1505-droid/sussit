import { useState } from 'react'
import { PrimaryButton } from '@/components/ui/button'
import {
  openPositions,
  recordFlipBuy,
  type FlipPosition,
} from '@/lib/flip/flipLedger'
import { formatAud } from '@/lib/utils'

type BuyCaptureProps = {
  analysisId: string
  productId: string
  productLabel: string
  suggestedPurchase?: number | null
  targetResale?: number | null
}

export function BuyCapture({
  analysisId,
  productId,
  productLabel,
  suggestedPurchase,
  targetResale,
}: BuyCaptureProps) {
  const existing = openPositions().find((p) => p.analysisId === analysisId)
  const [purchasePrice, setPurchasePrice] = useState(
    existing
      ? String(existing.purchasePrice)
      : suggestedPurchase != null
        ? String(Math.round(suggestedPurchase))
        : '',
  )
  const [purchaseAt, setPurchaseAt] = useState(
    existing?.purchaseAt.slice(0, 10) ?? today(),
  )
  const [saved, setSaved] = useState<FlipPosition | null>(existing ?? null)
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const buy = Number(purchasePrice)
    if (!Number.isFinite(buy) || buy <= 0) {
      setError('Enter a valid purchase price.')
      return
    }
    const row = recordFlipBuy({
      analysisId,
      productId,
      productLabel,
      purchasePrice: buy,
      purchaseAt: new Date(purchaseAt).toISOString(),
      targetResale: targetResale ?? null,
      channel: 'marketplace',
    })
    setSaved(row)
    setError(null)
  }

  if (saved) {
    return (
      <section className="mt-6 rounded-[22px] border border-lime/30 bg-surface p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          IN INVENTORY
        </p>
        <p className="mt-2 text-[15px] leading-6 text-cream">
          Logged buy at {formatAud(saved.purchasePrice)}. Track it under Flip
          history until it sells.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-6 space-y-4 rounded-[22px] border border-white/10 bg-surface p-5">
      <div>
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          LOG THE BUY
        </p>
        <h2 className="mt-2 font-display text-[22px] font-black tracking-[-0.03em] text-cream">
          Did you pick this up?
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-muted">
          Pro tracks open stock so Assistant knows your capital and what’s stuck.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-[12px] text-muted">Bought for</span>
          <input
            inputMode="numeric"
            value={purchasePrice}
            onChange={(e) =>
              setPurchasePrice(e.target.value.replace(/[^\d]/g, ''))
            }
            placeholder="420"
            className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
          />
        </label>
        <label className="block">
          <span className="text-[12px] text-muted">Bought on</span>
          <input
            type="date"
            value={purchaseAt}
            onChange={(e) => setPurchaseAt(e.target.value)}
            className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
          />
        </label>
      </div>

      {error ? <p className="text-[13px] text-[#f87171]">{error}</p> : null}
      <PrimaryButton onClick={submit}>Add to inventory</PrimaryButton>
    </section>
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
