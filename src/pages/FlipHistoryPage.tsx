import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { FlipPaywall } from '@/components/flip/FlipPaywall'
import { PrimaryButton } from '@/components/ui/button'
import { hasFlipPro } from '@/lib/entitlements/flipAccess'
import {
  closeFlipPosition,
  daysHeld,
  openPositions,
  portfolioSummary,
} from '@/lib/flip/flipLedger'
import { loadUserSales } from '@/lib/sellSpeed/recordUserSale'
import { formatAud } from '@/lib/utils'

export function FlipHistoryPage() {
  const [active, setActive] = useState(() => hasFlipPro())
  const [tick, setTick] = useState(0)

  const summary = useMemo(() => portfolioSummary(), [tick, active])
  const open = useMemo(() => openPositions(), [tick, active])
  const sales = useMemo(() => loadUserSales(), [tick, active])

  if (!active) {
    return (
      <FlipPaywall minPlan="pro" onActivated={() => setActive(true)} />
    )
  }

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo="/flip" detail="PRO" />
      <h1 className="font-display text-[33px] leading-none font-black tracking-[-0.04em] text-cream">
        Your flips
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">
        Open inventory and closed P&L — the loop that trains Flip.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <Stat label="Open stock" value={String(summary.openCount)} />
        <Stat
          label="Capital in stock"
          value={summary.openCount ? formatAud(summary.capitalInStock) : '—'}
        />
        <Stat
          label="Realized profit"
          value={summary.closedCount ? formatAud(summary.realizedProfit) : '—'}
        />
        <Stat
          label="Avg days to sell"
          value={
            summary.avgDaysToSell != null ? String(summary.avgDaysToSell) : '—'
          }
        />
      </div>

      <section className="mt-9">
        <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
          OPEN INVENTORY
        </p>
        {open.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted">
            Nothing in stock. Log a buy from a Flip listing detail.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {open.map((pos) => (
              <OpenRow
                key={pos.id}
                positionId={pos.id}
                label={pos.productLabel}
                buy={pos.purchasePrice}
                held={daysHeld(pos)}
                target={pos.targetResale}
                onClosed={() => setTick((n) => n + 1)}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
          CLOSED FLIPS
        </p>
        {sales.length === 0 ? (
          <p className="mt-3 text-[14px] text-muted">
            No confirmed sales yet. Close an open position when it sells.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sales.map((sale) => {
              const profit = sale.salePrice - sale.purchasePrice
              return (
                <li
                  key={sale.id}
                  className="rounded-[18px] border border-white/10 bg-surface px-4 py-3"
                >
                  <p className="font-display text-[16px] font-black text-cream">
                    {sale.productLabel}
                  </p>
                  <p className="mt-1 text-[13px] text-muted">
                    Bought {formatAud(sale.purchasePrice)} → sold{' '}
                    {formatAud(sale.salePrice)} · {sale.daysToSell}d ·{' '}
                    {sale.channel}
                  </p>
                  <p
                    className={`mt-2 font-display text-[18px] font-black ${profit >= 0 ? 'text-lime' : 'text-[#f87171]'}`}
                  >
                    {profit >= 0 ? '+' : ''}
                    {formatAud(profit)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Link
        to="/flip"
        className="mt-8 inline-block text-sm text-muted underline-offset-4 hover:text-cream hover:underline"
      >
        Back to hunt board
      </Link>
    </div>
  )
}

function OpenRow({
  positionId,
  label,
  buy,
  held,
  target,
  onClosed,
}: {
  positionId: string
  label: string
  buy: number
  held: number
  target: number | null
  onClosed: () => void
}) {
  const [closing, setClosing] = useState(false)
  const [salePrice, setSalePrice] = useState(
    target != null ? String(Math.round(target)) : '',
  )
  const [saleAt, setSaleAt] = useState(today())
  const [error, setError] = useState<string | null>(null)

  function submit() {
    const sell = Number(salePrice)
    if (!Number.isFinite(sell) || sell <= 0) {
      setError('Enter a sale price.')
      return
    }
    try {
      closeFlipPosition({
        positionId,
        salePrice: sell,
        saleAt: new Date(saleAt).toISOString(),
        channel: 'marketplace',
      })
      onClosed()
      setClosing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not close')
    }
  }

  return (
    <li className="rounded-[18px] border border-white/10 bg-surface px-4 py-3">
      <p className="font-display text-[16px] font-black text-cream">{label}</p>
      <p className="mt-1 text-[13px] text-muted">
        Bought {formatAud(buy)} · held {held}d
        {target != null ? ` · target ${formatAud(target)}` : ''}
      </p>
      {!closing ? (
        <button
          type="button"
          onClick={() => setClosing(true)}
          className="mt-3 text-[13px] font-semibold text-lime"
        >
          Mark as sold
        </button>
      ) : (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input
              inputMode="numeric"
              value={salePrice}
              onChange={(e) =>
                setSalePrice(e.target.value.replace(/[^\d]/g, ''))
              }
              placeholder="Sold for"
              className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-cream outline-none"
            />
            <input
              type="date"
              value={saleAt}
              onChange={(e) => setSaleAt(e.target.value)}
              className="rounded-xl border border-white/10 bg-ink px-3 py-2 text-cream outline-none"
            />
          </div>
          {error ? <p className="text-[12px] text-[#f87171]">{error}</p> : null}
          <PrimaryButton onClick={submit}>Save sale</PrimaryButton>
        </div>
      )}
    </li>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface px-3 py-3">
      <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-[22px] font-black text-cream">{value}</p>
    </div>
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}
