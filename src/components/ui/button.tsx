import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
  {
    variants: {
      variant: {
        primary: 'bg-lime text-ink hover:bg-[#b8ef00]',
        secondary:
          'border border-white/15 bg-surface text-white hover:bg-[#222]',
        tertiary: 'bg-cream text-ink hover:bg-white',
        ghost: 'bg-transparent text-white hover:bg-white/5',
        outline:
          'border border-white/20 bg-transparent text-white hover:bg-white/5',
      },
      size: {
        default: 'h-12 px-5',
        lg: 'h-14 px-6 text-[17px]',
        sm: 'h-10 px-4 text-sm',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
}
