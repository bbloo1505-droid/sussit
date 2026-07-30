import {
  loadUserSales,
  recordUserConfirmedSale,
  type UserSaleReport,
} from '@/lib/sellSpeed/recordUserSale'

export type FlipPosition = {
  id: string
  analysisId: string | null
  productId: string
  productLabel: string
  purchasePrice: number
  purchaseAt: string
  targetResale: number | null
  channel: UserSaleReport['channel'] | null
  status: 'open' | 'sold'
  saleId: string | null
  createdAt: string
  updatedAt: string
}

export type PortfolioSummary = {
  openCount: number
  closedCount: number
  capitalInStock: number
  realizedProfit: number
  avgDaysToSell: number | null
  weekProfit: number
  monthProfit: number
}

const KEY = 'sussit:flip-positions'
const memory = new Map<string, string>()

function storageGet(key: string): string | null {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(key)
  }
  return memory.get(key) ?? null
}

function storageSet(key: string, value: string) {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, value)
    return
  }
  memory.set(key, value)
}

export function loadFlipPositions(): FlipPosition[] {
  const raw = storageGet(KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as FlipPosition[]
  } catch {
    return []
  }
}

export function clearFlipPositions() {
  storageSet(KEY, '[]')
}

function saveAll(rows: FlipPosition[]) {
  storageSet(KEY, JSON.stringify(rows))
}

export function saveFlipPosition(row: FlipPosition) {
  const next = [row, ...loadFlipPositions().filter((r) => r.id !== row.id)]
  saveAll(next)
}

export function openPositions(): FlipPosition[] {
  return loadFlipPositions().filter((r) => r.status === 'open')
}

export function recordFlipBuy(input: {
  analysisId?: string | null
  productId: string
  productLabel: string
  purchasePrice: number
  purchaseAt: string
  targetResale?: number | null
  channel?: UserSaleReport['channel'] | null
}): FlipPosition {
  const now = new Date().toISOString()
  const row: FlipPosition = {
    id: crypto.randomUUID(),
    analysisId: input.analysisId ?? null,
    productId: input.productId,
    productLabel: input.productLabel,
    purchasePrice: input.purchasePrice,
    purchaseAt: input.purchaseAt,
    targetResale: input.targetResale ?? null,
    channel: input.channel ?? null,
    status: 'open',
    saleId: null,
    createdAt: now,
    updatedAt: now,
  }
  saveFlipPosition(row)
  return row
}

export function closeFlipPosition(input: {
  positionId: string
  salePrice: number
  saleAt: string
  channel: UserSaleReport['channel']
}): { position: FlipPosition; sale: UserSaleReport } {
  const rows = loadFlipPositions()
  const position = rows.find((r) => r.id === input.positionId)
  if (!position || position.status !== 'open') {
    throw new Error('Open position not found')
  }

  const sale = recordUserConfirmedSale({
    analysisId: position.analysisId,
    productId: position.productId,
    productLabel: position.productLabel,
    purchasePrice: position.purchasePrice,
    purchaseAt: position.purchaseAt,
    salePrice: input.salePrice,
    saleAt: input.saleAt,
    channel: input.channel,
  })

  const closed: FlipPosition = {
    ...position,
    status: 'sold',
    saleId: sale.id,
    channel: input.channel,
    updatedAt: new Date().toISOString(),
  }
  saveFlipPosition(closed)
  return { position: closed, sale }
}

function inLastDays(iso: string, days: number): boolean {
  const t = new Date(iso).getTime()
  return t >= Date.now() - days * 24 * 60 * 60 * 1000
}

export function portfolioSummary(): PortfolioSummary {
  const open = openPositions()
  const sales = loadUserSales()
  const capitalInStock = open.reduce((sum, r) => sum + r.purchasePrice, 0)
  const realizedProfit = sales.reduce(
    (sum, s) => sum + (s.salePrice - s.purchasePrice),
    0,
  )
  const avgDaysToSell =
    sales.length === 0
      ? null
      : Number(
          (
            sales.reduce((sum, s) => sum + s.daysToSell, 0) / sales.length
          ).toFixed(1),
        )

  const weekProfit = sales
    .filter((s) => inLastDays(s.saleAt, 7))
    .reduce((sum, s) => sum + (s.salePrice - s.purchasePrice), 0)
  const monthProfit = sales
    .filter((s) => inLastDays(s.saleAt, 30))
    .reduce((sum, s) => sum + (s.salePrice - s.purchasePrice), 0)

  return {
    openCount: open.length,
    closedCount: sales.length,
    capitalInStock,
    realizedProfit,
    avgDaysToSell,
    weekProfit,
    monthProfit,
  }
}

export function daysHeld(position: FlipPosition, now = Date.now()): number {
  const start = new Date(position.purchaseAt).getTime()
  return Math.max(0, Number(((now - start) / (1000 * 60 * 60 * 24)).toFixed(1)))
}
