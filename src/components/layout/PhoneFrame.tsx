import type { ReactNode } from 'react'

/** Mobile-first shell — no fake status-bar chrome. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent text-cream sm:grid sm:place-items-center sm:p-6">
      <div className="relative min-h-screen w-full overflow-hidden bg-ink sm:min-h-0 sm:max-w-[390px] sm:rounded-[36px] sm:border sm:border-white/10 sm:shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_55%_at_50%_-8%,rgba(198,255,0,0.08),transparent_55%)]"
        />
        <div className="relative min-h-screen overflow-y-auto sm:max-h-[844px] sm:min-h-[844px]">
          {children}
        </div>
      </div>
    </div>
  )
}
