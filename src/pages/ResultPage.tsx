import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Share } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { VerdictHeader } from '@/components/result/VerdictHeader'
import { PriceStack } from '@/components/result/PriceStack'
import { ConfidenceBlock } from '@/components/result/ConfidenceBlock'
import { OfferActions } from '@/components/result/OfferActions'
import { ComparisonsSheet } from '@/components/result/ComparisonsSheet'
import { Button } from '@/components/ui/button'
import { formatAud } from '@/lib/utils'
import { getMockAnalysis } from '@/mocks/quest3-512'

export function ResultPage() {
  const { id = '' } = useParams()
  const analysis = getMockAnalysis(id)
  const [compsOpen, setCompsOpen] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [risksOpen, setRisksOpen] = useState(false)

  if (!analysis) {
    return (
      <AppShell className="justify-center gap-6 text-center">
        <p className="text-muted">Analysis not found.</p>
        <Link to="/">
          <Button type="button">Start over</Button>
        </Link>
      </AppShell>
    )
  }

  return (
    <AppShell className="gap-6">
      <div className="flex items-center justify-between">
        <Link
          to="/confirm"
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <button
          type="button"
          className="rounded-full p-2 hover:bg-white/5"
          aria-label="Share"
        >
          <Share className="h-5 w-5" />
        </button>
      </div>

      <div className="flex items-center gap-3 rounded-2xl bg-surface px-3 py-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink">
          <span className="text-[10px] font-bold text-lime">VR</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{analysis.productName}</p>
          <p className="text-xs text-muted">
            Asking {formatAud(analysis.askingPrice)}
          </p>
        </div>
      </div>

      <VerdictHeader
        label={analysis.verdictLabel}
        score={analysis.mockScore}
        confidence={analysis.confidence}
      />

      <PriceStack
        comparableLow={analysis.comparableLow}
        comparableHigh={analysis.comparableHigh}
        suggestedOffer={analysis.suggestedOffer}
        goodBuyPrice={analysis.goodBuyPrice}
      />

      <ConfidenceBlock explanation={analysis.explanation} />

      <div className="space-y-3">
        <OfferActions
          suggestedOffer={analysis.suggestedOffer}
          askingPrice={analysis.askingPrice}
          productName={analysis.productName}
          expanded={offerOpen}
          onExpand={() => setOfferOpen(true)}
        />
        <ComparisonsSheet
          comps={analysis.comps}
          open={compsOpen}
          onOpenChange={setCompsOpen}
        />
      </div>

      <button
        type="button"
        onClick={() => setRisksOpen((v) => !v)}
        className="text-left text-sm font-semibold text-lime underline-offset-4 hover:underline"
      >
        {risksOpen ? 'Hide checks & questions' : 'Before you hand over the cash'}
      </button>

      {risksOpen ? (
        <div className="space-y-5 rounded-3xl border border-white/10 bg-surface p-4">
          <div>
            <p className="text-xs font-bold tracking-wide text-muted uppercase">
              Normal used-item risks
            </p>
            <ul className="mt-3 space-y-2">
              {analysis.risks.map((risk) => (
                <li key={risk} className="flex items-center gap-2 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-fair" />
                  {risk}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-wide text-muted uppercase">
              Ask the seller
            </p>
            <ul className="mt-3 space-y-2">
              {analysis.questions.map((q) => (
                <li
                  key={q}
                  className="rounded-xl bg-ink px-3 py-2.5 text-sm text-white/90"
                >
                  {q}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}

      <Link
        to="/"
        className="pt-2 text-sm font-medium text-muted underline-offset-4 hover:text-white hover:underline"
      >
        Suss another listing
      </Link>
    </AppShell>
  )
}
