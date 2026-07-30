import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ImagePlus, LoaderCircle } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'
import { PriceJudgementBar } from '@/components/home/PriceJudgementBar'
import {
  extractListing,
  toIdentifiedProduct,
} from '@/lib/api/extractListing'
import { saveDraft } from '@/lib/analysis/draftStore'
import { EXAMPLE_LISTINGS } from '@/lib/analysis/exampleListings'
import { intelligenceTierForCategory } from '@/lib/intelligence/supportTier'
import { formatAud, cn } from '@/lib/utils'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

/** Free consumer home — one decisive action, then an intelligent answer. */
export function HomePage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pasteMode, setPasteMode] = useState(false)
  const [text, setText] = useState('')
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingPreview, setPendingPreview] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canSubmit = pasteMode
    ? text.trim().length > 0
    : Boolean(pendingFile || pendingPreview)

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

  async function acceptFile(file: File) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image screenshot.')
      return
    }
    setError(null)
    setPasteMode(false)
    setPendingFile(file)
    setPendingPreview(await readFileAsDataUrl(file))
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) void acceptFile(file)
    event.target.value = ''
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) void acceptFile(file)
  }

  async function onSubmit() {
    if (busy || !canSubmit) return
    if (pasteMode) {
      await runExtract({ text: text.trim(), source: 'text' })
      return
    }
    if (pendingPreview) {
      await runExtract({ imageDataUrl: pendingPreview, source: 'image' })
    }
  }

  function tryExample(id: string) {
    const example = EXAMPLE_LISTINGS.find((e) => e.id === id)
    if (!example) return
    saveDraft(example.product, {
      usedFallback: true,
      source: 'demo',
      intelligenceTier: intelligenceTierForCategory(example.product.category),
    })
    navigate('/confirm')
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-6 pb-12">
      <Header variant="home" />

      <main className="flex flex-1 flex-col">
        <section className="mb-8">
          <h1 className="max-w-[20ch] font-display text-[48px] leading-[0.95] font-extrabold tracking-[-0.045em] text-cream">
            Should I buy this listing?
          </h1>
          <p className="mt-4 max-w-[34ch] text-[15px] leading-6 text-muted">
            Upload it and see what it’s really worth, what to offer and what to
            watch out for.
          </p>
        </section>

        <section
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          className={cn(
            'rounded-[18px] border bg-surface px-5 transition',
            pendingPreview ? 'py-5' : 'py-7',
            dragOver
              ? 'border-lime/40 bg-lime/[0.04]'
              : 'border-white/10',
          )}
          style={{ minHeight: pendingPreview ? undefined : 188 }}
        >
          {pendingPreview ? (
            <div className="flex items-center gap-4">
              <img
                src={pendingPreview}
                alt=""
                className="size-14 shrink-0 rounded-[10px] object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-cream">
                  {pendingFile?.name ?? 'Screenshot ready'}
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setPendingFile(null)
                    setPendingPreview(null)
                    inputRef.current?.click()
                  }}
                  className="mt-1 text-[13px] text-muted underline-offset-2 hover:text-cream hover:underline"
                >
                  Choose a different image
                </button>
              </div>
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <span className="mb-3 grid size-10 place-items-center rounded-[10px] bg-panel text-muted">
                {busy ? (
                  <LoaderCircle size={20} className="animate-spin text-lime" />
                ) : (
                  <ImagePlus size={20} />
                )}
              </span>
              <p className="text-[15px] font-semibold text-cream">
                Drop in a screenshot
              </p>
              <p className="mt-1 text-[13px] text-muted">
                Marketplace, eBay or Gumtree
              </p>
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="mt-5 rounded-[10px] border border-white/10 bg-panel px-4 py-2.5 text-[13px] font-semibold text-cream transition hover:border-white/20 hover:bg-[#1e221c] disabled:opacity-50"
              >
                Choose screenshot
              </button>
            </div>
          )}
        </section>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onPick}
        />

        {!pasteMode ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              setPasteMode(true)
              setPendingFile(null)
              setPendingPreview(null)
            }}
            className="mt-4 text-center text-[13px] text-muted transition hover:text-cream"
          >
            Or paste the listing instead
          </button>
        ) : (
          <div className="mt-4 animate-[fadeIn_200ms_ease-out]">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted">Listing text</p>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setPasteMode(false)
                  setText('')
                }}
                className="text-[12px] text-muted hover:text-cream"
              >
                Use screenshot
              </button>
            </div>
            <textarea
              value={text}
              disabled={busy}
              autoFocus
              onChange={(e) => setText(e.target.value)}
              className="min-h-[120px] w-full resize-none rounded-[18px] border border-white/10 bg-surface p-4 text-[15px] leading-6 text-cream outline-none placeholder:text-muted/70 focus:border-white/20 disabled:opacity-50"
              placeholder="Paste the listing title, price and details…"
            />
          </div>
        )}

        <p className="mt-5 text-[12px] text-muted">
          Try an example:{' '}
          {EXAMPLE_LISTINGS.map((ex, i) => (
            <span key={ex.id}>
              {i > 0 ? (
                <span className="text-muted/40"> · </span>
              ) : null}
              <button
                type="button"
                disabled={busy}
                onClick={() => tryExample(ex.id)}
                className="font-medium text-cream/80 underline-offset-2 transition hover:text-lime hover:underline disabled:opacity-50"
              >
                {ex.label}
              </button>
            </span>
          ))}
        </p>

        {error ? (
          <p className="mt-4 text-[13px] leading-5 text-[#f87171]">{error}</p>
        ) : null}

        <div className="mt-6">
          <PrimaryButton disabled={busy || !canSubmit} onClick={() => void onSubmit()}>
            {busy ? (
              <>
                <LoaderCircle size={18} className="animate-spin" /> Checking…
              </>
            ) : (
              <>
                Check this deal <ArrowRight size={18} />
              </>
            )}
          </PrimaryButton>
          <p className="mt-3 text-center text-[12px] text-muted">
            Takes about 10 seconds · No account required
          </p>
        </div>

        <Link
          to="/flip"
          className="mt-5 block text-center text-[13px] text-muted/80 underline-offset-4 transition hover:text-cream hover:underline"
        >
          Flip mode — what to search today
        </Link>

        {/* Below-fold product proof */}
        <aside className="mt-12 rounded-[18px] border border-white/10 bg-surface p-5">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">
            Example result
          </p>
          <p className="mt-2 text-[17px] font-semibold tracking-[-0.02em] text-cream">
            PS5 Slim Disc Edition
          </p>
          <dl className="mt-4 space-y-2 text-[13px]">
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Fair price</dt>
              <dd className="font-medium text-cream">$520–$590</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Asking</dt>
              <dd className="font-medium text-cream">{formatAud(650)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Verdict</dt>
              <dd className="font-semibold text-lime">Overpriced by ~$80</dd>
            </div>
          </dl>
          <PriceJudgementBar askPercent={78} className="mt-5" />
        </aside>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
