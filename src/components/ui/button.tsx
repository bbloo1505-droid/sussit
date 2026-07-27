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
        'flex w-full items-center justify-center gap-2 rounded-2xl bg-lime px-5 py-4 font-display text-[16px] font-extrabold text-ink transition hover:bg-[#d2ff36] active:scale-[.99] disabled:opacity-50',
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
        'flex w-full items-center justify-between border-b border-white/10 py-5 text-left font-display text-[16px] font-bold text-cream transition hover:text-lime disabled:opacity-40',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

/** Kept for any leftover imports */
export function Button(props: PrimaryButtonProps) {
  return <PrimaryButton {...props} />
}
