import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ChevronDown, Copy, Check, RefreshCw } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { FlipPaywall } from '@/components/flip/FlipPaywall'
import { buildHuntBoard, sellThroughText } from '@/lib/hunt/buildHuntBoard'
import { FLIP_CATEGORY_OPTIONS } from '@/lib/hunt/flipPlaybooks'
import { pollHuntLifecycles } from '@/lib/hunt/pollHuntLifecycles'
import { loadHuntRules, saveHuntRules } from '@/lib/hunt/huntRulesStore'
import {
  hasFlipAccess,
  hasFlipAssistant,
  hasFlipPro,
} from '@/lib/entitlements/flipAccess'
import { categoryLabel } from '@/lib/intelligence/supportTier'
import { formatAud } from '@/lib/utils'
import { seedHuntProducts } from '@/lib/supabase/persist'
import type { HuntBoard, HuntRules } from '@/types/hunt'
import type { ProductCategory } from '@/types/domain'
import type { SellSpeedLabel } from '@/types/sellSpeed'

const POLL_ONCE_KEY = 'sussit:hunt-polled-session'

const BUDGETS = [500, 1000, 1500, 2000]
const MIN_PROFITS = [50, 100, 150, 200]
const MAX_DAYS = [7, 14, 21, 30]

/** Subscriber hunt board — gated behind Flip entitlement */
export function FlipHuntPage() {
  const [active, setActive] = useState(() => hasFlipAccess())
  const [rules, setRules] = useState<HuntRules>(() => loadHuntRules())
  const [board, setBoard] = useState<HuntBoard | null>(null)
  const [loading, setLoading] = useState(true)
  const [polling, setPolling] = useState(false)
  const [pollNote, setPollNote] = useState<string | null>(null)
  const [boardTick, setBoardTick] = useState(0)
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null)

  useEffect(() => {
    if (!active) return
    let cancelled = false

    async function load(withPoll: boolean) {
      setLoading(true)
      void seedHuntProducts()
      if (withPoll) {
        setPolling(true)
        const summary = await pollHuntLifecycles()
        if (!cancelled) {
          if (summary.source === 'ebay') {
            setPollNote(
              `Live AU comps: ${summary.listingCount} listings across ${summary.productCount} SKUs`,
            )
          } else if (summary.source === 'unavailable') {
            setPollNote('Using fixture comps — add eBay API keys for live AU data')
          } else {
            setPollNote(summary.errors[0] ?? 'Market refresh failed')
          }
          setPolling(false)
        }
      }

      saveHuntRules(rules)
      const next = await buildHuntBoard(rules)
      if (!cancelled) {
        setBoard(next)
        setLoading(false)
      }
    }

    const alreadyPolled =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(POLL_ONCE_KEY) === '1'

    if (!alreadyPolled) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(POLL_ONCE_KEY, '1')
      }
      void load(true)
    } else {
      void load(false)
    }

    return () => {
      cancelled = true
    }
  }, [rules, active, boardTick])

  if (!active) {
    return <FlipPaywall onActivated={() => setActive(true)} />
  }

  function patch(partial: Partial<HuntRules>) {
    setRules((prev) => ({ ...prev, ...partial }))
  }

  function toggleCategory(id: ProductCategory | 'all') {
    if (id === 'all') {
      patch({ categories: ['all'] })
      return
    }
    const current = (rules.categories ?? ['all']).filter((c) => c !== 'all')
    const next = current.includes(id)
      ? current.filter((c) => c !== id)
      : [...current, id]
    patch({ categories: next.length === 0 ? ['all'] : next })
  }

  async function copySearch(query: string) {
    try {
      await navigator.clipboard.writeText(query)
      setCopiedQuery(query)
      window.setTimeout(() => setCopiedQuery(null), 1600)
    } catch {
      // ignore
    }
  }

  async function refreshMarket() {
    setPolling(true)
    setPollNote(null)
    const summary = await pollHuntLifecycles()
    if (summary.source === 'ebay') {
      setPollNote(
        `Refreshed: ${summary.listingCount} live listings · ${new Date(summary.observedAt).toLocaleTimeString()}`,
      )
    } else if (summary.source === 'unavailable') {
      setPollNote('eBay keys missing — still on fixture comps')
    } else {
      setPollNote(summary.errors[0] ?? 'Refresh failed')
    }
    setPolling(false)
    setBoardTick((n) => n + 1)
  }

  const selected = rules.categories ?? ['all']

  return (
    <div className="flex min-h-full flex-col px-6 pt-5 pb-9">
      <Header backTo="/" detail="FLIP" />
      <main className="flex flex-1 flex-col">
        <p className="font-display text-[11px] font-bold tracking-[0.16em] text-lime">
          SUSSIT FLIP
        </p>
        <h1 className="mt-2 font-display text-[36px] leading-[0.95] font-black tracking-[-0.04em] text-cream">
          What should I
          <br />
          flip today?
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted">
          Pick a category, copy a search, and hunt under the Max Buy.
        </p>

        <button
          type="button"
          disabled={polling}
          onClick={() => void refreshMarket()}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-surface px-4 py-3 text-[13px] font-semibold text-cream transition hover:border-lime/40 disabled:opacity-50"
        >
          <RefreshCw size={16} className={polling ? 'animate-spin text-lime' : 'text-lime'} />
          {polling ? 'Refreshing market…' : 'Refresh live eBay AU comps'}
        </button>
        {pollNote ? (
          <p className="mt-2 text-center text-[12px] leading-5 text-muted">{pollNote}</p>
        ) : null}

        <section className="mt-7">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-muted">
            CATEGORIES
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {FLIP_CATEGORY_OPTIONS.map((opt) => {
              const on =
                opt.id === 'all'
                  ? selected.includes('all') || selected.length === 0
                  : selected.includes(opt.id)
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleCategory(opt.id)}
                  className={
                    on
                      ? 'rounded-full border border-lime bg-lime px-3 py-1.5 font-display text-[12px] font-bold text-ink'
                      : 'rounded-full border border-white/15 px-3 py-1.5 font-display text-[12px] font-bold text-muted'
                  }
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <RuleSelect
            label="Budget"
            value={rules.budget}
            options={BUDGETS}
            format={(n) => formatAud(n)}
            onChange={(budget) => patch({ budget })}
          />
          <RuleSelect
            label="Min profit"
            value={rules.minProfit}
            options={MIN_PROFITS}
            format={(n) => formatAud(n)}
            onChange={(minProfit) => patch({ minProfit })}
          />
          <RuleSelect
            label="Max sell time"
            value={rules.maxSellDays}
            options={MAX_DAYS}
            format={(n) => `${n} days`}
            onChange={(maxSellDays) => patch({ maxSellDays })}
          />
          <RuleSelect
            label="Min ROI"
            value={rules.minRoiPercent}
            options={[15, 25, 35, 50]}
            format={(n) => `${n}%`}
            onChange={(minRoiPercent) => patch({ minRoiPercent })}
          />
        </div>

        <section className="mt-9">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
            SEARCH THESE TODAY
          </p>
          <p className="mt-2 text-[14px] leading-5 text-muted">
            Copy a query into Marketplace, Gumtree, or eBay — stay under Max Buy.
          </p>
          {loading || !board ? (
            <p className="mt-4 text-sm text-muted">Building suggestions…</p>
          ) : board.categorySuggestions.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No suggestions in this category set. Try All or raise budget.
            </p>
          ) : (
            <div className="mt-5 space-y-6">
              {board.categorySuggestions.map((group) => (
                <div key={group.category}>
                  <div className="mb-3">
                    <h2 className="font-display text-[20px] font-black tracking-[-0.03em] text-cream">
                      {group.title}
                    </h2>
                    <p className="mt-1 text-[13px] leading-5 text-muted">
                      {group.blurb}
                    </p>
                  </div>
                  <ul className="space-y-2">
                    {group.searches.map((item) => (
                      <li
                        key={item.searchQuery}
                        className="rounded-[18px] border border-white/10 bg-surface px-4 py-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-display text-[16px] font-black text-cream">
                              {item.label}
                            </p>
                            <p className="mt-1 truncate text-[13px] text-muted">
                              &ldquo;{item.searchQuery}&rdquo;
                            </p>
                            <p className="mt-1 text-[12px] leading-5 text-muted">
                              {item.why}
                            </p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
                              {item.source === 'scored' ? 'MAX BUY' : 'GUIDE'}
                            </p>
                            <p className="font-display text-[22px] leading-none font-black text-lime">
                              ≤{formatAud(item.maxBuy)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => void copySearch(item.searchQuery)}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[13px] font-semibold text-cream transition hover:border-lime/40"
                        >
                          {copiedQuery === item.searchQuery ? (
                            <>
                              <Check size={15} className="text-lime" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy size={15} className="text-lime" /> Copy search
                            </>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 border-t border-white/10 pt-8">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
            SCORED TOP FLIPS
          </p>
          {loading || !board ? (
            <p className="mt-4 text-sm text-muted">Building hunt board…</p>
          ) : board.opportunities.length === 0 ? (
            <p className="mt-4 text-sm text-muted">
              No scored SKUs clear your rules yet — use the category searches above,
              or loosen budget / profit / sell-time.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {board.opportunities.map((row, i) => (
                <article
                  key={row.productId}
                  className="rounded-[18px] border border-white/10 bg-surface px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[11px] font-bold text-lime">
                        #{i + 1} · {categoryLabel(row.category)}
                      </p>
                      <h2 className="font-display text-[20px] font-black tracking-[-0.03em] text-cream">
                        {row.label}
                      </h2>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
                        FLIP
                      </p>
                      <p className="font-display text-[28px] leading-none font-black text-lime">
                        {row.flipScore ?? '—'}
                      </p>
                    </div>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
                    <Metric label="Max buy" value={formatAud(row.maxBuy)} accent />
                    <Metric
                      label="Typical sale"
                      value={`${formatAud(row.typicalSaleLow)}–${formatAud(row.typicalSaleHigh)}`}
                    />
                    <Metric
                      label="Est. profit"
                      value={`${formatAud(row.estProfit)}+`}
                    />
                    <Metric
                      label="Sell-through"
                      value={`${speedMark(row.sellThroughLabel)} ${sellThroughText(row.sellThroughLabel)}`}
                    />
                  </dl>
                  <button
                    type="button"
                    onClick={() => void copySearch(row.searchQuery)}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-2.5 text-[13px] font-semibold text-cream"
                  >
                    <Copy size={15} className="text-lime" />
                    Copy &ldquo;{row.searchQuery}&rdquo;
                  </button>
                </article>
              ))}
            </div>
          )}
        </section>

        {board && board.falling.length > 0 ? (
          <section className="mt-8">
            <p className="font-display text-[11px] font-bold tracking-[0.14em] text-muted">
              SLOWER / WATCH
            </p>
            <ul className="mt-3 space-y-2">
              {board.falling.map((row) => (
                <li key={row.productId} className="text-[14px] text-muted">
                  {row.label} — sell-through {sellThroughText(row.sellThroughLabel)}.
                  Stay at or under {formatAud(row.maxBuy)}.
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Link
          to="/"
          className="mt-10 flex items-center justify-center gap-2 rounded-[22px] border border-lime/40 bg-lime/10 px-5 py-4 font-display text-[15px] font-bold tracking-wide text-lime transition hover:bg-lime/15"
        >
          <Camera size={18} />
          Analyse a listing
        </Link>

        {hasFlipAssistant() ? (
          <Link
            to="/flip/assistant"
            className="mt-3 flex w-full items-center justify-center rounded-2xl border border-white/15 py-3.5 font-display text-[14px] font-bold text-cream"
          >
            Open Assistant desk
          </Link>
        ) : (
          <Link
            to="/flip/assistant"
            className="mt-3 block text-center text-[13px] text-muted underline-offset-4 hover:text-cream hover:underline"
          >
            Upgrade to Flip Assistant
          </Link>
        )}

        <Link
          to="/flip/history"
          className="mt-3 block text-center text-[13px] text-muted underline-offset-4 hover:text-cream hover:underline"
        >
          {hasFlipPro() ? 'Inventory & P&L' : 'Flip Pro — track inventory & profit'}
        </Link>

        {board ? (
          <p className="mt-5 text-center text-[11px] leading-5 text-muted">
            {board.disclaimer}
          </p>
        ) : null}
      </main>
    </div>
  )
}

function RuleSelect({
  label,
  value,
  options,
  format,
  onChange,
}: {
  label: string
  value: number
  options: number[]
  format: (n: number) => string
  onChange: (n: number) => void
}) {
  return (
    <label className="block rounded-2xl border border-white/10 bg-surface px-3 py-2.5">
      <span className="font-display text-[10px] font-bold tracking-[0.12em] text-muted">
        {label}
      </span>
      <span className="relative mt-1 flex items-center">
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full appearance-none bg-transparent pr-6 font-display text-[16px] font-black text-cream outline-none"
        >
          {options.map((opt) => (
            <option key={opt} value={opt} className="bg-ink text-cream">
              {format(opt)}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-0 text-muted"
        />
      </span>
    </label>
  )
}

function Metric({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div>
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd
        className={`mt-0.5 font-semibold ${accent ? 'text-lime' : 'text-cream'}`}
      >
        {value}
      </dd>
    </div>
  )
}

function speedMark(label: SellSpeedLabel): string {
  switch (label) {
    case 'VERY_FAST':
    case 'FAST':
      return '⚡'
    case 'MODERATE':
      return '🟡'
    case 'SLOW':
      return '🐌'
    default:
      return '❔'
  }
}
