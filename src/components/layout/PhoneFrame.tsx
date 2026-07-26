import type { ReactNode } from 'react'

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-cream text-cream sm:grid sm:place-items-center sm:p-6">
      <div className="relative min-h-screen w-full overflow-hidden bg-ink sm:min-h-0 sm:max-w-[390px] sm:rounded-[42px] sm:shadow-2xl">
        <div className="absolute right-7 top-3 z-10 flex items-center gap-1 text-[10px] font-semibold text-cream/80">
          <span className="mr-1">9:41</span>
          <span className="h-2 w-3 rounded-sm border border-white/50">
            <span className="block h-full w-2/3 rounded-sm bg-lime" />
          </span>
        </div>
        <div className="min-h-screen overflow-y-auto pt-6 sm:max-h-[844px] sm:min-h-[844px]">
          {children}
        </div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/20" />
      </div>
    </div>
  )
}
