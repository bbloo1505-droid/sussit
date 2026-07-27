import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import {
  extractedListingSchema,
  type ExtractedListing,
  V0_CATEGORIES,
} from './listingSchema.ts'

const SYSTEM = `You extract structured product listing data for SussIt, an Australian second-hand buying app.

Rules:
- Identify and extract only. Never estimate market value or say if it is a good deal.
- Unknown information must be null (or empty arrays). Do not invent accessories, condition, or price.
- Currency is AUD when a dollar amount is shown without currency.
- V0 supported categories: phone (iPhones), console (PlayStation, Xbox, Nintendo Switch), vr_headset (Meta Quest).
- If the listing is clearly outside those categories (cars, furniture, cameras, Windows laptops, etc.), set refused=true and explain in refusalReason.
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

  if (
    !parsed.refused &&
    parsed.category !== 'unknown' &&
    !V0_CATEGORIES.has(parsed.category)
  ) {
    return {
      ...parsed,
      refused: true,
      refusalReason:
        parsed.refusalReason ??
        `SussIt V0 only supports iPhones, consoles, and Meta Quest — not ${parsed.category}.`,
    }
  }

  return parsed
}
