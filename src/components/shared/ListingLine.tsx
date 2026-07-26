import { formatAud } from '@/lib/utils'

type ListingLineProps = {
  productName: string
  askingPrice: number
}

export function ListingLine({ productName, askingPrice }: ListingLineProps) {
  return (
    <div className="flex items-center gap-2 text-[13px] text-muted">
      <span className="text-lg">🥽</span>
      <span>
        {productName} ·{' '}
        <strong className="font-semibold text-cream">
          {formatAud(askingPrice)}
        </strong>
      </span>
    </div>
  )
}
