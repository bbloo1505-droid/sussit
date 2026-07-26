import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-xl text-base font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
  {
    variants: {
      variant: {
        primary: 'bg-lime text-ink hover:bg-[#b8ef00]',
        secondary: 'bg-surface text-cream hover:bg-surface-2',
        ghost: 'bg-transparent text-ink hover:bg-black/5',
        outline: 'border border-ink/15 bg-transparent text-ink hover:bg-black/[0.03]',
      },
      size: {
        default: 'h-12 px-5',
        lg: 'h-14 px-6 text-lg',
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
