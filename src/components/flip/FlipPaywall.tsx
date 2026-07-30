import { useNavigate } from 'react-router-dom'
import { Check } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { PrimaryButton } from '@/components/ui/button'
import {
  activateFlipPlanDemo,
  FLIP_PLAN_META,
  type FlipPlan,
} from '@/lib/entitlements/flipAccess'
import { cn } from '@/lib/utils'

type FlipPaywallProps = {
  onActivated?: () => void
  /** Minimum plan this screen needs — lower tiers still shown but CTAs upgrade. */
  minPlan?: Exclude<FlipPlan, 'none'>
}

const ORDER: Array<Exclude<FlipPlan, 'none'>> = ['flip', 'pro', 'assistant']

export function FlipPaywall({
  onActivated,
  minPlan = 'flip',
}: FlipPaywallProps) {
  const navigate = useNavigate()

  function unlock(plan: Exclude<FlipPlan, 'none'>) {
    activateFlipPlanDemo(plan)
    onActivated?.()
  }

  const headline =
    minPlan === 'assistant'
      ? 'Unlock Flip Assistant'
      : minPlan === 'pro'
        ? 'Unlock Flip Pro'
        : 'Find it cheap. Flip it fast.'

  return (
    <div className="flex min-h-full flex-col px-6 pt-5 pb-9">
      <Header backTo="/" detail="FLIP" />
      <main className="flex flex-1 flex-col">
        <p className="font-display text-[11px] font-bold tracking-[0.16em] text-lime">
          SUSSIT FLIP
        </p>
        <h1 className="mt-2 font-display text-[34px] leading-[0.95] font-black tracking-[-0.04em] text-cream">
          {headline}
        </h1>
        <p className="mt-4 text-[15px] leading-6 text-muted">
          Pick a plan. Stripe comes later — demo-unlock on this device for now.
        </p>

        <div className="mt-8 space-y-4">
          {ORDER.map((plan) => {
            const meta = FLIP_PLAN_META[plan]
            const popular = plan === 'pro'
            const desk = plan === 'assistant'
            const meetsMin =
              ORDER.indexOf(plan) >= ORDER.indexOf(minPlan)

            return (
              <article
                key={plan}
                className={cn(
                  'rounded-[22px] border p-5',
                  popular
                    ? 'border-lime/50 bg-lime/[0.06]'
                    : desk
                      ? 'border-white/20 bg-surface'
                      : 'border-white/10 bg-surface',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-[11px] font-bold tracking-[0.14em] text-lime">
                      {popular ? 'MOST POPULAR' : desk ? 'DESK' : 'HUNT'}
                    </p>
                    <h2 className="mt-1 font-display text-[24px] font-black text-cream">
                      {meta.name}
                    </h2>
                    <p className="mt-1 text-[13px] text-muted">{meta.tagline}</p>
                  </div>
                  <p className="font-display text-[28px] font-black text-cream">
                    {meta.priceLabel}
                    <span className="text-[13px] text-muted">/mo</span>
                  </p>
                </div>

                <ul className="mt-4 space-y-2">
                  {meta.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex gap-2 text-[13px] leading-5 text-cream"
                    >
                      <Check size={15} className="mt-0.5 shrink-0 text-lime" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <PrimaryButton
                  className="mt-5"
                  disabled={!meetsMin}
                  onClick={() => unlock(plan)}
                >
                  {meetsMin
                    ? `Activate ${meta.name} (demo)`
                    : `Need ${FLIP_PLAN_META[minPlan].name}+`}
                </PrimaryButton>
              </article>
            )
          })}
        </div>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 text-center text-[13px] text-muted underline-offset-4 hover:text-cream hover:underline"
        >
          Keep using free Should I buy this?
        </button>
      </main>
    </div>
  )
}
