import { formatAud } from '@/lib/utils'

type ListingLineProps = {
  productName: string
  askingPrice: number
}

export function ListingLine({ productName, askingPrice }: ListingLineProps) {
  return (
    <p className="text-[13px] leading-5 text-muted">
      {productName} ·{' '}
      <strong className="font-semibold text-cream">
        {formatAud(askingPrice)}
      </strong>
    </p>
  )
}
