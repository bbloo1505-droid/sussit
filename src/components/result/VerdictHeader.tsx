type VerdictHeaderProps = {
  label: string
  score: number
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT'
}

export function VerdictHeader({ label, score, confidence }: VerdictHeaderProps) {
  return (
    <div className="space-y-4 rounded-3xl border border-lime/40 bg-surface p-5">
      <p className="text-xs font-bold tracking-[0.16em] text-lime uppercase">
        Verdict
      </p>
      <p className="font-display text-[2.5rem] font-extrabold leading-none tracking-tight text-lime">
        {label}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm text-muted">
          SussIt Score{' '}
          <span className="font-semibold text-white">{score.toFixed(1)}/10</span>
          <span className="text-muted/80"> · mock</span>
        </p>
        <span className="rounded-full bg-lime/15 px-2.5 py-1 text-xs font-bold tracking-wide text-lime uppercase">
          {confidence}
        </span>
      </div>
    </div>
  )
}
