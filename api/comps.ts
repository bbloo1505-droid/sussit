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
  category?: string | null
}): string {
  const brand =
    product.brand && !/^unbranded$/i.test(product.brand) ? product.brand : ''
  const core = [brand, product.model, product.variant]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  let tuned = core
  const model = (product.model ?? '').toLowerCase()
  if (model.includes('playstation 5')) {
    tuned = core
      .replace(/Sony\s+/i, '')
      .replace(/PlayStation\s*5/i, 'PS5')
      .replace(/\s+/g, ' ')
      .trim()
  }
  if (model.includes('quest')) {
    tuned = core.replace(/^Meta\s+/i, '').replace(/\s+/g, ' ').trim()
  }
  if (model.includes('switch')) {
    tuned = core.replace(/^Nintendo\s+/i, '').replace(/\s+/g, ' ').trim()
  }
  if (model.includes('iphone')) {
    tuned = core.replace(/^Apple\s+/i, '').replace(/\s+/g, ' ').trim()
  }

  const category =
    product.category ??
    inferCategoryFromText(`${product.brand} ${product.model}`)

  return enrichBrowseQuery(tuned, category)
}

function relaxBrowseQuery(query: string): string {
  const keepNeg = new Set(
    [
      '-3S',
      '-3s',
      '-Slim',
      '-Pro',
      '-Digital',
      '-Disc',
      '-Lite',
      '-OLED',
      '-Max',
      '-Plus',
    ].map((t) => t.toLowerCase()),
  )
  return query
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !p.startsWith('-') || keepNeg.has(p.toLowerCase()))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function coreBrowseQuery(query: string): string {
  return query
    .split(/\s+/)
    .filter((t) => t && !t.startsWith('-'))
    .filter(
      (t) =>
        !['headset', 'console', 'body', 'unlocked'].includes(t.toLowerCase()),
    )
    .slice(0, 6)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferCategoryFromText(
  text: string,
):
  | 'phone'
  | 'vr_headset'
  | 'console'
  | 'camera'
  | 'laptop'
  | 'tablet'
  | 'wearable'
  | 'audio'
  | 'gpu'
  | 'power_tool'
  | 'furniture'
  | 'clothing'
  | 'vehicle'
  | 'jewellery'
  | 'collectible'
  | 'other'
  | null {
  const t = text.toLowerCase()
  if (/iphone|galaxy|pixel|phone/.test(t)) return 'phone'
  if (/quest|vision\s*pro|vr\s*headset|oculus/.test(t)) return 'vr_headset'
  if (/playstation|ps5|switch|xbox|console/.test(t)) return 'console'
  if (/macbook|thinkpad|laptop|notebook/.test(t)) return 'laptop'
  if (/ipad|tablet/.test(t)) return 'tablet'
  if (/watch\s*series|galaxy\s*watch|wearable/.test(t)) return 'wearable'
  if (/airpods|wh-?1000|headphones|earbuds/.test(t)) return 'audio'
  if (/rtx|gtx|radeon|gpu|graphics\s*card/.test(t)) return 'gpu'
  if (/makita|dewalt|milwaukee|impact\s*driver|power\s*tool/.test(t)) {
    return 'power_tool'
  }
  if (/a7\s*iii|eos\s*r|camera|mirrorless|dslr/.test(t)) return 'camera'
  if (/sofa|couch|table|chair|desk|wardrobe|bed\b|ikea|furniture/.test(t)) {
    return 'furniture'
  }
  if (/dress|shirt|jacket|jeans|shoes|sneakers|nike|adidas|clothing/.test(t)) {
    return 'clothing'
  }
  if (/car\b|toyota|mazda|honda|utes?\b|vehicle|motorbike/.test(t)) {
    return 'vehicle'
  }
  if (/ring|necklace|jewellery|jewelry|rolex|gold\s*chain/.test(t)) {
    return 'jewellery'
  }
  if (/lego|pokemon|funko|collectible|trading\s*card/.test(t)) {
    return 'collectible'
  }
  return null
}

function alreadyHas(query: string, token: string): boolean {
  return query.toLowerCase().includes(token.toLowerCase())
}

function appendUnique(parts: string[], extras: string[]): string[] {
  const out = [...parts]
  for (const extra of extras) {
    if (!out.some((p) => p.toLowerCase() === extra.toLowerCase())) {
      out.push(extra)
    }
  }
  return out
}

const PHONE_NEG = [
  '-case',
  '-cover',
  '-charger',
  '-cable',
  '-tempered',
  '-protector',
  '-magsafe',
  '-wallet',
  '-glass',
  '-holder',
  '-pouch',
]

const VR_NEG = [
  '-dock',
  '-bobovr',
  '-stand',
  '-skin',
  '-grip',
  '-facial',
  '-faceplate',
]

const CONSOLE_NEG = [
  '-stand',
  '-cooling',
  '-skin',
  '-silicone',
  '-thumb',
  '-charging',
  '-preorder',
  '-cover',
  '-custom',
  '-battlebeaver',
]

const CAMERA_NEG = [
  '-lens',
  '-strap',
  '-bag',
  '-battery',
  '-charger',
  '-grip',
  '-cage',
  '-filter',
  '-hood',
  '-card',
]

const LAPTOP_NEG = [
  '-case',
  '-sleeve',
  '-charger',
  '-adapter',
  '-battery',
  '-keyboard',
  '-screen',
  '-parts',
]

const TABLET_NEG = [
  '-case',
  '-cover',
  '-pencil',
  '-keyboard',
  '-folio',
  '-charger',
  '-stylus',
]

const WEARABLE_NEG = [
  '-band',
  '-strap',
  '-case',
  '-charger',
  '-protector',
  '-screen',
]

const AUDIO_NEG = [
  '-eartips',
  '-tips',
  '-cushion',
  '-earpad',
  '-single',
  '-replacement',
]

const GPU_NEG = [
  '-bracket',
  '-support',
  '-cable',
  '-riser',
  '-box',
  '-fan',
  '-laptop',
  '-notebook',
  '-blade',
  '-prebuilt',
  '-PC',
]

const TOOL_NEG = [
  '-battery',
  '-charger',
  '-bit',
  '-bits',
  '-case',
  '-bag',
  '-only',
]

const FURNITURE_NEG = ['-parts', '-broken', '-damaged', '-scrap']
const CLOTHING_NEG = ['-lot', '-bundle', '-wholesale', '-sample']
const VEHICLE_NEG = ['-parts', '-wreck', '-shell', '-manual']
const JEWELLERY_NEG = ['-box', '-empty', '-display']
const COLLECTIBLE_NEG = [
  '-proxy',
  '-fake',
  '-reproduction',
  '-minifigure',
  '-minifig',
  '-figure',
]

function modelSpecificNegations(query: string): string[] {
  const q = query.toLowerCase()
  const out: string[] = []

  if (/iphone\s*\d+\s*pro\b/.test(q) && !/pro\s*max/.test(q)) {
    out.push('-Max')
  }
  if (/iphone\s*\d+\b/.test(q) && !/\bpro\b/.test(q) && !/\bplus\b/.test(q)) {
    out.push('-Pro', '-Plus', '-Max')
  }
  if (/quest\s*3\b/.test(q) && !/quest\s*3s/.test(q)) {
    out.push('-3S', '-3s')
  }
  if (/quest\s*2\b/.test(q)) {
    out.push('-3S', '-3s', '-Pro')
  }
  if (/\bps5\b|playstation\s*5/.test(q)) {
    if (/\bslim\b/.test(q)) {
      out.push('-Pro')
      if (/\bdisc\b/.test(q)) out.push('-Digital')
      if (/\bdigital\b/.test(q)) out.push('-Disc')
    } else if (/\bpro\b/.test(q)) {
      out.push('-Slim')
    } else {
      out.push('-Slim', '-Pro')
      if (/\bdisc\b/.test(q)) out.push('-Digital')
      if (/\bdigital\b/.test(q)) out.push('-Disc')
    }
  }
  if (/\bswitch\b/.test(q)) {
    if (/\boled\b/.test(q)) out.push('-Lite')
    else if (/\blite\b/.test(q)) out.push('-OLED')
    else out.push('-OLED', '-Lite')
  }
  if (/\brtx\s*4070\b/.test(q) && !/\bti\b/.test(q) && !/\bsuper\b/.test(q)) {
    out.push('-Ti', '-SUPER', '-Super')
  }
  if (/\bps5\s*pro\b|playstation\s*5\s*pro/.test(q)) {
    out.push('-Hawk', '-Skater', '-Tony', '-Fanatec', '-Magazine', '-Enhanced')
  }
  return out
}

function unitPositives(category: string | null, query: string): string[] {
  const q = query.toLowerCase()
  if (category === 'vr_headset') {
    if (!/\bheadset\b/.test(q) && !/\bstandalone\b/.test(q)) return ['headset']
    return []
  }
  if (category === 'console') {
    if (!/\bconsole\b/.test(q)) return ['console']
    return []
  }
  if (category === 'camera') {
    if (!/\bbody\b/.test(q) && !/\bkit\b/.test(q)) return ['body']
    return []
  }
  return []
}

function categoryNegations(category: string | null): string[] {
  switch (category) {
    case 'phone':
      return PHONE_NEG
    case 'vr_headset':
      return VR_NEG
    case 'console':
      return CONSOLE_NEG
    case 'camera':
      return CAMERA_NEG
    case 'laptop':
      return LAPTOP_NEG
    case 'tablet':
      return TABLET_NEG
    case 'wearable':
      return WEARABLE_NEG
    case 'audio':
      return AUDIO_NEG
    case 'gpu':
      return GPU_NEG
    case 'power_tool':
      return TOOL_NEG
    case 'furniture':
      return FURNITURE_NEG
    case 'clothing':
      return CLOTHING_NEG
    case 'vehicle':
      return VEHICLE_NEG
    case 'jewellery':
      return JEWELLERY_NEG
    case 'collectible':
      return COLLECTIBLE_NEG
    default:
      return []
  }
}

function enrichBrowseQuery(
  query: string,
  category?: string | null,
): string {
  const cleaned = query.replace(/\s+/g, ' ').trim()
  if (!cleaned) return cleaned

  const cat = category ?? inferCategoryFromText(cleaned)
  let parts = cleaned.split(/\s+/).filter(Boolean)
  parts = appendUnique(parts, unitPositives(cat, cleaned))

  const negations = [
    ...categoryNegations(cat),
    ...modelSpecificNegations(cleaned),
  ]
  for (const neg of negations) {
    if (!alreadyHas(cleaned, neg) && !parts.some((p) => p === neg)) {
      parts.push(neg)
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim()
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
  const core = query
    .split(/\s+/)
    .filter((t) => t && !t.startsWith('-'))
    .join(' ')
  const parts = core.split(/\s+/).filter(Boolean)
  const out: string[] = []
  if (parts.length >= 2) out.push(parts.slice(0, 2).join(' '))
  if (parts.length >= 1) out.push(parts[0]!)
  const q = core.toLowerCase()
  if (q.includes('iphone')) out.push('iPhone')
  if (q.includes('quest')) out.push('Quest 3')
  if (q.includes('xbox')) out.push('Xbox')
  return [...new Set(out.filter((x) => x && x.toLowerCase() !== q))]
}

async function browseSearchAu(input: {
  query: string
  limit?: number
  category?: string | null
}): Promise<ComparableListing[]> {
  const cfg = ebayConfig()
  const SPARSE_THRESHOLD = 8
  const strictQuery = enrichBrowseQuery(input.query, input.category)
  const primary = await searchOnce({
    query: strictQuery,
    limit: input.limit,
    strictFilters: !cfg.isSandbox,
  })

  if (cfg.isSandbox) {
    if (primary.length > 0) return primary
    for (const broader of broadenQuery(input.query)) {
      const rows = await searchOnce({
        query: enrichBrowseQuery(broader, input.category),
        limit: input.limit,
        strictFilters: false,
      })
      if (rows.length > 0) return rows
    }
    return primary
  }

  if (primary.length >= SPARSE_THRESHOLD) return primary

  const relaxed = await searchOnce({
    query: relaxBrowseQuery(strictQuery),
    limit: input.limit,
    strictFilters: true,
  })
  if (relaxed.length > primary.length && relaxed.length >= SPARSE_THRESHOLD) {
    return relaxed
  }
  const bestSoFar = relaxed.length > primary.length ? relaxed : primary
  if (bestSoFar.length >= 3) return bestSoFar

  const core = await searchOnce({
    query: coreBrowseQuery(strictQuery),
    limit: input.limit,
    strictFilters: true,
  })
  return core.length > bestSoFar.length ? core : bestSoFar
}

export type CompsRequestBody = {
  brand?: string
  model?: string
  variant?: string | null
  category?: string | null
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
      category: body.category,
    })

  if (!query) {
    return { ok: false, error: 'Missing search query (brand/model or query).' }
  }

  const enriched =
    body.query?.trim()
      ? enrichBrowseQuery(body.query.trim(), body.category)
      : query

  if (!ebayConfig().configured) {
    return { ok: true, source: 'unavailable', query: enriched, listings: [] }
  }

  try {
    const listings = await browseSearchAu({
      query: enriched,
      limit: body.limit,
      category: body.category,
    })
    return { ok: true, source: 'ebay', query: enriched, listings }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    if (message === 'MISSING_EBAY_KEYS') {
      return { ok: true, source: 'unavailable', query: enriched, listings: [] }
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
