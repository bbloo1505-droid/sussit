/**
 * Build eBay Browse `q` strings that prefer full units and suppress
 * accessory/case/strap noise. Used by local server + mirrored in api/comps.ts.
 */

export type BrowseQueryProduct = {
  brand: string
  model: string
  variant?: string | null
  category?: string | null
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

export function inferCategoryFromText(
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

function modelSpecificNegations(query: string): string[] {
  const q = query.toLowerCase()
  const out: string[] = []

  // iPhone Pro (not Pro Max) — suppress Max siblings
  if (/iphone\s*\d+\s*pro\b/.test(q) && !/pro\s*max/.test(q)) {
    out.push('-Max')
  }

  // iPhone base — suppress Pro / Plus
  if (/iphone\s*\d+\b/.test(q) && !/\bpro\b/.test(q) && !/\bplus\b/.test(q)) {
    out.push('-Pro', '-Plus', '-Max')
  }

  // Quest 3 (not 3S)
  if (/quest\s*3\b/.test(q) && !/quest\s*3s/.test(q)) {
    out.push('-3S', '-3s')
  }

  // Quest 2 — keep 3S / Pro out (avoid bare "-3" which is too broad on eBay)
  if (/quest\s*2\b/.test(q)) {
    out.push('-3S', '-3s', '-Pro')
  }

  // PS5 Slim / Pro / base
  if (/\bps5\b|playstation\s*5/.test(q)) {
    if (/\bslim\b/.test(q)) {
      out.push('-Pro', '-Drive')
      if (/\bdisc\b/.test(q)) out.push('-Digital')
      if (/\bdigital\b/.test(q)) out.push('-Disc')
    } else if (/\bpro\b/.test(q)) {
      out.push(
        '-Slim',
        '-PS2',
        '-PS4',
        '-PES',
        '-Soccer',
        '-Evolution',
        '-Controller',
        '-Headset',
        '-Wheel',
        '-Adapter',
        '-Dongle',
      )
    } else {
      out.push('-Slim', '-Pro')
      if (/\bdisc\b/.test(q)) out.push('-Digital', '-Drive')
      if (/\bdigital\b/.test(q)) out.push('-Disc', '-Code', '-Download', '-DLC')
    }
  }

  // Switch OLED / Lite / base
  if (/\bswitch\b/.test(q)) {
    if (/\boled\b/.test(q)) out.push('-Lite')
    else if (/\blite\b/.test(q)) out.push('-OLED')
    else out.push('-OLED', '-Lite')
  }

  // RTX 4070 base — suppress Ti / SUPER siblings and laptop noise leftovers
  if (/\brtx\s*4070\b/.test(q) && !/\bti\b/.test(q) && !/\bsuper\b/.test(q)) {
    out.push('-Ti', '-SUPER', '-Super')
  }

  // PS5 Pro — eBay loves "Tony Hawk Pro Skater 5" and "Pro Enhanced" games
  if (/\bps5\s*pro\b|playstation\s*5\s*pro/.test(q)) {
    out.push('-Hawk', '-Skater', '-Tony', '-Fanatec', '-Magazine', '-Enhanced')
  }

  return out
}

function unitPositives(
  category: string | null,
  query: string,
): string[] {
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
  if (category === 'gpu') {
    if (!/\bgpu\b/.test(q) && !/\bgraphics\b/.test(q)) return []
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

/**
 * Enrich a raw Browse query with unit positives + accessory negations.
 * Idempotent if enrichments are already present.
 */
export function enrichBrowseQuery(
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

/** Primary comps query builder from an identified product. */
export function buildSearchQuery(product: BrowseQueryProduct): string {
  const brand =
    product.brand && !/^unbranded$/i.test(product.brand) ? product.brand : ''
  const core = [brand, product.model, product.variant]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()

  // Prefer shorter brand+model for Meta/Sony noise
  let tuned = core
  const model = (product.model ?? '').toLowerCase()
  if (model.includes('playstation 5')) {
    // Prefer "PlayStation 5 Pro" over "PS5 Pro" — eBay matches PES / Hawk on PS5 Pro
    if (model.includes('pro')) {
      tuned = ['PlayStation 5 Pro', product.variant].filter(Boolean).join(' ')
    } else if (model.includes('slim')) {
      tuned = ['PS5 Slim', product.variant].filter(Boolean).join(' ')
    } else {
      tuned = core
        .replace(/Sony\s+/i, '')
        .replace(/PlayStation\s*5/i, 'PS5')
        .replace(/\s+/g, ' ')
        .trim()
    }
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
  if (model.includes('galaxy')) {
    tuned = core.replace(/^Samsung\s+/i, '').replace(/\s+/g, ' ').trim()
  }
  if (model.includes('pixel')) {
    tuned = core.replace(/^Google\s+/i, '').replace(/\s+/g, ' ').trim()
  }
  if (model.includes('xbox')) {
    tuned = core.replace(/^Microsoft\s+/i, '').replace(/\s+/g, ' ').trim()
  }
  if (/rtx|gtx/.test(model)) {
    tuned = core.replace(/^NVIDIA\s+/i, '').replace(/\s+/g, ' ').trim()
  }

  const category =
    product.category ?? inferCategoryFromText(`${product.brand} ${product.model}`)

  return enrichBrowseQuery(tuned, category)
}

/**
 * Strip most accessory negations but keep model-sibling guards.
 * Used when a strict Browse query returns too few USED AU hits.
 */
export function relaxBrowseQuery(query: string): string {
  const keepNeg = new Set(
    [
      '-3S',
      '-3s',
      '-Slim',
      '-Pro',
      '-Digital',
      '-Disc',
      '-Drive',
      '-Lite',
      '-OLED',
      '-Max',
      '-Plus',
      '-PS2',
      '-PES',
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

/** Core tokens only — last-resort sparse inventory fallback. */
export function coreBrowseQuery(query: string): string {
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
