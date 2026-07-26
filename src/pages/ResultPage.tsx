import { Link, useParams } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { BrandMark } from '@/components/layout/BrandMark'
import { VerdictHeader } from '@/components/result/VerdictHeader'
import { PriceStack } from '@/components/result/PriceStack'
import { ConfidenceBlock } from '@/components/result/ConfidenceBlock'
import { OfferActions } from '@/components/result/OfferActions'
import { ComparisonsSheet } from '@/components/result/ComparisonsSheet'
import { Button } from '@/components/ui/button'
import { getMockAnalysis } from '@/mocks/quest3-512'

export function ResultPage() {
  const { id = '' } = useParams()
  const analysis = getMockAnalysis(id)

  if (!analysis) {
    return (
      <AppShell className="justify-center gap-6 text-center">
        <BrandMark />
        <p className="text-muted">Analysis not found.</p>
        <Link to="/">
          <Button type="button">Start over</Button>
        </Link>
      </AppShell>
    )
  }

  return (
    <AppShell className="gap-8">
      <BrandMark />

      <VerdictHeader
        label={analysis.verdictLabel}
        productName={analysis.productName}
      />

      <PriceStack
        askingPrice={analysis.askingPrice}
        comparableLow={analysis.comparableLow}
        comparableHigh={analysis.comparableHigh}
        suggestedOffer={analysis.suggestedOffer}
      />

      <ConfidenceBlock
        confidence={analysis.confidence}
        strongComparisons={analysis.strongComparisons}
      />

      <OfferActions
        suggestedOffer={analysis.suggestedOffer}
        productName={analysis.productName}
      />

      <ComparisonsSheet comps={analysis.comps} />

      <div className="pt-4">
        <Link
          to="/"
          className="text-sm font-medium text-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Suss another listing
        </Link>
      </div>
    </AppShell>
  )
}
