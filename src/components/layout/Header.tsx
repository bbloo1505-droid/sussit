import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/layout/BrandMark'

type HeaderProps = {
  backTo?: string
  detail?: string
}

export function Header({ backTo, detail = 'KNOW\nBEFORE' }: HeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="mb-8 flex items-center justify-between gap-3">
      {backTo ? (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(backTo)}
          className="grid size-10 shrink-0 place-items-center rounded-xl bg-panel text-cream transition hover:bg-[#2b2b2b]"
        >
          <ArrowLeft size={19} />
        </button>
      ) : (
        <div className="w-10 shrink-0" />
      )}
      <BrandMark size="md" className="min-w-0 justify-center" />
      <span className="w-10 shrink-0 text-right font-display text-[9px] leading-[1.25] font-bold tracking-[0.14em] whitespace-pre-line text-muted">
        {detail}
      </span>
    </header>
  )
}
