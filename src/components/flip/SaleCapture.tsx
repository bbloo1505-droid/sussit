import { useState } from 'react'
import { PrimaryButton } from '@/components/ui/button'
import {
  loadUserSales,
  recordUserConfirmedSale,
  type UserSaleReport,
} from '@/lib/sellSpeed/recordUserSale'
import { formatAud } from '@/lib/utils'

type SaleCaptureProps = {
  analysisId: string
  productId: string
  productLabel: string
  suggestedPurchase?: number | null
  suggestedResale?: number | null
}

export function SaleCapture({
  analysisId,
  productId,
  productLabel,
  suggestedPurchase,
  suggestedResale,
}: SaleCaptureProps) {
  const existing = loadUserSales().find((s) => s.analysisId === analysisId)
  const [purchasePrice, setPurchasePrice] = useState(
    existing
      ? String(existing.purchasePrice)
      : suggestedPurchase != null
        ? String(suggestedPurchase)
        : '',
  )
  const [salePrice, setSalePrice] = useState(
    existing
      ? String(existing.salePrice)
      : suggestedResale != null
        ? String(suggestedResale)
        : '',
  )
  const [purchaseAt, setPurchaseAt] = useState(
    existing?.purchaseAt.slice(0, 10) ?? today(),
  )
  const [saleAt, setSaleAt] = useState(existing?.saleAt.slice(0, 10) ?? today())
  const [channel, setChannel] = useState<UserSaleReport['channel']>(
    existing?.channel ?? 'marketplace',
  )
  const [saved, setSaved] = useState<UserSaleReport | null>(existing ?? null)
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const buy = Number(purchasePrice)
    const sell = Number(salePrice)
    if (!Number.isFinite(buy) || buy <= 0 || !Number.isFinite(sell) || sell <= 0) {
      setError('Enter valid purchase and sale prices.')
      return
    }
    if (new Date(saleAt) < new Date(purchaseAt)) {
      setError('Sale date must be on or after purchase date.')
      return
    }

    const report = recordUserConfirmedSale({
      analysisId,
      productId,
      productLabel,
      purchasePrice: buy,
      purchaseAt: new Date(purchaseAt).toISOString(),
      salePrice: sell,
      saleAt: new Date(saleAt).toISOString(),
      channel,
    })
    setSaved(report)
    setError(null)
  }

  if (saved) {
    const profit = saved.salePrice - saved.purchasePrice
    return (
      <section className="mt-8 rounded-[22px] border border-lime/30 bg-surface p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          SALE LOGGED
        </p>
        <p className="mt-2 text-[15px] leading-6 text-cream">
          Sold for {formatAud(saved.salePrice)} after {saved.daysToSell} days ·
          profit {formatAud(profit)}.
        </p>
        <p className="mt-2 text-[12px] text-muted">
          Saved as a confirmed sale — this improves Flip sell-speed for{' '}
          {productLabel}.
        </p>
      </section>
    )
  }

  return (
    <section className="mt-8 space-y-4 rounded-[22px] border border-white/10 bg-surface p-5">
      <div>
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          CLOSE THE LOOP
        </p>
        <h2 className="mt-2 font-display text-[22px] font-black tracking-[-0.03em] text-cream">
          Did this flip sell?
        </h2>
        <p className="mt-2 text-[13px] leading-5 text-muted">
          User-confirmed sales beat listing disappearances. Log it when it
          sells.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Bought for"
          value={purchasePrice}
          onChange={setPurchasePrice}
          placeholder="420"
        />
        <Field
          label="Sold for"
          value={salePrice}
          onChange={setSalePrice}
          placeholder="580"
        />
        <DateField label="Bought on" value={purchaseAt} onChange={setPurchaseAt} />
        <DateField label="Sold on" value={saleAt} onChange={setSaleAt} />
      </div>

      <label className="block">
        <span className="text-[12px] text-muted">Sold via</span>
        <select
          value={channel}
          onChange={(e) =>
            setChannel(e.target.value as UserSaleReport['channel'])
          }
          className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
        >
          <option value="marketplace">Facebook Marketplace</option>
          <option value="ebay">eBay</option>
          <option value="gumtree">Gumtree</option>
          <option value="other">Other</option>
        </select>
      </label>

      {error ? <p className="text-[13px] text-[#f87171]">{error}</p> : null}

      <PrimaryButton onClick={submit}>Log confirmed sale</PrimaryButton>
    </section>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="block">
      <span className="text-[12px] text-muted">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ''))}
        placeholder={placeholder}
        className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
      />
    </label>
  )
}

function DateField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="text-[12px] text-muted">{label}</span>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
      />
    </label>
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
