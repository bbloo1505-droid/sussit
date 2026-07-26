import { cn } from '@/lib/utils'

/** Interlocking SS monogram — matches brand board app icon */
export function SussIcon({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect width="64" height="64" rx="14" fill="#111111" />
      {/* Top S — lime */}
      <path
        d="M38 10c-7.2 0-12.4 3.6-14.2 9.2C22 13.6 16.8 10 9.6 10v11.2c4.6 0 7.4 1.9 8.4 5.4h14.2c1-3.5 3.8-5.4 8.4-5.4V10z"
        fill="#C6FF00"
      />
      {/* Bottom S — white */}
      <path
        d="M26 54c7.2 0 12.4-3.6 14.2-9.2C42 50.4 47.2 54 54.4 54V42.8c-4.6 0-7.4-1.9-8.4-5.4H31.8c-1 3.5-3.8 5.4-8.4 5.4V54z"
        fill="#FFFFFF"
      />
      {/* Link bridge */}
      <path
        d="M24.5 28h15c.6 1.4 1.7 2.4 3.2 2.9v2.2c-1.5.5-2.6 1.5-3.2 2.9h-15c-.6-1.4-1.7-2.4-3.2-2.9v-2.2c1.5-.5 2.6-1.5 3.2-2.9z"
        fill="#111111"
      />
    </svg>
  )
}
