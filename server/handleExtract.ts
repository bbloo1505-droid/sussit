import { identifyListing, type IdentifyInput } from './identifyListing.ts'
import { heuristicExtractFromText } from './heuristicExtract.ts'

export type ExtractRequestBody = {
  text?: string
  imageDataUrl?: string
  /** Explicit demo only — never silently substitute a Quest listing. */
  allowDemoFallback?: boolean
}

export type ExtractResponse =
  | {
      ok: true
      listing: Awaited<ReturnType<typeof identifyListing>>
      usedFallback: boolean
      extractMode: 'openai' | 'heuristic' | 'demo'
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
