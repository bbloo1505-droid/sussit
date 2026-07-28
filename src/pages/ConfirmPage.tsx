import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'
import { formatAud } from '@/lib/utils'
import { loadDraft, loadDraftMeta, saveDraft } from '@/lib/analysis/draftStore'
import { runAndSaveAnalysis } from '@/lib/analysis/ensureDemoAnalysis'
import { questDemoProduct } from '@/lib/analysis/questDemoProduct'
import { conditionLabel, productLabel } from '@/lib/api/extractListing'
import { categoryLabel } from '@/lib/intelligence/supportTier'
import type { IdentifiedProduct } from '@/types/domain'

export function ConfirmPage() {
  const navigate = useNavigate()
  const initial = loadDraft() ?? questDemoProduct
  const meta = loadDraftMeta()
  const [product, setProduct] = useState<IdentifiedProduct>(initial)
  const [fixing, setFixing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [draftBrand, setDraftBrand] = useState(initial.brand)
  const [draftModel, setDraftModel] = useState(initial.model)
  const [draftVariant, setDraftVariant] = useState(initial.variant ?? '')
  const [draftPrice, setDraftPrice] = useState(String(initial.askingPrice))

  const name = useMemo(() => productLabel(product), [product])

  const fields = [
    ['CONDITION', conditionLabel(product.condition)],
    [
      'INCLUDED',
      product.includedAccessories.length
        ? product.includedAccessories.slice(0, 2).join(', ')
        : '—',
    ],
    ['LOCATION', product.location ?? '—'],
    ['CATEGORY', categoryLabel(product.category)],
  ] as const

  function applyFix() {
    const price = Number(draftPrice)
    if (!draftBrand.trim() || !draftModel.trim() || !Number.isFinite(price)) return

    const next: IdentifiedProduct = {
      ...product,
      brand: draftBrand.trim(),
      model: draftModel.trim(),
      variant: draftVariant.trim() || null,
      askingPrice: price,
    }
    setProduct(next)
    saveDraft(next, meta ?? { usedFallback: true, source: 'demo' })
    setFixing(false)
  }

  async function startAnalysis() {
    setBusy(true)
    try {
      saveDraft(product, meta ?? { usedFallback: true, source: 'demo' })
      const analysis = await runAndSaveAnalysis({ product })
      navigate(`/analysing?id=${analysis.id}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="px-6 pt-5 pb-9">
      <Header backTo="/" detail="LISTING" />
      <h1 className="font-display text-[32px] leading-none font-black tracking-[-0.035em] text-cream">
        Confirm listing
      </h1>
      <p className="mt-2 text-[15px] text-muted">Is this the right product?</p>

      {meta?.extractMode === 'heuristic' ? (
        <p className="mt-3 text-[12px] leading-5 text-muted">
          Parsed from your paste — double-check brand, model, and price.
        </p>
      ) : null}

      {fixing ? (
        <form
          className="mt-7 space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            applyFix()
          }}
        >
          <Field label="Brand" value={draftBrand} onChange={setDraftBrand} />
          <Field label="Model" value={draftModel} onChange={setDraftModel} />
          <Field
            label="Variant"
            value={draftVariant}
            onChange={setDraftVariant}
            placeholder="512GB"
          />
          <Field label="Asking price" value={draftPrice} onChange={setDraftPrice} />
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setFixing(false)}
              className="flex-1 rounded-2xl border border-white/15 py-3.5 font-display text-[15px] font-bold text-cream"
            >
              Cancel
            </button>
            <PrimaryButton type="submit" className="flex-1">
              Save
            </PrimaryButton>
          </div>
        </form>
      ) : (
        <>
          <section className="mt-7 overflow-hidden rounded-[22px] border border-white/10 bg-surface">
            <div className="relative border-b border-white/10 px-5 py-7">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_120%_at_100%_0%,rgba(198,255,0,0.12),transparent_60%)]"
              />
              <p className="relative font-display text-[10px] font-bold tracking-[0.14em] text-lime">
                {categoryLabel(product.category).toUpperCase()}
              </p>
              <div className="relative mt-3 flex items-start justify-between gap-4">
                <h2 className="font-display text-[24px] leading-[1.05] font-black tracking-[-0.03em] text-cream">
                  {name}
                </h2>
                <strong className="shrink-0 font-display text-[28px] font-black tracking-[-0.04em] text-cream">
                  {formatAud(product.askingPrice)}
                </strong>
              </div>
              <span className="relative mt-3 inline-block rounded-full bg-panel px-2.5 py-1 font-display text-[10px] font-bold tracking-[0.12em] text-muted">
                {conditionLabel(product.condition).toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/5 p-px">
              {fields.map(([label, value]) => (
                <div key={label} className="bg-surface px-4 py-3.5">
                  <p className="font-display text-[9px] font-bold tracking-[0.11em] text-muted">
                    {label}
                  </p>
                  <p className="mt-1 text-[14px] font-semibold text-cream">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-4 space-y-2">
            <PrimaryButton onClick={startAnalysis} disabled={busy}>
              {busy ? 'Preparing…' : 'Looks right'} <ArrowRight size={18} />
            </PrimaryButton>
            <button
              type="button"
              onClick={() => setFixing(true)}
              className="w-full rounded-2xl border border-white/15 py-3.5 font-display text-[15px] font-bold text-cream"
            >
              Fix product details
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-[12px] text-muted">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-2xl border border-white/10 bg-surface px-4 py-3 text-cream outline-none focus:border-lime/50"
      />
    </label>
  )
}
