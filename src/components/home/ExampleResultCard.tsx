import { ChevronRight, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

type ExampleResultCardProps = {
  className?: string
}

/** Compact product-proof card for the landing page. */
export function ExampleResultCard({ className }: ExampleResultCardProps) {
  return (
    <aside
      className={cn(
        'rounded-[18px] border border-white/10 bg-surface p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className="grid size-12 shrink-0 place-items-center rounded-[10px] bg-panel text-[11px] font-bold tracking-wide text-muted"
          aria-hidden
        >
          PS5
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[15px] font-semibold tracking-[-0.02em] text-cream">
              PS5 Slim Disc Edition
            </p>
            <span className="shrink-0 rounded-md border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[11px] font-semibold text-red-300">
              Overpriced
            </span>
          </div>
          <p className="mt-1.5 text-[13px]">
            <span className="text-muted">Fair price: </span>
            <span className="font-semibold text-lime">$520–$590</span>
            <span className="mx-2 text-white/20">·</span>
            <span className="text-muted">Asking: </span>
            <span className="font-medium text-cream">$650</span>
          </p>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-[13px] font-medium text-cream">
        <Tag size={14} className="text-lime" />
        <span className="flex-1">Try offering around $560</span>
        <ChevronRight size={15} className="text-muted" />
      </div>
    </aside>
  )
}
