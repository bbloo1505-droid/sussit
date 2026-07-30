import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type PrimaryButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function PrimaryButton({
  children,
  className,
  type = 'button',
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'flex w-full items-center justify-center gap-2 rounded-2xl bg-lime px-5 text-[16px] font-bold tracking-[-0.015em] text-ink transition',
        'hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime',
        'active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:brightness-100',
        'min-h-[58px]',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function TextButton({
  children,
  className,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        'flex w-full items-center justify-between border-b border-white/10 py-5 text-left text-[16px] font-semibold text-cream transition hover:text-lime disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Button(props: PrimaryButtonProps) {
  return <PrimaryButton {...props} />
}
