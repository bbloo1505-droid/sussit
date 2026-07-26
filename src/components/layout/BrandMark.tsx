import { Link } from 'react-router-dom'
import brandBoard from '@/assets/brand-board.png'
import { ImageWithFallback } from '@/components/figma/ImageWithFallback'

export function BrandMark() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label="SussIt">
      <span className="relative block h-7 w-7 overflow-hidden rounded-[8px] bg-ink">
        <ImageWithFallback
          src={brandBoard}
          alt=""
          className="absolute top-[-11px] left-[-125px] w-[169px] max-w-none"
        />
      </span>
      <span className="font-display text-[23px] leading-none font-black tracking-[-0.055em] text-cream">
        Suss<span className="text-lime">It</span>
      </span>
    </Link>
  )
}
