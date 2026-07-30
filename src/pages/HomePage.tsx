import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ImagePlus,
  Keyboard,
  LoaderCircle,
  Lock,
  Shield,
  Zap,
} from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'
import { ExampleResultCard } from '@/components/home/ExampleResultCard'
import {
  extractListing,
  toIdentifiedProduct,
} from '@/lib/api/extractListing'
import { saveDraft } from '@/lib/analysis/draftStore'
import { intelligenceTierForCategory } from '@/lib/intelligence/supportTier'
import { cn } from '@/lib/utils'

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('Could not read image'))
    reader.readAsDataURL(file)
  })
}

/** Landing page — responsive two-column desktop, single-column mobile. */
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

  const uploadCard = (
    <section
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
      className={cn(
        'flex w-full flex-col rounded-[22px] border bg-surface px-6 transition',
        pendingPreview ? 'justify-center py-6' : 'min-h-[280px] py-8',
        dragOver ? 'border-lime/35' : 'border-white/10',
      )}
    >
      {pendingPreview ? (
        <div className="flex items-center gap-4">
          <img
            src={pendingPreview}
            alt=""
            className="size-16 shrink-0 rounded-[12px] object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[16px] font-semibold text-cream">
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
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="mb-4 grid size-14 place-items-center rounded-[14px] bg-panel text-cream">
            {busy ? (
              <LoaderCircle size={26} className="animate-spin text-lime" />
            ) : (
              <ImagePlus size={26} strokeWidth={1.75} />
            )}
          </span>
          <p className="text-[20px] font-semibold tracking-[-0.02em] text-cream">
            Drop in a screenshot
          </p>
          <p className="mt-2 text-[14px] text-muted">
            Marketplace, eBay or Gumtree
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="mt-6 rounded-[12px] border border-white/15 bg-transparent px-5 py-2.5 text-[14px] font-semibold text-cream transition hover:border-white/30 hover:bg-white/[0.03] disabled:opacity-50"
          >
            Choose screenshot
          </button>
        </div>
      )}
    </section>
  )

  const intakeActions = (
    <>
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
          className="mt-3 flex w-full items-center gap-3 rounded-[14px] border border-white/10 bg-surface px-4 py-3.5 text-left transition hover:border-white/15 hover:bg-panel disabled:opacity-50"
        >
          <Keyboard size={16} className="shrink-0 text-muted" />
          <span className="flex-1 text-[14px] font-medium text-cream/80">
            Or paste listing details instead
          </span>
          <ChevronDown size={16} className="shrink-0 text-muted" />
        </button>
      ) : (
        <div className="mt-3">
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

      {error ? (
        <p className="mt-3 text-[13px] leading-5 text-[#f87171]">{error}</p>
      ) : null}

      <div className="mt-4">
        <PrimaryButton
          disabled={busy || !canSubmit}
          onClick={() => void onSubmit()}
          className="desk:min-h-[62px]"
        >
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
        <p className="mt-3 text-center text-[13px] text-muted">
          Takes about 10 seconds · No account required
        </p>
      </div>
    </>
  )

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1160px] flex-col px-5 desk:px-8">
      <Header variant="home" />

      <main className="flex flex-1 flex-col pb-14 pt-2 desk:pb-16 desk:pt-4">
        {/* Hero */}
        <section className="flex flex-1 flex-col desk:grid desk:grid-cols-[48%_52%] desk:items-center desk:gap-20">
          {/* Left: copy */}
          <div className="mb-8 max-w-[540px] desk:mb-0">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-surface px-3 py-1.5 text-[12px] font-medium text-muted">
              <span className="rounded-[4px] bg-lime/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-lime">
                AU
              </span>
              Australia’s smart way to check listings
            </p>

            <h1 className="text-[48px] leading-[0.98] font-extrabold tracking-[-0.045em] text-cream desk:text-[72px] desk:leading-[0.95]">
              Should I buy{' '}
              <span className="text-lime">this listing?</span>
            </h1>

            <p className="mt-5 max-w-[38ch] text-[17px] leading-7 text-cream/70 desk:mt-6 desk:text-[18px] desk:leading-7">
              Upload a listing and instantly see what it’s really worth, what to
              offer, and what to watch out for.
            </p>

            <ul className="mt-6 hidden gap-5 text-[13px] font-medium text-cream/65 desk:flex">
              <li className="inline-flex items-center gap-1.5">
                <Shield size={14} className="text-lime" />
                100% free
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Zap size={14} className="text-lime" />
                Instant results
              </li>
              <li className="inline-flex items-center gap-1.5">
                <Lock size={14} className="text-lime" />
                No account needed
              </li>
            </ul>

            <p className="mt-8 hidden text-[14px] leading-6 text-muted desk:block">
              Built for Aussie Marketplace, eBay and Gumtree buyers who want a
              clear answer before they message the seller.
            </p>
          </div>

          {/* Right: upload experience */}
          <div className="w-full desk:max-w-[480px] desk:justify-self-end">
            {uploadCard}
            {intakeActions}
            <ExampleResultCard layered className="mt-5" />
            <Link
              to="/flip"
              className="mt-5 block text-center text-[13px] text-muted underline-offset-4 transition hover:text-cream hover:underline"
            >
              Flip mode — what to search today
            </Link>
          </div>
        </section>

        {/* How it works — fills desktop without crowding the hero */}
        <section className="mt-14 rounded-[22px] border border-white/10 bg-surface px-5 py-8 desk:mt-10 desk:px-10 desk:py-10">
          <h2 className="text-center text-[22px] font-bold tracking-[-0.03em] text-cream desk:text-[28px]">
            How <span className="text-lime">SussIt</span> works
          </h2>
          <ol className="mt-8 grid gap-8 desk:grid-cols-3 desk:gap-6">
            {[
              {
                n: '1',
                title: 'Upload or paste',
                body: 'Add a listing screenshot or paste the details.',
              },
              {
                n: '2',
                title: 'We analyse',
                body: 'Live comps, fair price and what to watch out for.',
              },
              {
                n: '3',
                title: 'You decide',
                body: 'Get a clear offer suggestion and red flags in seconds.',
              },
            ].map((step) => (
              <li key={step.n} className="text-center desk:text-left">
                <span className="mx-auto mb-3 grid size-8 place-items-center rounded-full bg-lime text-[13px] font-bold text-ink desk:mx-0">
                  {step.n}
                </span>
                <p className="text-[16px] font-semibold text-cream">
                  {step.title}
                </p>
                <p className="mt-1.5 text-[14px] leading-6 text-muted">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6 desk:grid-cols-4 desk:gap-6">
            {[
              { value: 'Free', label: 'Always will be' },
              { value: '~10s', label: 'Average result time' },
              { value: 'AU', label: 'eBay comps first' },
              { value: 'No login', label: 'Start in one tap' },
            ].map((stat) => (
              <div key={stat.label} className="text-center desk:text-left">
                <p className="inline-flex items-center gap-1.5 text-[18px] font-bold text-cream">
                  <Check size={14} className="text-lime" />
                  {stat.value}
                </p>
                <p className="mt-1 text-[12px] text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
