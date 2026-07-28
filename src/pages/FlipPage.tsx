import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { FlipPaywall } from '@/components/flip/FlipPaywall'
import { SaleCapture } from '@/components/flip/SaleCapture'
import { useAnalysis } from '@/hooks/useAnalysis'
import { hasFlipSubscription } from '@/lib/entitlements/flipAccess'
import { formatAud } from '@/lib/utils'
import type { BuyActionVerdict } from '@/types/hunt'
import type { SellSpeedLabel } from '@/types/sellSpeed'

function speedEmoji(label: SellSpeedLabel) {
  switch (label) {
    case 'VERY_FAST':
    case 'FAST':
      return '⚡'
    case 'MODERATE':
      return '🟡'
    case 'SLOW':
      return '🐌'
    default:
      return '❔'
  }
}

function speedText(label: SellSpeedLabel) {
  return label.replaceAll('_', ' ')
}

function actionTone(verdict: BuyActionVerdict): string {
  switch (verdict) {
    case 'BUY':
      return 'text-lime'
    case 'NEGOTIATE':
      return 'text-[#F5D76E]'
    case 'PASS':
      return 'text-[#f87171]'
    default:
      return 'text-muted'
  }
}

export function FlipPage() {
  const { id = '' } = useParams()
  const { analysis, loading } = useAnalysis(id)
  const [active, setActive] = useState(() => hasFlipSubscription())

  if (!active) {
    return <FlipPaywall onActivated={() => setActive(true)} />
  }

  if (loading || !analysis) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-muted">
        Loading…
      </div>
    )
  }

  const flip = analysis.flip

  if (!flip) {
    return (
      <div className="px-6 pt-5 pb-9">
        <Header backTo={`/result/${id}`} detail="FLIP" />
        <p className="text-muted">Flip analysis unavailable for this listing.</p>
      </div>
    )
  }

  const maxBuy = flip.maxBuy?.maxBuy

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo={`/result/${id}`} detail="FLIP" />

      <p className="font-display text-[11px] font-bold tracking-[0.16em] text-lime">
        SUSSIT FLIP
      </p>
      <h1 className="mt-2 font-display text-[28px] leading-none font-black tracking-[-0.035em] text-cream">
        {analysis.productLabel}
      </h1>
      <p className="mt-2 text-[14px] text-muted">
        Seller wants {formatAud(analysis.product.askingPrice)}
      </p>

      <div className="mt-6 rounded-[22px] border border-lime/35 bg-surface p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
          MAX BUY
        </p>
        <p className="mt-1 font-display text-[56px] leading-none font-black tracking-[-0.06em] text-lime">
          {maxBuy != null ? formatAud(maxBuy) : '—'}
        </p>
        <p
          className={`mt-4 font-display text-[28px] font-black tracking-[-0.03em] ${actionTone(flip.actionVerdict)}`}
        >
          {flip.actionVerdict.replaceAll('_', ' ')}
        </p>
        <p className="mt-2 text-[15px] leading-6 text-muted">{flip.actionSummary}</p>
        {flip.maxBuy ? (
          <p className="mt-3 text-[12px] text-muted">
            ≤ {formatAud(flip.maxBuy.maxBuy)} buy ·{' '}
            {formatAud(flip.maxBuy.maxBuy + 1)}–
            {formatAud(flip.maxBuy.negotiateCeiling)} negotiate · above pass
          </p>
        ) : null}
      </div>

      <div className="mt-4 flex items-end justify-between rounded-[18px] bg-surface px-4 py-3">
        <div>
          <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
            FLIP SCORE
          </p>
          <p className="mt-1 font-display text-[32px] leading-none font-black text-cream">
            {flip.flipScore ?? '—'}
          </p>
        </div>
        <p className="max-w-[180px] text-right text-[13px] leading-5 text-muted">
          {flip.summary}
        </p>
      </div>

      <dl className="mt-8 space-y-3">
        <Row
          label="Estimated resale"
          value={`${formatAud(flip.resaleLow)}–${formatAud(flip.resaleHigh)}`}
        />
        <Row
          label="Potential gross profit"
          value={`${formatAud(flip.grossProfitLow)}–${formatAud(flip.grossProfitHigh)}`}
        />
        <Row label="ROI at Max Buy path" value={`${flip.roiPercent}%`} />
      </dl>

      <section className="mt-8 border-t border-white/10 pt-6">
        <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
          {speedEmoji(flip.sellSpeed.label)} SELL SPEED
        </p>
        <p className="mt-2 font-display text-[26px] font-black text-cream">
          {speedText(flip.sellSpeed.label)}
        </p>
        <p className="mt-1 text-[15px] text-muted">
          {flip.sellSpeed.estimatedDaysLow != null
            ? `Estimated time to sell near ${formatAud((flip.resaleLow + flip.resaleHigh) / 2)}: ${flip.sellSpeed.estimatedDaysLow}–${flip.sellSpeed.estimatedDaysHigh} days`
            : 'Not enough lifecycle data yet'}
        </p>
        <p className="mt-3 text-[12px] leading-5 text-muted">
          {flip.sellSpeed.disclaimer}
        </p>
      </section>

      <section className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-surface px-4 py-3">
          <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
            DEMAND
          </p>
          <p className="mt-1 font-display text-[20px] font-black text-cream">
            {flip.liquidity.demandLabel}
          </p>
        </div>
        <div className="rounded-2xl bg-surface px-4 py-3">
          <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
            SUPPLY
          </p>
          <p className="mt-1 font-display text-[20px] font-black text-cream">
            {flip.liquidity.supplyLabel}
          </p>
        </div>
        <div className="rounded-2xl bg-surface px-4 py-3">
          <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
            LIQUIDITY
          </p>
          <p className="mt-1 font-display text-[20px] font-black text-cream">
            {flip.liquidity.score ?? '—'}
            {flip.liquidity.score != null ? (
              <span className="text-[13px] text-muted"> / 100</span>
            ) : null}
          </p>
        </div>
        <div className="rounded-2xl bg-surface px-4 py-3">
          <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
            CAPITAL VELOCITY
          </p>
          <p className="mt-1 font-display text-[20px] font-black text-cream">
            {flip.capitalVelocity.label}
          </p>
          {flip.capitalVelocity.profitPerDay != null ? (
            <p className="mt-1 text-[12px] text-muted">
              ~{formatAud(flip.capitalVelocity.profitPerDay)}/day expected
            </p>
          ) : null}
        </div>
      </section>

      {flip.sellSpeed.scenarios.length > 0 ? (
        <section className="mt-8 border-t border-white/10 pt-6">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-muted">
            LIST PRICE VS SPEED
          </p>
          <div className="mt-4 space-y-3">
            {flip.sellSpeed.scenarios.map((s) => (
              <div
                key={s.listPrice}
                className="flex items-center justify-between border-b border-white/10 pb-3"
              >
                <div>
                  <p className="font-semibold text-cream">
                    List at {formatAud(s.listPrice)}
                  </p>
                  <p className="text-[12px] text-muted">
                    {speedText(s.speedLabel)}
                  </p>
                </div>
                <p className="font-display text-[18px] font-black text-cream">
                  {s.daysLow != null ? `${s.daysLow}–${s.daysHigh}d` : '—'}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {flip.pricingSweetSpot ? (
        <p className="mt-6 text-[13px] leading-5 text-muted">
          Pricing sweet spot for speed:{' '}
          <span className="font-semibold text-cream">
            {formatAud(flip.pricingSweetSpot.low)}–
            {formatAud(flip.pricingSweetSpot.high)}
          </span>
        </p>
      ) : null}

      <div className="mt-8 rounded-[22px] border border-white/10 bg-surface p-5">
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          FLIP VERDICT
        </p>
        <p className="mt-2 font-display text-[22px] font-black text-cream">
          {flip.verdict.replaceAll('_', ' ')}
        </p>
        <p className="mt-2 text-[14px] leading-6 text-muted">{flip.summary}</p>
      </div>

      <SaleCapture
        analysisId={analysis.id}
        productId={analysis.productId}
        productLabel={analysis.productLabel}
        suggestedPurchase={flip.maxBuy?.maxBuy ?? analysis.offer?.openingOffer}
        suggestedResale={Math.round((flip.resaleLow + flip.resaleHigh) / 2)}
      />

      <Link
        to={`/result/${id}/relist`}
        className="mt-4 flex w-full items-center justify-center rounded-2xl border border-white/15 py-4 font-display text-[15px] font-bold text-cream transition hover:border-lime hover:text-lime"
      >
        Write resale listing
      </Link>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-display text-[18px] font-black text-cream">{value}</dd>
    </div>
  )
}
