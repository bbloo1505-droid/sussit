import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { FlipPaywall } from '@/components/flip/FlipPaywall'
import { buildAssistantBrief } from '@/lib/flip/assistantBrief'
import { buildHuntBoard } from '@/lib/hunt/buildHuntBoard'
import { loadHuntRules } from '@/lib/hunt/huntRulesStore'
import { hasFlipAssistant } from '@/lib/entitlements/flipAccess'
import { formatAud } from '@/lib/utils'
import type { HuntBoard } from '@/types/hunt'

export function FlipAssistantPage() {
  const [active, setActive] = useState(() => hasFlipAssistant())
  const [board, setBoard] = useState<HuntBoard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!active) return
    let cancelled = false
    void buildHuntBoard(loadHuntRules()).then((next) => {
      if (!cancelled) {
        setBoard(next)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [active])

  if (!active) {
    return (
      <FlipPaywall minPlan="assistant" onActivated={() => setActive(true)} />
    )
  }

  const brief = buildAssistantBrief({
    board,
    budget: board?.rules.budget ?? loadHuntRules().budget,
  })

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo="/flip" detail="DESK" />
      <p className="font-display text-[11px] font-bold tracking-[0.16em] text-lime">
        FLIP ASSISTANT
      </p>
      <h1 className="mt-2 font-display text-[34px] leading-[0.95] font-black tracking-[-0.04em] text-cream">
        Today&apos;s brief
      </h1>
      <p className="mt-3 text-[15px] leading-6 text-muted">
        Portfolio coach from your inventory and hunt board — not a chat bot.
      </p>

      <div className="mt-7 grid grid-cols-2 gap-3">
        <Stat
          label="Capital in stock"
          value={
            brief.summary.openCount
              ? formatAud(brief.summary.capitalInStock)
              : '—'
          }
        />
        <Stat label="Open flips" value={String(brief.summary.openCount)} />
        <Stat
          label="Week P&L"
          value={
            brief.summary.weekProfit !== 0
              ? `${brief.summary.weekProfit >= 0 ? '+' : ''}${formatAud(brief.summary.weekProfit)}`
              : '—'
          }
        />
        <Stat
          label="Month P&L"
          value={
            brief.summary.monthProfit !== 0
              ? `${brief.summary.monthProfit >= 0 ? '+' : ''}${formatAud(brief.summary.monthProfit)}`
              : '—'
          }
        />
      </div>

      <section className="mt-9">
        <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
          COACH NOTES
        </p>
        {loading ? (
          <p className="mt-3 text-sm text-muted">Building brief…</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {brief.actions.map((action) => (
              <li
                key={action.id}
                className="rounded-[18px] border border-white/10 bg-surface px-4 py-3"
              >
                <p
                  className={`font-display text-[10px] font-bold tracking-[0.12em] ${
                    action.tone === 'alert'
                      ? 'text-[#f87171]'
                      : action.tone === 'win'
                        ? 'text-lime'
                        : 'text-muted'
                  }`}
                >
                  {action.tone.toUpperCase()}
                </p>
                <h2 className="mt-1 font-display text-[18px] font-black text-cream">
                  {action.title}
                </h2>
                <p className="mt-1 text-[13px] leading-5 text-muted">
                  {action.body}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {brief.nextHunts.length > 0 ? (
        <section className="mt-9">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
            NEXT HUNTS
          </p>
          <ol className="mt-4 space-y-3">
            {brief.nextHunts.map((hunt, i) => (
              <li
                key={hunt.searchQuery}
                className="flex items-baseline justify-between gap-3 border-b border-white/10 pb-3"
              >
                <span className="text-[15px] text-cream">
                  <span className="text-muted">{i + 1}. </span>
                  {hunt.label}
                  <span className="mt-1 block text-[12px] text-muted">
                    &ldquo;{hunt.searchQuery}&rdquo;
                  </span>
                </span>
                <span className="shrink-0 font-display text-[14px] font-black text-lime">
                  ≤ {formatAud(hunt.maxBuy)}
                </span>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className="mt-10 space-y-3">
        <Link
          to="/flip"
          className="flex w-full items-center justify-center rounded-2xl border border-lime/40 bg-lime/10 py-3.5 font-display text-[15px] font-bold text-lime"
        >
          Open hunt board
        </Link>
        <Link
          to="/flip/history"
          className="block text-center text-[13px] text-muted underline-offset-4 hover:text-cream hover:underline"
        >
          Inventory &amp; P&L
        </Link>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface px-3 py-3">
      <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
        {label}
      </p>
      <p className="mt-1 font-display text-[20px] font-black text-cream">{value}</p>
    </div>
  )
}
