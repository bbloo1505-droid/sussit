import { Link } from 'react-router-dom'
import sussIcon from '@/assets/suss-icon.png'
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
      className={cn('inline-flex items-center gap-2.5', className)}
    >
      {showIcon ? (
        <img
          src={sussIcon}
          alt=""
          width={s.icon}
          height={s.icon}
          className="shrink-0 rounded-[7px]"
        />
      ) : null}
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
