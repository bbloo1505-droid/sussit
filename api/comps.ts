/**
 * Production Vercel Function: /api/comps
 *
 * Self-contained (no local .ts imports) so Vercel Node ESM can load it.
 * Local Vite middleware uses server/handleComps.ts.
 */

type ProductCondition =
  | 'new'
  | 'used_like_new'
  | 'used_good'
  | 'used_fair'
  | 'for_parts'
  | 'unknown'

type ComparableListing = {
  id: string
  source: 'ebay'
  externalId: string | null
  title: string
  price: number
  currency: 'AUD'
  condition: ProductCondition | null
  shipping: number | null
  location: string | null
  url: string | null
  includedAccessories: string[]
  estimatedSoldQuantity?: number | null
  estimatedAvailableQuantity?: number | null
  itemCreatedAt?: string | null
  itemEndAt?: string | null
}

type EbayEnvironment = 'sandbox' | 'production'

function ebayConfig() {
  const clientId = process.env.EBAY_CLIENT_ID?.trim() ?? ''
  const clientSecret = process.env.EBAY_CLIENT_SECRET?.trim() ?? ''
  const environment = (process.env.EBAY_ENVIRONMENT?.trim() ??
    'production') as EbayEnvironment
  const marketplaceId =
    process.env.EBAY_MARKETPLACE_ID?.trim() ||
    (environment === 'sandbox' ? 'EBAY_US' : 'EBAY_AU')
  const scope =
    process.env.EBAY_OAUTH_SCOPE?.trim() ||
    'https://api.ebay.com/oauth/api_scope'
  const itemLocationCountry =
    process.env.EBAY_ITEM_LOCATION_COUNTRY?.trim() ||
    (environment === 'sandbox'
      ? marketplaceId === 'EBAY_AU'
        ? 'AU'
        : 'US'
      : 'AU')

  return {
    clientId,
    clientSecret,
    environment,
    marketplaceId,
    itemLocationCountry,
    scope,
    configured: Boolean(clientId && clientSecret),
    isSandbox: environment === 'sandbox',
  }
}

function ebayApiHost(environment: EbayEnvironment): string {
  return environment === 'sandbox'
    ? 'https://api.sandbox.ebay.com'
    : 'https://api.ebay.com'
}

type TokenCache = { accessToken: string; expiresAtMs: number }
let tokenCache: TokenCache | null = null

async function getEbayAccessToken(): Promise<string> {
  const cfg = ebayConfig()
  if (!cfg.configured) throw new Error('MISSING_EBAY_KEYS')

  const now = Date.now()
  if (tokenCache && tokenCache.expiresAtMs > now + 60_000) {
    return tokenCache.accessToken
  }

  const host = ebayApiHost(cfg.environment)
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString(
    'base64',
  )
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: cfg.scope,
  })

  const res = await fetch(`${host}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`EBAY_TOKEN_FAILED:${res.status}:${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    access_token: string
    expires_in: number
  }

  tokenCache = {
    accessToken: json.access_token,
    expiresAtMs: now + json.expires_in * 1000,
  }
  return tokenCache.accessToken
}

type EbayMoney = { value?: string; currency?: string }
type EbayItemSummary = {
  itemId?: string
  title?: string
  price?: EbayMoney
  condition?: string
  conditionId?: string
  itemWebUrl?: string
  itemHref?: string
  itemCreationDate?: string
  itemEndDate?: string
  itemLocation?: { city?: string; country?: string }
  shippingOptions?: Array<{ shippingCost?: EbayMoney }>
  estimatedAvailabilities?: Array<{
    estimatedAvailableQuantity?: number
    estimatedSoldQuantity?: number
  }>
}

function mapCondition(
  condition?: string,
  conditionId?: string,
): ProductCondition | null {
  const id = conditionId ?? ''
  const text = (condition ?? '').toLowerCase()

  if (id === '1000' || text.includes('new')) return 'new'
  if (id === '1500' || text.includes('open box') || text.includes('new other')) {
    return 'used_like_new'
  }
  if (
    id === '2000' ||
    id === '2010' ||
    id === '2020' ||
    text.includes('certified refurbished') ||
    text.includes('excellent') ||
    text.includes('like new')
  ) {
    return 'used_like_new'
  }
  if (id === '2500' || id === '3000' || id === '4000' || id === '5000') {
    return 'used_good'
  }
  if (id === '6000' || text.includes('acceptable') || text.includes('fair')) {
    return 'used_fair'
  }
  if (id === '7000' || text.includes('for parts') || text.includes('not working')) {
    return 'for_parts'
  }
  if (text.includes('used') || text.includes('good')) return 'used_good'
  return text ? 'used_good' : 'unknown'
}

function mapBrowseItem(item: EbayItemSummary): ComparableListing | null {
  const price = Number(item.price?.value)
  if (!item.itemId || !item.title || !Number.isFinite(price)) return null

  const avail = item.estimatedAvailabilities?.[0]
  const shippingRaw = item.shippingOptions?.[0]?.shippingCost?.value
  const shipping = shippingRaw != null ? Number(shippingRaw) : null
  const locationParts = [item.itemLocation?.city, item.itemLocation?.country]
    .filter(Boolean)
    .join(', ')

  return {
    id: `ebay-${item.itemId}`,
    source: 'ebay',
    externalId: item.itemId,
    title: item.title,
    price,
    currency: 'AUD',
    condition: mapCondition(item.condition, item.conditionId),
    shipping: Number.isFinite(shipping) ? shipping : null,
    location: locationParts || null,
    url: item.itemWebUrl ?? item.itemHref ?? null,
    includedAccessories: [],
    estimatedSoldQuantity: avail?.estimatedSoldQuantity ?? null,
    estimatedAvailableQuantity: avail?.estimatedAvailableQuantity ?? null,
    itemCreatedAt: item.itemCreationDate ?? null,
    itemEndAt: item.itemEndDate ?? null,
  }
}

function buildSearchQuery(product: {
  brand: string
  model: string
  variant?: string | null
}): string {
  return [product.brand, product.model, product.variant]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function searchOnce(input: {
  query: string
  limit?: number
  strictFilters: boolean
}): Promise<ComparableListing[]> {
  const cfg = ebayConfig()
  const token = await getEbayAccessToken()
  const host = ebayApiHost(cfg.environment)
  const limit = Math.min(Math.max(input.limit ?? 50, 1), 50)

  const filterParts = input.strictFilters
    ? [
        'conditions:{USED}',
        `itemLocationCountry:${cfg.itemLocationCountry}`,
        'buyingOptions:{FIXED_PRICE}',
      ]
    : cfg.isSandbox
      ? []
      : [`itemLocationCountry:${cfg.itemLocationCountry}`]

  const params = new URLSearchParams({
    q: input.query,
    limit: String(limit),
    sort: 'newlyListed',
  })
  if (filterParts.length > 0) {
    params.set('filter', filterParts.join(','))
  }

  const res = await fetch(
    `${host}/buy/browse/v1/item_summary/search?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-EBAY-C-MARKETPLACE-ID': cfg.marketplaceId,
        'X-EBAY-C-ENDUSERCTX': `contextualLocation=country%3D${cfg.itemLocationCountry}`,
        Accept: 'application/json',
      },
    },
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`EBAY_SEARCH_FAILED:${res.status}:${text.slice(0, 240)}`)
  }

  const json = (await res.json()) as { itemSummaries?: EbayItemSummary[] }
  return (json.itemSummaries ?? [])
    .map(mapBrowseItem)
    .filter((row): row is ComparableListing => row != null)
}

function broadenQuery(query: string): string[] {
  const parts = query.split(/\s+/).filter(Boolean)
  const out: string[] = []
  if (parts.length >= 2) out.push(parts.slice(0, 2).join(' '))
  if (parts.length >= 1) out.push(parts[0]!)
  const q = query.toLowerCase()
  if (q.includes('iphone')) out.push('iPhone')
  if (q.includes('quest')) out.push('Quest 3')
  if (q.includes('xbox')) out.push('Xbox')
  return [...new Set(out.filter((x) => x && x.toLowerCase() !== q))]
}

async function browseSearchAu(input: {
  query: string
  limit?: number
}): Promise<ComparableListing[]> {
  const cfg = ebayConfig()
  const primary = await searchOnce({
    query: input.query,
    limit: input.limit,
    strictFilters: !cfg.isSandbox,
  })

  if (primary.length > 0 || !cfg.isSandbox) return primary

  for (const broader of broadenQuery(input.query)) {
    const rows = await searchOnce({
      query: broader,
      limit: input.limit,
      strictFilters: false,
    })
    if (rows.length > 0) return rows
  }
  return primary
}

export type CompsRequestBody = {
  brand?: string
  model?: string
  variant?: string | null
  query?: string
  limit?: number
}

type CompsResponse =
  | {
      ok: true
      source: 'ebay' | 'unavailable'
      query: string
      listings: ComparableListing[]
    }
  | { ok: false; error: string }

async function handleComps(body: CompsRequestBody): Promise<CompsResponse> {
  const query =
    body.query?.trim() ||
    buildSearchQuery({
      brand: body.brand ?? '',
      model: body.model ?? '',
      variant: body.variant,
    })

  if (!query) {
    return { ok: false, error: 'Missing search query (brand/model or query).' }
  }

  if (!ebayConfig().configured) {
    return { ok: true, source: 'unavailable', query, listings: [] }
  }

  try {
    const listings = await browseSearchAu({ query, limit: body.limit })
    return { ok: true, source: 'ebay', query, listings }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'MISSING_EBAY_KEYS') {
      return { ok: true, source: 'unavailable', query, listings: [] }
    }
    console.error('[ebay/comps]', message)
    return { ok: false, error: message }
  }
}

type Req = { method?: string; body?: CompsRequestBody }
type Res = {
  status: (code: number) => Res
  json: (body: unknown) => void
  setHeader?: (name: string, value: string) => void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.setHeader?.('Content-Type', 'application/json')
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const result = await handleComps((req.body ?? {}) as CompsRequestBody)
  res.setHeader?.('Content-Type', 'application/json')
  res.status(result.ok ? 200 : 400).json(result)
}
