import {
  daysHeld,
  openPositions,
  portfolioSummary,
  type FlipPosition,
  type PortfolioSummary,
} from '@/lib/flip/flipLedger'
import type { HuntBoard } from '@/types/hunt'

export type AssistantAction = {
  id: string
  tone: 'alert' | 'focus' | 'win'
  title: string
  body: string
}

export type AssistantBrief = {
  summary: PortfolioSummary
  actions: AssistantAction[]
  nextHunts: Array<{
    label: string
    searchQuery: string
    maxBuy: number
  }>
  stuck: Array<{
    label: string
    daysHeld: number
    purchasePrice: number
  }>
}

const STUCK_DAYS = 14

/**
 * Deterministic Flip Assistant coach — no LLM.
 * Uses open inventory + closed P&L + optional hunt board.
 */
export function buildAssistantBrief(input: {
  board?: HuntBoard | null
  budget?: number
  now?: number
}): AssistantBrief {
  const now = input.now ?? Date.now()
  const summary = portfolioSummary()
  const open = openPositions()
  const actions: AssistantAction[] = []

  const stuckPositions = open
    .map((p) => ({ position: p, held: daysHeld(p, now) }))
    .filter((x) => x.held >= STUCK_DAYS)
    .sort((a, b) => b.held - a.held)

  if (summary.capitalInStock > 0) {
    actions.push({
      id: 'capital',
      tone: 'focus',
      title: 'Capital in stock',
      body: `You have $${Math.round(summary.capitalInStock)} tied up across ${summary.openCount} open flip${summary.openCount === 1 ? '' : 's'}. Free capital by selling before hunting more.`,
    })
  } else {
    actions.push({
      id: 'empty',
      tone: 'focus',
      title: 'Inventory clear',
      body: 'No open stock. Use the hunt board and stay under Max Buy.',
    })
  }

  for (const stuck of stuckPositions.slice(0, 3)) {
    actions.push({
      id: `stuck-${stuck.position.id}`,
      tone: 'alert',
      title: `Stuck: ${stuck.position.productLabel}`,
      body: `Held ${stuck.held} days at $${stuck.position.purchasePrice}. Relist sharper or cut — capital is idle.`,
    })
  }

  if (summary.weekProfit !== 0) {
    actions.push({
      id: 'week',
      tone: summary.weekProfit >= 0 ? 'win' : 'alert',
      title: 'This week',
      body:
        summary.weekProfit >= 0
          ? `Realized +$${Math.round(summary.weekProfit)} in the last 7 days.`
          : `Realized $${Math.round(summary.weekProfit)} in the last 7 days — tighten Max Buy.`,
    })
  }

  if (summary.monthProfit !== 0 && Math.abs(summary.monthProfit - summary.weekProfit) > 1) {
    actions.push({
      id: 'month',
      tone: summary.monthProfit >= 0 ? 'win' : 'alert',
      title: 'Last 30 days',
      body: `Realized ${summary.monthProfit >= 0 ? '+' : ''}$${Math.round(summary.monthProfit)}.`,
    })
  }

  const budgetLeft = Math.max(
    0,
    (input.budget ?? input.board?.rules.budget ?? 1000) - summary.capitalInStock,
  )

  const nextHunts = (input.board?.categorySuggestions ?? [])
    .flatMap((g) => g.searches)
    .filter((s) => s.maxBuy > 0 && s.maxBuy <= budgetLeft)
    .sort((a, b) => b.maxBuy - a.maxBuy)
    .slice(0, 3)
    .map((s) => ({
      label: s.label,
      searchQuery: s.searchQuery,
      maxBuy: s.maxBuy,
    }))

  if (nextHunts.length > 0 && budgetLeft > 0) {
    actions.push({
      id: 'hunt',
      tone: 'focus',
      title: 'Next hunts',
      body: `About $${Math.round(budgetLeft)} free vs open stock. Copy a search below and stay under Max Buy.`,
    })
  } else if (budgetLeft <= 0 && open.length > 0) {
    actions.push({
      id: 'full',
      tone: 'alert',
      title: 'Budget fully deployed',
      body: 'Sell something before starting another buy — don’t stack capital.',
    })
  }

  return {
    summary,
    actions: actions.slice(0, 6),
    nextHunts,
    stuck: stuckPositions.map((s) => ({
      label: s.position.productLabel,
      daysHeld: s.held,
      purchasePrice: s.position.purchasePrice,
    })),
  }
}

/** Test helper */
export function stuckThresholdDays(): number {
  return STUCK_DAYS
}

export type { FlipPosition }
