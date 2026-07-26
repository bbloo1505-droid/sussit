type ConfidenceBlockProps = {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT'
  strongComparisons: number
}

export function ConfidenceBlock({
  confidence,
  strongComparisons,
}: ConfidenceBlockProps) {
  return (
    <div className="space-y-1">
      <p className="text-sm text-muted">Confidence</p>
      <p className="text-xl font-bold tracking-tight">{confidence}</p>
      <p className="text-sm text-muted">
        {strongComparisons} strong comparisons
      </p>
    </div>
  )
}
