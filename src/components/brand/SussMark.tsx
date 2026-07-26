import { cn } from '@/lib/utils'

/** Interlocking SS mark from brand sheet */
export function SussMark({ className, size = 40 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn(className)}
      aria-hidden
    >
      <path
        d="M20 14c8 0 14 4 16 10 2-6 8-10 16-10v12c-5 0-8 2-9 6h-14c-1-4-4-6-9-6V14z"
        fill="#C6FF00"
      />
      <path
        d="M44 50c-8 0-14-4-16-10-2 6-8 10-16 10V38c5 0 8-2 9-6h14c1 4 4 6 9 6v12z"
        fill="#FFFFFF"
      />
      <path
        d="M27 28h10c.5 1.5 1.5 2.5 3 3v2c-1.5.5-2.5 1.5-3 3H27c-.5-1.5-1.5-2.5-3-3v-2c1.5-.5 2.5-1.5 3-3z"
        fill="#111111"
      />
    </svg>
  )
}
