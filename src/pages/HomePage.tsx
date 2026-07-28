import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ImagePlus, LoaderCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'
import {
  extractListing,
  toIdentifiedProduct,
} from '@/lib/api/extractListing'
import { saveDraft } from '@/lib/analysis/draftStore'
import { intelligenceTierForCategory } from '@/lib/intelligence/supportTier'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

/** Free consumer home — Know what to pay before you buy. */
export function HomePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runExtract(input: {
    text?: string
    imageDataUrl?: string
    source: 'image' | 'text'
  }) {
    setBusy(true)
    setError(null)
    try {
      const result = await extractListing({
        text: input.text,
        imageDataUrl: input.imageDataUrl,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }

      if (result.listing.refused) {
        setError(
          result.listing.refusalReason ??
            'Could not identify this listing. Try a clearer screenshot or paste more detail.',
        )
        return
      }

      const product = toIdentifiedProduct(result.listing)
      if (!product) {
        setError(
          'Could not identify brand, model, or asking price. Try a clearer listing.',
        )
        return
      }

      saveDraft(product, {
        usedFallback: result.usedFallback,
        source: input.source,
        intelligenceTier: intelligenceTierForCategory(product.category),
      })
      navigate('/confirm')
    } catch {
      setError('Something went wrong extracting the listing.')
    } finally {
      setBusy(false)
    }
  }

  async function onFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image screenshot.')
      return
    }
    const dataUrl = await readFileAsDataUrl(file)
    await runExtract({ imageDataUrl: dataUrl, source: 'image' })
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void onFile(file)
    event.target.value = ''
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-5 pb-9">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="mb-9">
          <h1 className="font-display text-[48px] leading-[0.96] font-black tracking-[-0.045em] text-cream">
            Should I
            <br />
            buy this?
          </h1>
          <p className="mt-4 max-w-[20rem] text-[16px] leading-6 text-muted">
            Know what to pay before you buy.
          </p>
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="mb-3 rounded-[22px] border border-dashed border-lime/30 bg-lime/[0.03] px-5 py-10 text-center transition hover:bg-lime/[0.07] disabled:opacity-50"
        >
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-lime/10 text-lime">
            {busy ? (
              <LoaderCircle size={27} className="animate-spin" />
            ) : (
              <ImagePlus size={27} />
            )}
          </span>
          <span className="block text-[15px] font-semibold text-cream">
            Upload screenshot
          </span>
          <span className="mt-1 block text-[13px] text-muted">
            From Marketplace, eBay, or Gumtree
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />

        <div className="my-1 flex items-center gap-3 text-[12px] text-muted">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <textarea
          value={text}
          disabled={busy}
          onChange={(e) => setText(e.target.value)}
          className="mb-4 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-surface p-4 text-[15px] leading-6 text-cream outline-none placeholder:text-muted focus:border-lime/50 disabled:opacity-50"
          placeholder="Paste listing text with a $ price…"
        />

        {error ? (
          <p className="mb-4 text-[13px] leading-5 text-[#f87171]">{error}</p>
        ) : null}

        <PrimaryButton
          disabled={busy || !text.trim()}
          onClick={() => void runExtract({ text: text.trim(), source: 'text' })}
        >
          {busy ? (
            <>
              <LoaderCircle size={18} className="animate-spin" /> Extracting…
            </>
          ) : (
            <>
              Suss it out <ArrowRight size={18} />
            </>
          )}
        </PrimaryButton>
      </main>
    </div>
  )
}
