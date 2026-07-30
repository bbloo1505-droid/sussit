import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/layout/BrandMark'
import { latestRecentCheck } from '@/lib/analysis/recentChecks'

type HeaderProps = {
  backTo?: string
  /** Small right label on inner screens. Omit on home. */
  detail?: string
  /** Home layout: brand left, Recent checks right */
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
    return (
      <header className="mb-8 flex items-center justify-between gap-3">
        <BrandMark size="md" className="min-w-0" />
        {recent ? (
          <Link
            to={`/result/${recent.id}`}
            className="shrink-0 text-[13px] font-medium text-muted transition hover:text-cream"
          >
            Recent checks
          </Link>
        ) : (
          <span className="shrink-0 text-[13px] font-medium text-muted/50">
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
          className="grid size-10 shrink-0 place-items-center rounded-[10px] bg-panel text-cream transition hover:bg-[#1e221c]"
        >
          <ArrowLeft size={19} />
        </button>
      ) : (
        <div className="w-10 shrink-0" />
      )}
      <BrandMark size="md" className="min-w-0 justify-center" />
      <span className="w-14 shrink-0 text-right font-display text-[10px] font-semibold tracking-[0.12em] text-muted">
        {detail ?? ''}
      </span>
    </header>
  )
}
