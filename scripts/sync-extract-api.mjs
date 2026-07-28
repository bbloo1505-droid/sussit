import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const heuristic = fs.readFileSync(
  path.join(root, 'server/heuristicExtract.ts'),
  'utf8',
)

const body = heuristic
  .replace(/^import type.*\r?\n\r?\n/, '')
  .replace(
    'export function heuristicExtractFromText',
    'function heuristicExtractFromText',
  )

const head = `import OpenAI from 'openai'
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

const SYSTEM = \`You extract structured product listing data for SussIt, an Australian second-hand buying app.

Rules:
- Identify and extract only. Never estimate market value or say if it is a good deal.
- Unknown information must be null (or empty arrays). Do not invent accessories, condition, or price.
- Currency is AUD when a dollar amount is shown without currency.
- Accept ANY second-hand listing. Classify category as precisely as possible.
- Categories: phone, console, vr_headset, camera, laptop, tablet, wearable, audio, gpu, power_tool, furniture, clothing, vehicle, jewellery, collectible, other, unknown.
- Set refused=true ONLY if you cannot identify a product at all (no brand/model and no usable asking price). Do NOT refuse merely because the category is outside phones/gaming/VR.
- identificationConfidence is 0–1 for how sure you are about brand/model/variant.\`

`

const tail = `
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
            text: \`Extract the listing from this pasted text:\\n\\n\${input.text}\`,
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
`

fs.writeFileSync(path.join(root, 'api/extract.ts'), head + body + '\n' + tail)
console.log('synced api/extract.ts')
