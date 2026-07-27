import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

/**
 * Production Vercel Function: /api/extract
 *
 * Self-contained (npm imports only) so Vercel Node ESM can load it.
 * Local Vite middleware still uses server/handleExtract.ts.
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

const questDemoFallback: ExtractedListing = {
  category: 'vr_headset',
  brand: 'Meta',
  model: 'Quest 3',
  variant: '512GB',
  askingPrice: 850,
  currency: 'AUD',
  condition: 'used_good',
  location: 'Brisbane',
  includedAccessories: ['left controller', 'right controller'],
  missingInformation: ['charger', 'lens condition', 'battery condition'],
  sellerClaims: ['barely used'],
  visibleIssues: [],
  identificationConfidence: 0.96,
  refused: false,
  refusalReason: null,
}

type Pattern = {
  category: ExtractedListing['category']
  brand: string
  model: string
  variant: string | null
  match: RegExp
  confidence: number
}

const PATTERNS: Pattern[] = [
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '512GB',
    match: /quest\s*3[^0-9a-z]*(512)/i,
    confidence: 0.88,
  },
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '128GB',
    match: /quest\s*3[^0-9a-z]*(128)/i,
    confidence: 0.86,
  },
  {
    category: 'vr_headset',
    brand: 'Meta',
    model: 'Quest 3',
    variant: null,
    match: /(?:meta\s*)?quest\s*3\b/i,
    confidence: 0.75,
  },
  {
    category: 'console',
    brand: 'Nintendo',
    model: 'Switch OLED',
    variant: null,
    match: /switch\s*oled/i,
    confidence: 0.9,
  },
  {
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Disc',
    match: /(?:playstation\s*5|ps5).{0,20}disc/i,
    confidence: 0.88,
  },
  {
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Digital',
    match: /(?:playstation\s*5|ps5).{0,20}digital/i,
    confidence: 0.88,
  },
  {
    category: 'console',
    brand: 'Sony',
    model: 'PlayStation 5',
    variant: 'Disc',
    match: /\bps5\b|playstation\s*5/i,
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
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 15',
    variant: '128GB',
    match: /iphone\s*15(?!\s*pro)[^0-9a-z]*(128)/i,
    confidence: 0.88,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14',
    variant: '128GB',
    match: /iphone\s*14(?!\s*pro)[^0-9a-z]*(128)/i,
    confidence: 0.88,
  },
  {
    category: 'phone',
    brand: 'Apple',
    model: 'iPhone 14',
    variant: '256GB',
    match: /iphone\s*14(?!\s*pro)[^0-9a-z]*(256)/i,
    confidence: 0.88,
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
    variant: '128GB',
    match: /iphone\s*13(?!\s*pro)[^0-9a-z]*(128)/i,
    confidence: 0.86,
  },
]

function heuristicExtractFromText(text: string): ExtractedListing | null {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length < 8) return null

  const askingPrice = parseAskingPrice(cleaned)
  const pattern = PATTERNS.find((p) => p.match.test(cleaned))
  if (!pattern || askingPrice == null) return null

  return {
    category: pattern.category,
    brand: pattern.brand,
    model: pattern.model,
    variant: pattern.variant,
    askingPrice,
    currency: 'AUD',
    condition: parseCondition(cleaned),
    location: parseLocation(cleaned),
    includedAccessories: parseAccessories(cleaned, pattern.category),
    missingInformation: [],
    sellerClaims: [],
    visibleIssues: parseIssues(cleaned),
    identificationConfidence: pattern.confidence,
    refused: false,
    refusalReason: null,
  }
}

function parseAskingPrice(text: string): number | null {
  const matches = [
    ...text.matchAll(/\$\s*([0-9]{2,5}(?:,[0-9]{3})?(?:\.[0-9]{2})?)/g),
  ]
  if (matches.length === 0) {
    const bare = text.match(
      /(?:price|asking|obo|negotiable|firm)?\s*(?:is|:)?\s*([0-9]{2,4})\b/i,
    )
    if (!bare) return null
    const n = Number(bare[1])
    return n >= 40 && n <= 5000 ? n : null
  }

  const amounts = matches
    .map((m) => Number(m[1]!.replace(/,/g, '')))
    .filter((n) => n >= 40 && n <= 5000)
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
  if (category === 'phone' && /charger|cable|box/.test(t)) {
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

      if (body.allowDemoFallback !== false) {
        return {
          ok: true,
          listing: questDemoFallback,
          usedFallback: true,
          extractMode: 'demo',
        }
      }

      return {
        ok: false,
        error:
          'OpenAI API key is not configured. Paste listing text with a $ price, or add OPENAI_API_KEY.',
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
    res.setHeader?.('Content-Type', 'application/json')
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const result = await handleExtract((req.body ?? {}) as ExtractRequestBody)
  res.setHeader?.('Content-Type', 'application/json')
  res.status(result.ok ? 200 : 400).json(result)
}
