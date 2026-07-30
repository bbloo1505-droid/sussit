import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Clock3 } from 'lucide-react'
import { BrandMark } from '@/components/layout/BrandMark'
import { latestRecentCheck } from '@/lib/analysis/recentChecks'
import { cn } from '@/lib/utils'

type HeaderProps = {
  backTo?: string
  detail?: string
  variant?: 'default' | 'home'
}

export function Header({
  backTo,
  detail,
  variant = 'default',
}: HeaderProps) {
  const navigate = useNavigate()

  if (variant === 'home') {
    const recent = latestRecentCheck()
    const recentClass =
      'inline-flex shrink-0 items-center gap-1.5 text-[14px] font-medium text-muted transition hover:text-cream'

    return (
      <header className="flex h-14 items-center justify-between gap-4 desk:h-16">
        <BrandMark size="md" className="min-w-0" />
        {recent ? (
          <Link to={`/result/${recent.id}`} className={recentClass}>
            <Clock3 size={15} className="opacity-70" />
            Recent checks
            <ChevronRight size={15} className="opacity-50" />
          </Link>
        ) : (
          <span className={recentClass}>
            <Clock3 size={15} className="opacity-70" />
            Recent checks
          </span>
        )}
      </header>
    )
  }

  return (
    <header className="mb-8 flex items-center justify-between gap-3">
      {backTo ? (
        <button
          type="button"
          aria-label="Go back"
          onClick={() => navigate(backTo)}
          className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-panel text-cream transition hover:bg-panel"
        >
          <ArrowLeft size={19} />
        </button>
      ) : (
        <div className="w-10 shrink-0" />
      )}
      <BrandMark size="md" className="min-w-0 justify-center" />
      <span
        className={cn(
          'w-14 shrink-0 text-right text-[10px] font-semibold tracking-[0.12em] text-muted',
        )}
      >
        {detail ?? ''}
      </span>
    </header>
  )
}
