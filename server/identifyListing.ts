import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import {
  extractedListingSchema,
  type ExtractedListing,
} from './listingSchema.ts'

const SYSTEM = `You extract structured product listing data for SussIt, an Australian second-hand buying app.

Rules:
- Identify and extract only. Never estimate market value or say if it is a good deal.
- Unknown information must be null (or empty arrays). Do not invent accessories, condition, or price.
- Currency is AUD when a dollar amount is shown without currency.
- Accept ANY second-hand listing. Classify category as precisely as possible.
- Categories: phone, console, vr_headset, camera, laptop, tablet, wearable, audio, gpu, power_tool, furniture, clothing, vehicle, jewellery, collectible, other, unknown.
- High-volume resale focus examples: iPhone/Samsung/Pixel; PS5/Xbox/Switch/Steam Deck; Meta Quest; Sony/Canon/Nikon cameras; Milwaukee/Makita/DeWalt tools; iPad/MacBook/Watch/headphones/GPUs.
- Set refused=true ONLY if you cannot identify a product at all (no brand/model and no usable asking price). Do NOT refuse merely because the category is outside phones/gaming/VR.
- identificationConfidence is 0–1 for how sure you are about brand/model/variant.`

export type IdentifyInput =
  | { kind: 'text'; text: string }
  | { kind: 'image'; dataUrl: string; mimeType?: string }

export async function identifyListing(
  input: IdentifyInput,
): Promise<ExtractedListing> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('MISSING_OPENAI_KEY')
  }

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
  if (!parsed) {
    throw new Error('EMPTY_MODEL_RESPONSE')
  }

  // Universal intake: never force-refuse by category. Downstream intelligence tiers gate verdicts.
  return parsed
}
