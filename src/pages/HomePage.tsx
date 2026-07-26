import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, ImagePlus } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'

export function HomePage() {
  const navigate = useNavigate()
  const [text, setText] = useState('')

  function goConfirm() {
    navigate('/confirm')
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-5 pb-9">
      <Header />
      <main className="flex flex-1 flex-col">
        <div className="mb-10">
          <h1 className="font-display text-[48px] leading-[0.96] font-black tracking-[-0.045em] text-cream">
            Should I
            <br />
            buy this?
          </h1>
          <p className="mt-4 text-[16px] leading-6 text-muted">
            Send a listing through. We&apos;ll suss the value.
          </p>
        </div>

        <button
          type="button"
          onClick={goConfirm}
          className="mb-3 rounded-[22px] border border-dashed border-lime/30 bg-lime/[0.025] px-5 py-10 text-center transition hover:bg-lime/[0.06]"
        >
          <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-lime/10 text-lime">
            <ImagePlus size={27} />
          </span>
          <span className="block text-[15px] font-semibold text-cream">
            Upload screenshot
          </span>
          <span className="mt-1 block text-[13px] text-muted">
            Tap to add it from your camera roll
          </span>
        </button>

        <div className="my-1 flex items-center gap-3 text-[12px] text-muted">
          <span className="h-px flex-1 bg-white/10" />
          or
          <span className="h-px flex-1 bg-white/10" />
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mb-7 min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-surface p-4 text-[15px] leading-6 text-cream outline-none placeholder:text-muted focus:border-lime/50"
          placeholder="Paste listing text here…"
        />

        <PrimaryButton onClick={goConfirm}>
          Suss it out <ArrowRight size={18} />
        </PrimaryButton>
      </main>
      <p className="mt-5 text-center text-[12px] leading-5 text-muted">
        Works with listing screenshots and pasted listing details.
      </p>
    </div>
  )
}
