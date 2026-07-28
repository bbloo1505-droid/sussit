import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

/**
 * Production Vercel Function: /api/extract
 *
 * Self-contained (npm imports only) so Vercel Node ESM can load it.
 * Local Vite middleware still uses server/handleExtract.ts.
 * Heuristic block kept in sync with server/heuristicExtract.ts.
 */

const PRODUCT_CATEGORIES = [
  'phone',
  'console',
  'vr_headset',
  'camera',
  'laptop',
  'tablet',
  'wearable',
  'audio',
  'gpu',
  'power_tool',
  'furniture',
  'clothing',
  'vehicle',
  'jewellery',
  'collectible',
  'other',
  'unknown',
] as const

const extractedListingSchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  variant: z.string().nullable(),
  askingPrice: z.number().nullable(),
  currency: z.literal('AUD').nullable(),
  condition: z
    .enum([
      'new',
      'used_like_new',
      'used_good',
      'used_fair',
      'for_parts',
      'unknown',
    ])
    .nullable(),
  location: z.string().nullable(),
  includedAccessories: z.array(z.string()),
  missingInformation: z.array(z.string()),
  sellerClaims: z.array(z.string()),
  visibleIssues: z.array(z.string()),
  identificationConfidence: z.number().min(0).max(1),
  refused: z.boolean(),
  refusalReason: z.string().nullable(),
})

type ExtractedListing = z.infer<typeof extractedListingSchema>

const SYSTEM = `You extract structured product listing data for SussIt, an Australian second-hand buying app.

Rules:
- Identify and extract only. Never estimate market value or say if it is a good deal.
- Unknown information must be null (or empty arrays). Do not invent accessories, condition, or price.
- Currency is AUD when a dollar amount is shown without currency.
- Accept ANY second-hand listing. Classify category as precisely as possible.
- Categories: phone, console, vr_headset, camera, laptop, tablet, wearable, audio, gpu, power_tool, furniture, clothing, vehicle, jewellery, collectible, other, unknown.
- Set refused=true ONLY if you cannot identify a product at all (no brand/model and no usable asking price). Do NOT refuse merely because the category is outside phones/gaming/VR.
- identificationConfidence is 0–1 for how sure you are about brand/model/variant.`

type Pattern = {
  category: ExtractedListing['category']
  brand: string
  model: string
  variant: string | null
  match: RegExp
  confidence: number
}

/** More specific patterns must come first. */
const PATTERNS: Pattern[] = [
  // VR
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3S',
    variant: '128GB',
    match: /quest\s*3s[^0-9a-z]*(128)/i,
    confidence: 0.9,
  },
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3S',
    variant: null,
    match: /quest\s*3s\b/i,
    confidence: 0.86,
  },
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '512GB',
    match: /quest\s*3(?!\s*s)[^0-9a-z]*(512)/i,
    confidence: 0.88,
  },
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '128GB',
    match: /quest\s*3(?!\s*s)[^0-9a-z]*(128)/i,
    confidence: 0.86,
  },
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: null,
    match: /(?:meta\s*)?quest\s*3(?!\s*s)\b/i,
    confidence: 0.75,
  },
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 2',
    variant: '128GB',
    match: /(?:meta\s*|oculus\s*)?quest\s*2\b/i,
    confidence: 0.74,
  },

  // Consoles
  {
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch OLED',
    variant: null,
    match: /(?:switch\s*oled|oled\s*switch)/i,
    confidence: 0.9,
  },
  {
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch Lite',
    variant: null,
    match: /(?:switch\s*lite|lite\s*switch)/i,
    confidence: 0.9,
  },
  {
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch',
    variant: null,
    match: /(?:nintendo\s*)?switch\b(?!\s*oled|\s*lite)/i,
    confidence: 0.7,
  },
  {
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5 Pro',
    variant: null,
    match: /(?:play\s*station\s*5|playstation\s*5|ps5)\s*pro\b/i,
    confidence: 0.9,
  },
  {
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5 Slim',
    variant: 'Disc',
    match: /(?:play\s*station\s*5|playstation\s*5|ps5)\s*slim\b/i,
    confidence: 0.84,
  },
  {
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Digital',
    match: /(?:play\s*station\s*5|playstation\s*5|\bps5\b).{0,24}digital/i,
    confidence: 0.88,
  },
  {
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Disc',
    match: /play\s*station\s*5|playstation\s*5|\bps5\b/i,
    confidence: 0.72,
  },
  {
    category: 'console',
    brand: 'Microsoft',
    model: 'Xbox Series X',
    variant: null,
    match: /xbox\s*series\s*x\b/i,
    confidence: 0.9,
  },
  {
    category: 'console',
    brand: 'Microsoft',
    model: 'Xbox Series S',
    variant: null,
    match: /xbox\s*series\s*s\b/i,
    confidence: 0.9,
  },

  // Phones
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 16',
    variant: null,
    match: /iphone\s*16(?!\s*pro)\b/i,
    confidence: 0.72,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    variant: null,
    match: /(?:iphone\s*)?15\s*pro\s*max\b/i,
    confidence: 0.88,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    variant: null,
    match: /iphone\s*15\s*pro(?!\s*max)\b/i,
    confidence: 0.86,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15',
    variant: '128GB',
    match: /iphone\s*15(?!\s*pro|\s*plus)[^0-9a-z]*(128)/i,
    confidence: 0.88,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15',
    variant: null,
    match: /iphone\s*15(?!\s*pro|\s*plus)\b/i,
    confidence: 0.72,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14',
    variant: null,
    match: /iphone\s*14(?!\s*pro)\b/i,
    confidence: 0.7,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 13',
    variant: null,
    match: /iphone\s*13(?!\s*pro)\b/i,
    confidence: 0.7,
  },
  {
    category: 'phone',
    brand: 'Samsung',
    model: 'Galaxy S24',
    variant: null,
    match: /galaxy\s*s24\b/i,
    confidence: 0.82,
  },
  {
    category: 'phone',
    brand: 'Google',
    model: 'Pixel 8',
    variant: null,
    match: /pixel\s*8(?!\s*pro)\b/i,
    confidence: 0.8,
  },

  // Emerging
  {
    category: 'laptop',
    brand: 'Apple',
    model: 'MacBook Air M2',
    variant: null,
    match: /macbook\s*air.{0,12}m2\b/i,
    confidence: 0.84,
  },
  {
    category: 'tablet',
    brand: 'Apple',
    model: 'iPad Air',
    variant: null,
    match: /ipad\s*air\b/i,
    confidence: 0.8,
  },
  {
    category: 'wearable',
    brand: 'Apple',
    model: 'Watch Series 9',
    variant: null,
    match: /(?:apple\s*)?watch\s*series\s*9\b/i,
    confidence: 0.82,
  },
  {
    category: 'audio',
    brand: 'Apple',
    model: 'AirPods Pro 2',
    variant: null,
    match: /airpods\s*pro\s*(?:2|2nd)/i,
    confidence: 0.84,
  },
  {
    category: 'gpu',
    brand: 'NVIDIA',
    model: 'RTX 4070',
    variant: null,
    match: /rtx\s*4070(?!\s*ti|\s*super)/i,
    confidence: 0.82,
  },
  {
    category: 'power_tool',
    brand: 'Makita',
    model: 'Impact Driver',
    variant: '18V',
    match: /makita.{0,20}(?:impact|dtd|drill)/i,
    confidence: 0.75,
  },
  {
    category: 'power_tool',
    brand: 'DeWalt',
    model: 'Impact Driver',
    variant: null,
    match: /dewalt.{0,20}(?:impact|drill)/i,
    confidence: 0.75,
  },
  {
    category: 'power_tool',
    brand: 'Milwaukee',
    model: 'Impact Driver',
    variant: null,
    match: /milwaukee.{0,20}(?:impact|drill)/i,
    confidence: 0.75,
  },
  {
    category: 'camera',
    brand: 'Sony',
    model: 'A7 III',
    variant: null,
    match: /(?:sony\s*)?a7\s*iii\b|a7iii/i,
    confidence: 0.82,
  },
  {
    category: 'camera',
    brand: 'Canon',
    model: 'EOS R6',
    variant: null,
    match: /(?:canon\s*)?eos\s*r6\b/i,
    confidence: 0.82,
  },
  {
    category: 'furniture',
    brand: 'IKEA',
    model: 'Furniture',
    variant: null,
    match: /\bikea\b/i,
    confidence: 0.55,
  },
]

const BRAND_HINTS: Array<{ brand: string; re: RegExp; category?: ExtractedListing['category'] }> = [
  { brand: 'Apple', re: /\bapple\b|iphone|ipad|macbook|airpods/i },
  { brand: 'Samsung', re: /\bsamsung\b|galaxy\b/i },
  { brand: 'Sony', re: /\bsony\b|playstation|\bps5\b/i },
  { brand: 'Microsoft', re: /\bmicrosoft\b|xbox\b/i },
  { brand: 'Nintendo', re: /\bnintendo\b|switch\b/i },
  { brand: 'Meta', re: /\bmeta\b|oculus\b|quest\b/i },
  { brand: 'Google', re: /\bgoogle\b|pixel\b/i },
  { brand: 'Makita', re: /\bmakita\b/i, category: 'power_tool' },
  { brand: 'DeWalt', re: /\bdewalt\b/i, category: 'power_tool' },
  { brand: 'Milwaukee', re: /\bmilwaukee\b/i, category: 'power_tool' },
  { brand: 'IKEA', re: /\bikea\b/i, category: 'furniture' },
  { brand: 'Canon', re: /\bcanon\b/i, category: 'camera' },
  { brand: 'Nikon', re: /\bnikon\b/i, category: 'camera' },
  { brand: 'Lenovo', re: /\blenovo\b|thinkpad\b/i, category: 'laptop' },
  { brand: 'NVIDIA', re: /\bnvidia\b|\brtx\b/i, category: 'gpu' },
]

/**
 * Free, offline extract for pasted AU Marketplace/eBay text.
 * Never invents prices — only parses explicit $ amounts.
 * Falls back to a generic brand/model parse for universal intake.
 */
function heuristicExtractFromText(text: string): ExtractedListing | null {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 6) return null

  const askingPrice = parseAskingPrice(cleaned)
  if (askingPrice == null) return null

  const pattern = PATTERNS.find((p) => p.match.test(cleaned))
  if (pattern) {
    return finish(cleaned, {
      category: pattern.category,
      brand: pattern.brand,
      model: pattern.model,
      variant: pattern.variant ?? extractVariantHint(cleaned),
      identificationConfidence: pattern.confidence,
    }, askingPrice)
  }

  return genericExtract(cleaned, askingPrice)
}

function genericExtract(
  cleaned: string,
  askingPrice: number,
): ExtractedListing | null {
  const brandHit = BRAND_HINTS.find((b) => b.re.test(cleaned))
  const category = inferGenericCategory(cleaned, brandHit?.category)
  const brand = brandHit?.brand ?? guessUnlistedBrand(cleaned) ?? 'Unbranded'

  // Model: strip price/location noise, take a short descriptive phrase
  let model = cleaned
    .replace(/\$\s*[0-9,]+(?:\.[0-9]{2})?/g, ' ')
    .replace(
      /\b(Sydney|Melbourne|Brisbane|Perth|Adelaide|Hobart|Canberra|NSW|VIC|QLD|WA|SA|TAS|ACT|pickup|negotiable|obo|firm|for sale|selling)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim()

  if (brand !== 'Unbranded') {
    model = model.replace(new RegExp(brand, 'ig'), ' ').replace(/\s+/g, ' ').trim()
  }

  // Keep first ~8 tokens as model label
  const tokens = model.split(/\s+/).filter(Boolean).slice(0, 8)
  model = tokens.join(' ')
  if (model.length < 3) {
    model = cleaned.slice(0, 48).trim()
  }

  const confidence = brand === 'Unbranded' ? 0.35 : 0.48

  return finish(
    cleaned,
    {
      category,
      brand,
      model,
      variant: extractVariantHint(cleaned),
      identificationConfidence: confidence,
    },
    askingPrice,
  )
}

function inferGenericCategory(
  text: string,
  hinted?: ExtractedListing['category'],
): ExtractedListing['category'] {
  if (hinted) return hinted
  const t = text.toLowerCase()
  if (/sofa|couch|table|chair|desk|wardrobe|dresser|bed\b|furniture/.test(t)) {
    return 'furniture'
  }
  if (/dress|shirt|jacket|jeans|shoes|sneakers|clothing|nike|adidas/.test(t)) {
    return 'clothing'
  }
  if (/car\b|toyota|mazda|honda|utes?\b|vehicle|motorbike/.test(t)) {
    return 'vehicle'
  }
  if (/ring|necklace|gold|jewellery|jewelry|rolex/.test(t)) return 'jewellery'
  if (/lego|pokemon|funko|collectible|trading card/.test(t)) return 'collectible'
  if (/camera|lens|mirrorless|dslr/.test(t)) return 'camera'
  if (/laptop|macbook|notebook/.test(t)) return 'laptop'
  if (/ipad|tablet/.test(t)) return 'tablet'
  if (/watch\b/.test(t)) return 'wearable'
  if (/headphones|earbuds|airpods/.test(t)) return 'audio'
  if (/rtx|gtx|graphics\s*card|gpu/.test(t)) return 'gpu'
  if (/drill|impact|saw|grinder|makita|dewalt|milwaukee/.test(t)) {
    return 'power_tool'
  }
  if (/iphone|galaxy|pixel|phone/.test(t)) return 'phone'
  if (/ps5|xbox|switch|console|play\s*station/.test(t)) return 'console'
  if (/quest|vr\s*headset/.test(t)) return 'vr_headset'
  return 'other'
}

function guessUnlistedBrand(text: string): string | null {
  const m = text.match(
    /\b([A-Z][a-zA-Z0-9&-]{1,20})\b(?=\s+[A-Za-z0-9])/,
  )
  if (!m) return null
  const word = m[1]!
  if (
    /^(For|The|Sale|Selling|Pickup|Price|Used|New|Good|Great|Size)$/i.test(
      word,
    )
  ) {
    return null
  }
  return word
}

function extractVariantHint(text: string): string | null {
  const gb = text.match(/\b(\d+)\s*gb\b/i)
  if (gb) return `${gb[1]}GB`
  const size = text.match(/\b(\d+(?:\.\d+)?)\s*(?:inch|"|cm)\b/i)
  if (size) return size[0]
  return null
}

function finish(
  cleaned: string,
  core: {
    category: ExtractedListing['category']
    brand: string
    model: string
    variant: string | null
    identificationConfidence: number
  },
  askingPrice: number,
): ExtractedListing {
  return {
    category: core.category,
    brand: core.brand,
    model: core.model,
    variant: core.variant,
    askingPrice,
    currency: 'AUD',
    condition: parseCondition(cleaned),
    location: parseLocation(cleaned),
    includedAccessories: parseAccessories(cleaned, core.category),
    missingInformation: [],
    sellerClaims: [],
    visibleIssues: parseIssues(cleaned),
    identificationConfidence: core.identificationConfidence,
    refused: false,
    refusalReason: null,
  }
}

function parseAskingPrice(text: string): number | null {
  const matches = [
    ...text.matchAll(/\$\s*([0-9]{1,6}(?:,[0-9]{3})?(?:\.[0-9]{2})?)/g),
  ]
  if (matches.length === 0) {
    const bare = text.match(
      /(?:price|asking|obo|negotiable|firm)?\s*(?:is|:)?\s*([0-9]{2,5})\b/i,
    )
    if (!bare) return null
    const n = Number(bare[1])
    return n >= 5 && n <= 200_000 ? n : null
  }

  const amounts = matches
    .map((m) => Number(m[1].replace(/,/g, '')))
    .filter((n) => n >= 5 && n <= 200_000)
  if (amounts.length === 0) return null
  return amounts[0]!
}

function parseCondition(text: string): ExtractedListing['condition'] {
  const t = text.toLowerCase()
  if (/for parts|not working|faulty|broken|spares/.test(t)) return 'for_parts'
  if (/brand new|sealed|unopened|bnib/.test(t)) return 'new'
  if (/like new|mint|barely used|excellent/.test(t)) return 'used_like_new'
  if (/fair|worn|scuffs|scratches/.test(t)) return 'used_fair'
  if (/used|good condition|working/.test(t)) return 'used_good'
  return 'unknown'
}

function parseLocation(text: string): string | null {
  const m = text.match(
    /\b(Sydney|Melbourne|Brisbane|Perth|Adelaide|Hobart|Canberra|Gold Coast|Newcastle|Geelong|Wollongong|NSW|VIC|QLD|WA|SA|TAS|ACT)\b/i,
  )
  return m ? m[1]! : null
}

function parseAccessories(
  text: string,
  category: ExtractedListing['category'],
): string[] {
  const t = text.toLowerCase()
  const out: string[] = []
  if (category === 'vr_headset') {
    if (/controller/.test(t)) out.push('controllers')
    if (/charger|cable/.test(t)) out.push('charger')
  }
  if (category === 'console') {
    if (/controller|dualsense|joy-?con/.test(t)) out.push('controller')
    if (/dock/.test(t)) out.push('dock')
  }
  if (category === 'power_tool') {
    if (/battery|batteries/.test(t)) out.push('battery')
    if (/charger/.test(t)) out.push('charger')
    if (/case|bag|kit/.test(t)) out.push('kit/case')
  }
  if ((category === 'phone' || category === 'tablet') && /charger|cable|box/.test(t)) {
    if (/charger|cable/.test(t)) out.push('charger')
    if (/\bbox\b/.test(t)) out.push('box')
  }
  return out
}

function parseIssues(text: string): string[] {
  const t = text.toLowerCase()
  const out: string[] = []
  if (/scratch|scuff/.test(t)) out.push('cosmetic wear noted')
  if (/battery/.test(t) && /(bad|poor|weak|72|70|68)/.test(t)) {
    out.push('battery concern mentioned')
  }
  return out
}


async function identifyListing(
  input:
    | { kind: 'text'; text: string }
    | { kind: 'image'; dataUrl: string },
): Promise<ExtractedListing> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('MISSING_OPENAI_KEY')

  const client = new OpenAI({ apiKey })
  const userContent: OpenAI.Chat.Completions.ChatCompletionContentPart[] =
    input.kind === 'text'
      ? [
          {
            type: 'text',
            text: `Extract the listing from this pasted text:\n\n${input.text}`,
          },
        ]
      : [
          {
            type: 'text',
            text: 'Extract the product listing from this Marketplace/eBay/Gumtree screenshot.',
          },
          {
            type: 'image_url',
            image_url: { url: input.dataUrl },
          },
        ]

  const completion = await client.chat.completions.parse({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: userContent },
    ],
    response_format: zodResponseFormat(extractedListingSchema, 'listing'),
  })

  const parsed = completion.choices[0]?.message.parsed
  if (!parsed) throw new Error('EMPTY_MODEL_RESPONSE')

  // Universal intake: never force-refuse by category. Intelligence tiers gate verdicts later.
  return parsed
}

type ExtractRequestBody = {
  text?: string
  imageDataUrl?: string
  allowDemoFallback?: boolean
}

type ExtractResponse =
  | {
      ok: true
      listing: ExtractedListing
      usedFallback: boolean
      extractMode: 'openai' | 'heuristic' | 'demo'
    }
  | { ok: false; error: string }

async function handleExtract(
  body: ExtractRequestBody,
): Promise<ExtractResponse> {
  const text = body.text?.trim()
  const imageDataUrl = body.imageDataUrl

  if (!text && !imageDataUrl) {
    return { ok: false, error: 'Provide listing text or an image.' }
  }

  try {
    const listing = await identifyListing(
      imageDataUrl
        ? { kind: 'image', dataUrl: imageDataUrl }
        : { kind: 'text', text: text! },
    )
    return { ok: true, listing, usedFallback: false, extractMode: 'openai' }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'EXTRACT_FAILED'

    if (message === 'MISSING_OPENAI_KEY') {
      if (text) {
        const heuristic = heuristicExtractFromText(text)
        if (heuristic) {
          return {
            ok: true,
            listing: heuristic,
            usedFallback: false,
            extractMode: 'heuristic',
          }
        }
      }

      return {
        ok: false,
        error:
          'Could not identify this listing offline. Paste text that includes a $ price and product name, or add OPENAI_API_KEY for screenshots / harder titles.',
      }
    }

    console.error('[extract]', error)
    return { ok: false, error: 'Could not extract listing. Try again.' }
  }
}

type Req = { method?: string; body?: ExtractRequestBody }
type Res = {
  status: (code: number) => Res
  json: (body: unknown) => void
  setHeader?: (name: string, value: string) => void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }
  const result = await handleExtract(req.body ?? {})
  res.status(result.ok ? 200 : 400).json(result)
}
