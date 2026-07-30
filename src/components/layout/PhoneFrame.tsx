import type { ReactNode } from 'react'

/** Full-bleed mobile shell — no outer card chrome. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-cream">
      <div className="relative mx-auto min-h-screen w-full max-w-[440px]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_40%_at_50%_-5%,rgba(196,255,0,0.06),transparent_55%)]"
        />
        <div className="relative min-h-screen overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
