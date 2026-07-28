import { useNavigate } from 'react-router-dom'
import { Zap } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'
import { activateFlipSubscriptionDemo } from '@/lib/entitlements/flipAccess'

type FlipPaywallProps = {
  onActivated?: () => void
}

export function FlipPaywall({ onActivated }: FlipPaywallProps) {
  const navigate = useNavigate()

  function unlock() {
    activateFlipSubscriptionDemo()
    onActivated?.()
  }

  return (
    <div className="flex min-h-full flex-col px-6 pt-5 pb-9">
      <Header backTo="/" detail="FLIP" />
      <main className="flex flex-1 flex-col">
        <p className="font-display text-[11px] font-bold tracking-[0.16em] text-lime">
          SUSSIT FLIP
        </p>
        <h1 className="mt-2 font-display text-[36px] leading-[0.95] font-black tracking-[-0.04em] text-cream">
          Find it cheap.
          <br />
          Flip it fast.
        </h1>
        <p className="mt-4 text-[15px] leading-6 text-muted">
          Subscription unlocks the hunt catalogue, Max Buy, sell speed, and
          capital-velocity ranking — built for resellers.
        </p>

        <ul className="mt-8 space-y-3 text-[14px] leading-6 text-cream">
          <li className="flex gap-3">
            <Zap size={16} className="mt-1 shrink-0 text-lime" />
            Today&apos;s Top Flips with Max Buy
          </li>
          <li className="flex gap-3">
            <Zap size={16} className="mt-1 shrink-0 text-lime" />
            Hunt list: what to search and what not to overpay
          </li>
          <li className="flex gap-3">
            <Zap size={16} className="mt-1 shrink-0 text-lime" />
            Listing Flip read: BUY / NEGOTIATE / PASS + sell speed
          </li>
        </ul>

        <div className="mt-10 rounded-[22px] border border-lime/35 bg-surface p-5">
          <p className="font-display text-[11px] font-bold tracking-[0.14em] text-muted">
            PLANNED
          </p>
          <p className="mt-2 font-display text-[28px] font-black text-cream">
            $49–99<span className="text-[16px] text-muted"> / mo</span>
          </p>
          <p className="mt-2 text-[13px] leading-5 text-muted">
            Stripe billing comes later. For now, demo-unlock Flip on this
            device.
          </p>
        </div>

        <PrimaryButton className="mt-6" onClick={unlock}>
          Activate Flip (demo)
        </PrimaryButton>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 text-center text-[13px] text-muted underline-offset-4 hover:text-cream hover:underline"
        >
          Keep using free Should I buy this?
        </button>
      </main>
    </div>
  )
}
