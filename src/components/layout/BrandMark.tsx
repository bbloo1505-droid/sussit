import { Link } from 'react-router-dom'
import { SussIcon } from '@/components/brand/SussIcon'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

const sizes = {
  sm: { icon: 22, text: 'text-[18px]' },
  md: { icon: 28, text: 'text-[23px]' },
  lg: { icon: 32, text: 'text-[28px]' },
} as const

/**
 * In-app wordmark for dark UI:
 * cream "Suss" + lime "It" (not the charcoal poster PNG — that has no contrast on #111).
 */
export function BrandMark({
  className,
  size = 'md',
  showIcon = true,
}: BrandMarkProps) {
  const s = sizes[size]

  return (
    <Link
      to="/"
      aria-label="SussIt"
      className={cn('inline-flex items-center gap-2', className)}
    >
      {showIcon ? <SussIcon size={s.icon} /> : null}
      <span
        className={cn(
          'font-display leading-none font-black tracking-[-0.055em] text-cream',
          s.text,
        )}
      >
        Suss<span className="text-lime">It</span>
      </span>
    </Link>
  )
}
