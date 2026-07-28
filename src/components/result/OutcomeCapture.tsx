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
  const [open, setOpen] = useState(Boolean(existing))
  const [decision, setDecision] = useState<OutcomeDecision | null>(
    existing?.decision ?? null,
  )
  const [contactedSeller, setContactedSeller] = useState<boolean | null>(
    existing?.contactedSeller ?? null,
  )
  const [purchased, setPurchased] = useState<boolean | null>(
    existing?.purchased ?? null,
  )
  const [price, setPrice] = useState(
    existing?.actualPurchasePrice != null
      ? String(existing.actualPurchasePrice)
      : '',
  )
  const [resold, setResold] = useState<boolean | null>(existing?.resold ?? null)
  const [resalePrice, setResalePrice] = useState(
    existing?.actualResalePrice != null
      ? String(existing.actualResalePrice)
      : '',
  )
  const [verdictCorrect, setVerdictCorrect] = useState<boolean | null>(
    existing?.verdictCorrect ?? null,
  )
  const [saved, setSaved] = useState(Boolean(existing))

  function persist(patch: {
    decision: OutcomeDecision
    contactedSeller: boolean | null
    purchased: boolean | null
    actualPurchasePrice: number | null
    resold: boolean | null
    actualResalePrice: number | null
    resoldAt: string | null
    verdictCorrect: boolean | null
  }) {
    const now = new Date().toISOString()
    saveOutcome({
      analysisId,
      decision: patch.decision,
      changedDecision: patch.decision !== 'no_change',
      contactedSeller: patch.contactedSeller,
      purchased: patch.purchased,
      actualPurchasePrice: patch.actualPurchasePrice,
      resold: patch.resold,
      actualResalePrice: patch.actualResalePrice,
      resoldAt: patch.resoldAt,
      verdictCorrect: patch.verdictCorrect,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    setSaved(true)
  }

  function currentPrices() {
    return {
      actualPurchasePrice: price ? Number(price) : null,
      actualResalePrice: resalePrice ? Number(resalePrice) : null,
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-8 w-full rounded-2xl border border-white/10 bg-surface/80 px-4 py-3.5 text-left text-[13px] text-muted transition hover:border-white/20 hover:text-cream"
      >
        Help improve SussIt — optional 30-second feedback
      </button>
    )
  }

  if (!decision) {
    return (
      <section className="mt-8 space-y-4 rounded-[22px] border border-white/10 bg-surface p-5">
        <FormHeader onClose={() => setOpen(false)} />
        <div className="space-y-2">
          {DECISIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setDecision(item.id)
                persist({
                  decision: item.id,
                  contactedSeller,
                  purchased,
                  actualPurchasePrice: currentPrices().actualPurchasePrice,
                  resold,
                  actualResalePrice: currentPrices().actualResalePrice,
                  resoldAt: existing?.resoldAt ?? null,
                  verdictCorrect,
                })
              }}
              className={cn(
                'w-full rounded-2xl border px-4 py-3 text-left text-[15px] font-semibold transition',
                'border-white/10 bg-ink text-cream hover:border-white/25',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section className="mt-8 space-y-4 rounded-[22px] border border-white/10 bg-surface p-5">
      <FormHeader onClose={() => setOpen(false)} />

      <YesNo
        label="Did you contact the seller?"
        value={contactedSeller}
        onChange={(value) => {
          setContactedSeller(value)
          persist({
            decision,
            contactedSeller: value,
            purchased,
            actualPurchasePrice: currentPrices().actualPurchasePrice,
            resold,
            actualResalePrice: currentPrices().actualResalePrice,
            resoldAt: existing?.resoldAt ?? null,
            verdictCorrect,
          })
        }}
      />

      {decision !== 'pass' && decision !== 'no_change' ? (
        <>
          <YesNo
            label="Did you buy it?"
            value={purchased}
            onChange={(value) => {
              setPurchased(value)
              if (!value) {
                setPrice('')
                setResold(null)
                setResalePrice('')
              }
              persist({
                decision,
                contactedSeller,
                purchased: value,
                actualPurchasePrice: value
                  ? currentPrices().actualPurchasePrice
                  : null,
                resold: value ? resold : null,
                actualResalePrice: value
                  ? currentPrices().actualResalePrice
                  : null,
                resoldAt: value ? existing?.resoldAt ?? null : null,
                verdictCorrect,
              })
            }}
          />

          {purchased ? (
            <div className="space-y-2">
              <label className="text-[13px] text-muted" htmlFor="paid">
                Purchase price
              </label>
              <div className="flex gap-2">
                <input
                  id="paid"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) =>
                    setPrice(e.target.value.replace(/[^\d]/g, ''))
                  }
                  placeholder="490"
                  className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
                />
                <PrimaryButton
                  className="w-auto px-5"
                  onClick={() =>
                    persist({
                      decision,
                      contactedSeller,
                      purchased: true,
                      actualPurchasePrice: currentPrices().actualPurchasePrice,
                      resold,
                      actualResalePrice: currentPrices().actualResalePrice,
                      resoldAt: existing?.resoldAt ?? null,
                      verdictCorrect,
                    })
                  }
                >
                  Save
                </PrimaryButton>
              </div>
            </div>
          ) : null}

          {purchased ? (
            <YesNo
              label="Did you resell it?"
              value={resold}
              onChange={(value) => {
                setResold(value)
                const resoldAt = value ? new Date().toISOString() : null
                if (!value) setResalePrice('')
                persist({
                  decision,
                  contactedSeller,
                  purchased: true,
                  actualPurchasePrice: currentPrices().actualPurchasePrice,
                  resold: value,
                  actualResalePrice: value
                    ? currentPrices().actualResalePrice
                    : null,
                  resoldAt,
                  verdictCorrect,
                })
              }}
            />
          ) : null}

          {purchased && resold ? (
            <div className="space-y-2">
              <label className="text-[13px] text-muted" htmlFor="resale">
                Resale price
              </label>
              <div className="flex gap-2">
                <input
                  id="resale"
                  inputMode="numeric"
                  value={resalePrice}
                  onChange={(e) =>
                    setResalePrice(e.target.value.replace(/[^\d]/g, ''))
                  }
                  placeholder="620"
                  className="w-full rounded-2xl border border-white/10 bg-ink px-4 py-3 text-cream outline-none focus:border-lime/50"
                />
                <PrimaryButton
                  className="w-auto px-5"
                  onClick={() =>
                    persist({
                      decision,
                      contactedSeller,
                      purchased: true,
                      actualPurchasePrice: currentPrices().actualPurchasePrice,
                      resold: true,
                      actualResalePrice: currentPrices().actualResalePrice,
                      resoldAt: existing?.resoldAt ?? new Date().toISOString(),
                      verdictCorrect,
                    })
                  }
                >
                  Save
                </PrimaryButton>
              </div>
            </div>
          ) : null}
        </>
      ) : null}

      <YesNo
        label="Was SussIt's read correct?"
        value={verdictCorrect}
        onChange={(value) => {
          setVerdictCorrect(value)
          persist({
            decision,
            contactedSeller,
            purchased,
            actualPurchasePrice: currentPrices().actualPurchasePrice,
            resold,
            actualResalePrice: currentPrices().actualResalePrice,
            resoldAt: existing?.resoldAt ?? null,
            verdictCorrect: value,
          })
        }}
      />

      {saved ? (
        <p className="text-[12px] text-muted">Thanks — saved.</p>
      ) : null}
    </section>
  )
}

function FormHeader({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-display text-[10px] font-bold tracking-[0.14em] text-lime">
          OPTIONAL
        </p>
        <h2 className="mt-2 font-display text-[22px] font-black tracking-[-0.03em] text-cream">
          Did this change what you&apos;ll do?
        </h2>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="shrink-0 text-[12px] text-muted hover:text-cream"
      >
        Hide
      </button>
    </div>
  )
}

function YesNo(props: {
  label: string
  value: boolean | null
  onChange: (value: boolean) => void
}) {
  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <p className="text-[14px] font-semibold text-cream">{props.label}</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => props.onChange(true)}
          className={cn(
            'rounded-2xl border py-3 text-sm font-bold',
            props.value === true
              ? 'border-lime bg-lime text-ink'
              : 'border-white/15 text-cream',
          )}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => props.onChange(false)}
          className={cn(
            'rounded-2xl border py-3 text-sm font-bold',
            props.value === false
              ? 'border-lime bg-lime text-ink'
              : 'border-white/15 text-cream',
          )}
        >
          No
        </button>
      </div>
    </div>
  )
}
