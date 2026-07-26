import { useState } from 'react'
import { formatAud, cn } from '@/lib/utils'
import type { MockAnalysis } from '@/mocks/quest3-512'
import { Button } from '@/components/ui/button'

type ComparisonsSheetProps = {
  comps: MockAnalysis['comps']
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ComparisonsSheet({
  comps,
  open: controlledOpen,
  onOpenChange,
}: ComparisonsSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const setOpen = onOpenChange ?? setInternalOpen
  const [tab, setTab] = useState<'included' | 'excluded'>('included')

  const included = comps.filter((c) => c.included)
  const excluded = comps.filter((c) => !c.included)
  const list = tab === 'included' ? included : excluded

  if (!open) {
    return (
      <Button
        type="button"
        variant="secondary"
        size="lg"
        className="w-full"
        onClick={() => setOpen(true)}
      >
        View comparisons
      </Button>
    )
  }

  return (
    <div className="space-y-4 rounded-3xl border border-white/10 bg-surface p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-tight">
          Why we think that
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm font-semibold text-muted hover:text-white"
        >
          Close
        </button>
      </div>

      <div className="flex gap-2 rounded-full bg-ink p-1">
        <button
          type="button"
          onClick={() => setTab('included')}
          className={cn(
            'flex-1 rounded-full px-3 py-2 text-sm font-semibold',
            tab === 'included' ? 'bg-lime text-ink' : 'text-muted',
          )}
        >
          Included ({included.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('excluded')}
          className={cn(
            'flex-1 rounded-full px-3 py-2 text-sm font-semibold',
            tab === 'excluded' ? 'bg-lime text-ink' : 'text-muted',
          )}
        >
          Excluded ({excluded.length})
        </button>
      </div>

      <ul className="space-y-3">
        {list.map((comp) => (
          <li
            key={comp.id}
            className="rounded-2xl border border-white/8 bg-ink px-3 py-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium leading-snug">{comp.title}</p>
                <p className="mt-1 text-xs text-muted">
                  {comp.condition} · {comp.matchLabel}
                </p>
                <p
                  className={cn(
                    'mt-1 text-xs',
                    comp.included ? 'text-lime' : 'text-poor',
                  )}
                >
                  {comp.reason}
                </p>
              </div>
              <p className="shrink-0 font-semibold tabular-nums">
                {formatAud(comp.price)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
