import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AppShellProps = {
  children: ReactNode
  className?: string
}

export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-ink text-white">
      <div
        className={cn(
          'mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-6',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}
