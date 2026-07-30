import type { ReactNode } from 'react'

/** Full-bleed page shell — no artificial phone card. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-ink text-cream">{children}</div>
}

/** Narrow column for in-app flows after the landing page. */
export function AppColumn({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-[440px]">{children}</div>
  )
}
