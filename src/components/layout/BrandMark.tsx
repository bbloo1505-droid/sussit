import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type BrandMarkProps = {
  className?: string
  light?: boolean
}

export function BrandMark({ className, light = false }: BrandMarkProps) {
  return (
    <Link
      to="/"
      className={cn(
        'font-display text-xl font-extrabold tracking-tight',
        light ? 'text-cream' : 'text-ink',
        className,
      )}
    >
      Suss<span className="text-lime">It</span>
    </Link>
  )
}
