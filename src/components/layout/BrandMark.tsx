import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { SussMark } from '@/components/brand/SussMark'

type BrandMarkProps = {
  className?: string
  showTagline?: boolean
  showIcon?: boolean
}

export function BrandMark({
  className,
  showTagline = false,
  showIcon = false,
}: BrandMarkProps) {
  return (
    <Link to="/" className={cn('inline-flex flex-col gap-1', className)}>
      <span className="inline-flex items-center gap-2">
        {showIcon ? <SussMark size={28} /> : null}
        <span className="font-display text-[1.65rem] font-extrabold tracking-tight text-white">
          Suss<span className="text-lime">It</span>
        </span>
      </span>
      {showTagline ? (
        <span className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">
          Know before <span className="text-lime">you buy.</span>
        </span>
      ) : null}
    </Link>
  )
}
