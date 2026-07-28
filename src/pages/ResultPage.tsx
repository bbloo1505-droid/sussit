import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronRight, MessageCircle, Search, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { ListingLine } from '@/components/shared/ListingLine'
import { TextButton } from '@/components/ui/button'
import { formatAud } from '@/lib/utils'
import { useAnalysis } from '@/hooks/useAnalysis'
import { buildExplanation } from '@/lib/analysis/viewModel'
import { OutcomeCapture } from '@/components/result/OutcomeCapture'
import { tierLabel } from '@/lib/intelligence/supportTier'

export function ResultPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { analysis, loading } = useAnalysis(id)

  if (loading || !analysis) {
    return (
      <div className="flex min-h-full items-center justify-center px-6 text-muted">
        Loading analysis…
      </div>
    )
  }

  const limited = analysis.deal.verdictLabel === 'LIMITED MARKET DATA'
  const insufficient = analysis.deal.verdictLabel === 'INSUFFICIENT DATA'
  const softGate = limited || insufficient
  const showStrongOffer =
    analysis.intelligenceTier === 'full' && Boolean(analysis.offer) && !softGate

  const verdictLines = limited
    ? ['LIMITED', 'MARKET DATA']
    : insufficient
      ? ['INSUFFICIENT', 'DATA']
      : analysis.deal.verdictLabel.split(' ')

  const confidenceLabel =
    analysis.confidence.level === 'INSUFFICIENT'
      ? 'Low'
      : analysis.confidence.level.charAt(0) +
        analysis.confidence.level.slice(1).toLowerCase()

  return (
    <div className="px-6 pt-5 pb-9">
      <Header detail="RESULT" />
      <ListingLine
        productName={analysis.productLabel}
        askingPrice={analysis.product.askingPrice}
      />
      <main className="pt-10">
        <p className="font-display text-[11px] font-bold tracking-[0.16em] text-lime">
          OUR READ
        </p>
        <h1
          className={
            softGate
              ? 'mt-2 font-display text-[48px] leading-[0.9] font-black tracking-[-0.06em] text-cream'
              : 'mt-2 font-display text-[64px] leading-[0.84] font-black tracking-[-0.075em] text-lime'
          }
        >
          {verdictLines[0]}
          <br />
          {verdictLines.slice(1).join(' ') || '\u00A0'}
        </h1>
        <p className="mt-6 max-w-[300px] text-[15px] leading-6 text-muted">
          {buildExplanation(analysis)}
        </p>
        {softGate ? (
          <p className="mt-3 text-[12px] text-muted">
            {tierLabel(analysis.intelligenceTier)}
          </p>
        ) : null}

        <div className="mt-10">
          {showStrongOffer ? (
            <>
              <p className="font-display text-[11px] font-bold tracking-[0.14em] text-muted">
                SUGGESTED OFFER
              </p>
              <p className="mt-1 font-display text-[42px] leading-none font-black tracking-[-0.05em] text-cream">
                {formatAud(analysis.offer!.openingOffer)}
              </p>
            </>
          ) : null}

          <p
            className={
              showStrongOffer
                ? 'mt-8 font-display text-[11px] font-bold tracking-[0.14em] text-muted'
                : 'font-display text-[11px] font-bold tracking-[0.14em] text-muted'
            }
          >
            CURRENT ASKING COMPARABLES
          </p>
          <p className="mt-1 font-display text-[30px] leading-none font-black tracking-[-0.04em] text-cream">
            {analysis.market
              ? `${formatAud(analysis.market.askingLow)}–${formatAud(analysis.market.askingHigh)}`
              : 'Not enough comps yet'}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-muted">
            Based on current eBay Australia asking prices — not sold-price data.
          </p>
        </div>

        {!softGate ? (
          <div className="mt-9 grid grid-cols-2 gap-7 border-t border-white/10 pt-5">
            <div>
              <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
                DEAL SCORE
              </p>
              <p className="mt-1 font-display text-[23px] font-black text-cream">
                {analysis.deal.dealScore != null ? (
                  <>
                    {analysis.deal.dealScore.toFixed(1)}{' '}
                    <span className="text-[13px] text-muted">/ 10</span>
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
            <div>
              <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
                CONFIDENCE
              </p>
              <p className="mt-1 font-display text-[23px] font-black text-cream">
                {confidenceLabel}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-6">
          {showStrongOffer ? (
            <TextButton onClick={() => navigate(`/result/${id}/offer`)}>
              <span className="flex items-center gap-3">
                <MessageCircle size={19} className="text-lime" />
                Make an offer
              </span>
              <ChevronRight size={19} />
            </TextButton>
          ) : null}
          <TextButton onClick={() => navigate(`/result/${id}/comparables`)}>
            <span className="flex items-center gap-3">
              <Search size={19} className="text-lime" />
              View comparisons
            </span>
            <ChevronRight size={19} />
          </TextButton>
          <TextButton onClick={() => navigate(`/result/${id}/risks`)}>
            <span className="flex items-center gap-3">
              <ShieldCheck size={19} className="text-lime" />
              What to check
            </span>
            <ChevronRight size={19} />
          </TextButton>
        </div>

        <OutcomeCapture analysisId={analysis.id} />

        <Link
          to="/"
          className="mt-8 inline-block text-sm text-muted underline-offset-4 hover:text-cream hover:underline"
        >
          Suss another listing
        </Link>
      </main>
    </div>
  )
}
