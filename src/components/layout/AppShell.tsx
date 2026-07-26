import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type AppShellProps = {
  children: ReactNode
  className?: string
  dark?: boolean
}

export function AppShell({ children, className, dark = false }: AppShellProps) {
  return (
    <div
      className={cn(
        'min-h-dvh',
        dark ? 'bg-surface text-cream' : 'bg-cream text-ink',
      )}
    >
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
