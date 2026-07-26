import { useState } from 'react'
import { formatAud } from '@/lib/utils'
import type { MockAnalysis } from '@/mocks/quest3-512'

type ComparisonsSheetProps = {
  comps: MockAnalysis['comps']
}

export function ComparisonsSheet({ comps }: ComparisonsSheetProps) {
  const [open, setOpen] = useState(false)

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-sm font-semibold text-ink underline-offset-4 hover:underline"
      >
        {open ? 'Hide comparisons' : 'View comparisons'}
      </button>

      {open ? (
        <ul className="mt-4 space-y-4 border-t border-ink/10 pt-4">
          {comps.map((comp) => (
            <li key={comp.id} className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium leading-snug">{comp.title}</p>
                <p className="shrink-0 text-sm font-semibold tabular-nums">
                  {formatAud(comp.price)}
                </p>
              </div>
              <p
                className={
                  comp.included
                    ? 'text-xs text-good'
                    : 'text-xs text-poor'
                }
              >
                {comp.included ? 'Included' : 'Rejected'} — {comp.reason}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
