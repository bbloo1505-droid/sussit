import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  className?: string
  /** Larger lockup for home / analysing */
  size?: 'sm' | 'md' | 'lg'
}

export function BrandMark({ className, size = 'md' }: BrandMarkProps) {
  return (
    <Link to="/" aria-label="SussIt" className={cn('inline-flex items-center', className)}>
      <img
        src={logo}
        alt="SussIt"
        className={cn(
          'w-auto object-contain object-left',
          size === 'sm' && 'h-6',
          size === 'md' && 'h-7',
          size === 'lg' && 'h-9',
        )}
      />
    </Link>
  )
}
