import { identifyListing, type IdentifyInput } from './identifyListing.ts'
import { questDemoFallback } from './questDemoFallback.ts'

export type ExtractRequestBody = {
  text?: string
  imageDataUrl?: string
  allowDemoFallback?: boolean
}

export type ExtractResponse =
  | {
      ok: true
      listing: Awaited<ReturnType<typeof identifyListing>>
      usedFallback: boolean
    }
  | { ok: false; error: string }

export async function handleExtract(
  body: ExtractRequestBody,
): Promise<ExtractResponse> {
  const text = body.text?.trim()
  const imageDataUrl = body.imageDataUrl

  if (!text && !imageDataUrl) {
    return { ok: false, error: 'Provide listing text or an image.' }
  }

  const input: IdentifyInput = imageDataUrl
    ? { kind: 'image', dataUrl: imageDataUrl }
    : { kind: 'text', text: text! }

  try {
    const listing = await identifyListing(input)
    return { ok: true, listing, usedFallback: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'EXTRACT_FAILED'

    if (message === 'MISSING_OPENAI_KEY' && body.allowDemoFallback !== false) {
      return {
        ok: true,
        listing: questDemoFallback,
        usedFallback: true,
      }
    }

    if (message === 'MISSING_OPENAI_KEY') {
      return {
        ok: false,
        error: 'OpenAI API key is not configured. Add OPENAI_API_KEY to .env.',
      }
    }

    console.error('[extract]', error)
    return { ok: false, error: 'Could not extract listing. Try again.' }
  }
}
