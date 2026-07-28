import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { FlipPaywall } from '@/components/flip/FlipPaywall'
import { hasFlipSubscription } from '@/lib/entitlements/flipAccess'
import { loadUserSales } from '@/lib/sellSpeed/recordUserSale'
import { formatAud } from '@/lib/utils'
import { useState } from 'react'

export function FlipHistoryPage() {
  const [active] = useState(() => hasFlipSubscription())
  const sales = loadUserSales()

  if (!active) {
    return <FlipPaywall />
  }

  const totalProfit = sales.reduce(
    (sum, s) => sum + (s.salePrice - s.purchasePrice),
    0,
  )
  const avgDays =
    sales.length === 0
      ? null
      : Number(
          (
            sales.reduce((sum, s) => sum + s.daysToSell, 0) / sales.length
          ).toFixed(1),
        )

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo="/flip" detail="HISTORY" />
      <h1 className="font-display text-[33px] leading-none font-black tracking-[-0.04em] text-cream">
        Your flips
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">
        Confirmed sales you logged. These train sell-speed — better than
        disappearances.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <Stat label="Logged sales" value={String(sales.length)} />
        <Stat
          label="Total profit"
          value={sales.length ? formatAud(totalProfit) : '—'}
        />
        <Stat
          label="Avg days to sell"
          value={avgDays != null ? String(avgDays) : '—'}
        />
        <Stat
          label="Capital turns"
          value={
            avgDays != null && avgDays > 0
              ? String(Number((365 / avgDays).toFixed(1)))
              : '—'
          }
        />
      </div>

      {sales.length === 0 ? (
        <p className="mt-8 text-[14px] text-muted">
          No confirmed sales yet. Analyse a listing, open Flip detail, and log
          when it sells.
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
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

      <Link
        to="/flip"
        className="mt-8 inline-block text-sm text-muted underline-offset-4 hover:text-cream hover:underline"
      >
        Back to hunt board
      </Link>
    </div>
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
