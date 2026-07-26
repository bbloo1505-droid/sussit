import { useNavigate, useParams, Link } from 'react-router-dom'
import { ChevronRight, MessageCircle, Search, ShieldCheck } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { ListingLine } from '@/components/shared/ListingLine'
import { TextButton, PrimaryButton } from '@/components/ui/button'
import { formatAud } from '@/lib/utils'
import { getMockAnalysis } from '@/mocks/quest3-512'

export function ResultPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const analysis = getMockAnalysis(id)

  if (!analysis) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6">
        <p className="text-muted">Analysis not found.</p>
        <Link to="/">
          <PrimaryButton>Start over</PrimaryButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="px-6 pt-5 pb-9">
      <Header detail="RESULT" />
      <ListingLine analysis={analysis} />
      <main className="pt-10">
        <p className="font-display text-[11px] font-bold tracking-[0.16em] text-lime">
          OUR READ
        </p>
        <h1 className="mt-2 font-display text-[64px] leading-[0.84] font-black tracking-[-0.075em] text-lime">
          GOOD
          <br />
          BUY
        </h1>
        <p className="mt-6 max-w-[300px] text-[15px] leading-6 text-muted">
          {analysis.explanation}
        </p>

        <div className="mt-10">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-muted">
            SUGGESTED OFFER
          </p>
          <p className="mt-1 font-display text-[42px] leading-none font-black tracking-[-0.05em] text-cream">
            {formatAud(analysis.suggestedOffer)}
          </p>
          <p className="mt-8 font-display text-[11px] font-bold tracking-[0.14em] text-muted">
            CURRENT ASKING COMPARABLES
          </p>
          <p className="mt-1 font-display text-[30px] leading-none font-black tracking-[-0.04em] text-cream">
            {formatAud(analysis.comparableLow)}–{formatAud(analysis.comparableHigh)}
          </p>
          <p className="mt-2 text-[12px] leading-5 text-muted">
            Based on current eBay Australia asking prices — not sold-price data.
          </p>
        </div>

        <div className="mt-9 grid grid-cols-2 gap-7 border-t border-white/10 pt-5">
          <div>
            <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
              DEAL SCORE
            </p>
            <p className="mt-1 font-display text-[23px] font-black text-cream">
              {analysis.mockScore.toFixed(1)}{' '}
              <span className="text-[13px] text-muted">/ 10</span>
            </p>
          </div>
          <div>
            <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
              CONFIDENCE
            </p>
            <p className="mt-1 font-display text-[23px] font-black text-cream">
              {analysis.confidence}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <TextButton onClick={() => navigate(`/result/${id}/offer`)}>
            <span className="flex items-center gap-3">
              <MessageCircle size={19} className="text-lime" />
              Make an offer
            </span>
            <ChevronRight size={19} />
          </TextButton>
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
      </main>
    </div>
  )
}
