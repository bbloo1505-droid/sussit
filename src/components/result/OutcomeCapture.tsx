import { useState } from 'react'
import { PrimaryButton } from '@/components/ui/button'
import {
  loadOutcome,
  saveOutcome,
  type OutcomeDecision,
} from '@/lib/analysis/outcomeStore'
import { cn } from '@/lib/utils'

const DECISIONS: Array<{ id: OutcomeDecision; label: string }> = [
  { id: 'offer_less', label: "Yes — I'll offer less" },
  { id: 'buy', label: "Yes — I'll buy it" },
  { id: 'pass', label: "Yes — I'll pass" },
  { id: 'no_change', label: 'No' },
]

type OutcomeCaptureProps = {
  analysisId: string
}

export function OutcomeCapture({ analysisId }: OutcomeCaptureProps) {
  const existing = loadOutcome(analysisId)
  const [decision, setDecision] = useState<OutcomeDecision | null>(
    existing?.decision ?? null,
  )
  const [purchased, setPurchased] = useState<boolean | null>(
    existing?.purchased ?? null,
  )
  const [price, setPrice] = useState(
    existing?.actualPurchasePrice != null
      ? String(existing.actualPurchasePrice)
      : '',
  )
  const [saved, setSaved] = useState(Boolean(existing))

  function persist(next: {
    decision: OutcomeDecision
    purchased: boolean | null
    actualPurchasePrice: number | null
  }) {
    saveOutcome({
      analysisId,
      decision: next.decision,
      changedDecision: next.decision !== 'no_change',
      purchased: next.purchased,
      actualPurchasePrice: next.actualPurchasePrice,
      createdAt: new Date().toISOString(),
    })
    setSaved(true)
  }

  return (
    <section className="mt-8 space-y-4 rounded-[22px] border border-white/10 bg-surface p-5">
      <div>
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          HELP TRAIN SUSSIT
        </p>
        <h2 className="mt-2 font-display text-[22px] font-black tracking-[-0.03em] text-cream">
          Did this change what you&apos;ll do?
        </h2>
      </div>

      <div className="space-y-2">
        {DECISIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setDecision(item.id)
              persist({
                decision: item.id,
                purchased,
                actualPurchasePrice: price ? Number(price) : null,
              })
            }}
            className={cn(
              'w-full rounded-2xl border px-4 py-3 text-left text-[15px] font-semibold transition',
              decision === item.id
                ? 'border-lime bg-lime/10 text-cream'
                : 'border-white/10 bg-ink text-cream hover:border-white/25',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {decision && decision !== 'pass' && decision !== 'no_change' ? (
        <div className="space-y-3 border-t border-white/10 pt-4">
          <p className="text-[14px] font-semibold text-cream">Did you buy it?</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setPurchased(true)
                persist({
                  decision,
                  purchased: true,
                  actualPurchasePrice: price ? Number(price) : null,
                })
              }}
              className={cn(
                'rounded-2xl border py-3 text-sm font-bold',
                purchased === true
                  ? 'border-lime bg-lime text-ink'
                  : 'border-white/15 text-cream',
              )}
            >
              Yes
            </button>
            <button
              type="button"
              onClick={() => {
                setPurchased(false)
                setPrice('')
                persist({
                  decision,
                  purchased: false,
                  actualPurchasePrice: null,
                })
              }}
              className={cn(
                'rounded-2xl border py-3 text-sm font-bold',
                purchased === false
                  ? 'border-lime bg-lime text-ink'
                  : 'border-white/15 text-cream',
              )}
            >
              No
            </button>
          </div>

          {purchased ? (
            <div className="space-y-2">
              <label className="text-[13px] text-muted" htmlFor="paid">
                What did you actually pay?
              </label>
              <div className="flex gap-2">
                <input
                  id="paid"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ''))}
                  placeholder="490"
                  className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
                />
                <PrimaryButton
                  className="w-auto px-5"
                  onClick={() =>
                    persist({
                      decision,
                      purchased: true,
                      actualPurchasePrice: price ? Number(price) : null,
                    })
                  }
                >
                  Save
                </PrimaryButton>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {saved ? (
        <p className="text-[12px] text-muted">Saved — thanks for training SussIt.</p>
      ) : null}
    </section>
  )
}
