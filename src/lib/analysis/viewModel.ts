import type { AnalysisResult } from '@/types/domain'
import { formatAud } from '@/lib/utils'
import { limitedMarketCopy } from '@/lib/intelligence/supportTier'

export function buildOfferMessage(analysis: AnalysisResult): string {
  const offer = analysis.offer?.openingOffer
  if (offer == null) {
    return 'Not enough data for a suggested offer yet.'
  }
  return `Hey mate, definitely interested. Would you take ${formatAud(offer)} if I can pick it up today?`
}

export function buildExplanation(analysis: AnalysisResult): string {
  if (analysis.deal.verdictLabel === 'LIMITED MARKET DATA') {
    return limitedMarketCopy(analysis.product.category)
  }

  if (analysis.deal.verdictLabel === 'INSUFFICIENT DATA' || !analysis.market) {
    const reason =
      analysis.confidence.reasons[0] ??
      "We don't have enough evidence to recommend buying or passing."
    return `${reason} Ask the seller the details below — then suss it again with a clearer listing.`
  }

  const pct = Math.abs(analysis.deal.differenceFromMedianPercent)
  const side =
    analysis.deal.differenceFromMedianPercent <= 0 ? 'below' : 'above'

  return `At ${formatAud(analysis.product.askingPrice)}, this sits about ${pct}% ${side} the current comparable asking median of ${formatAud(analysis.market.median)}.`
}

/** Deterministic relist copy when Flip numbers exist — no LLM. */
export function buildRelistCopy(analysis: AnalysisResult): {
  title: string
  price: number
  body: string
  quickSalePrice: number | null
  maxProfitPrice: number | null
} {
  const flip = analysis.flip
  const sweet = flip?.pricingSweetSpot
  const listPrice =
    sweet != null
      ? Math.round((sweet.low + sweet.high) / 2 / 5) * 5
      : flip?.resaleLow != null && flip?.resaleHigh != null
        ? Math.round((flip.resaleLow + flip.resaleHigh) / 2 / 5) * 5
        : analysis.market?.median ?? analysis.product.askingPrice

  const title = [
    analysis.product.brand,
    analysis.product.model,
    analysis.product.variant,
  ]
    .filter(Boolean)
    .join(' ')

  const body = [
    `${title} for sale.`,
    ``,
    `Pick up preferred. Happy to meet locally.`,
    `Price is firm at ${formatAud(listPrice)} — priced to move.`,
  ].join('\n')

  return {
    title,
    price: listPrice,
    body,
    quickSalePrice:
      flip?.resaleLow != null ? Math.round(flip.resaleLow / 5) * 5 : null,
    maxProfitPrice:
      flip?.resaleHigh != null ? Math.round(flip.resaleHigh / 5) * 5 : null,
  }
}

export function includedComps(analysis: AnalysisResult) {
  return analysis.assessments
    .filter((a) => a.included)
    .map((a) => ({
      title: a.comparable.title,
      price: a.comparable.price,
      source:
        a.comparable.source === 'ebay'
          ? 'Current eBay Australia listing'
          : 'Offline fixture comps (not live eBay)',
      matchLabel: a.matchLabel,
    }))
}

export function excludedComps(analysis: AnalysisResult) {
  return analysis.assessments
    .filter((a) => !a.included)
    .map((a) => ({
      title: a.comparable.title,
      price: a.comparable.price,
      source: a.rejectionReason ?? 'Excluded',
      matchLabel: a.matchLabel,
    }))
}

export type CheckRisk = { title: string; description: string }

/** Category-aware inspection checklist — never VR-only copy for other items. */
export function risksForCategory(
  category: AnalysisResult['product']['category'],
): CheckRisk[] {
  switch (category) {
    case 'vr_headset':
      return [
        {
          title: 'Inspect the lenses',
          description: 'Look for scratches, haze or sun damage before payment.',
        },
        {
          title: 'Test both controllers',
          description: 'Check tracking, buttons, triggers and battery contacts.',
        },
        {
          title: 'Check the headset charge',
          description: 'Make sure it powers on, charges and holds connection.',
        },
        {
          title: 'Confirm the serial number',
          description: 'Match the headset and box, and ask about proof of purchase.',
        },
      ]
    case 'phone':
    case 'tablet':
      return [
        {
          title: 'Check IMEI / activation lock',
          description: 'Confirm it is not blacklisted and Find My / FRP is off.',
        },
        {
          title: 'Test screen and battery',
          description: 'Look for burn-in, dead pixels, and battery health %.',
        },
        {
          title: 'Verify storage and network',
          description: 'Confirm capacity matches the listing and SIM / eSIM works.',
        },
        {
          title: 'Inspect ports and face ID',
          description: 'Charge port, speakers, cameras, biometrics.',
        },
      ]
    case 'console':
      return [
        {
          title: 'Power on and read discs / games',
          description: 'Boot to the home screen and test storage if claimed.',
        },
        {
          title: 'Test controllers',
          description: 'Check drift, buttons, charging and pairing.',
        },
        {
          title: 'Inspect HDMI and ports',
          description: 'Confirm clean video output and no bent pins.',
        },
        {
          title: 'Ask about account / bans',
          description: 'Ensure the console is not console-banned or locked.',
        },
      ]
    case 'laptop':
      return [
        {
          title: 'Boot and check battery cycles',
          description: 'Confirm it powers on, battery holds, and keyboard works.',
        },
        {
          title: 'Inspect screen and hinge',
          description: 'Look for backlight bleed, dead pixels, and loose hinges.',
        },
        {
          title: 'Verify specs',
          description: 'Match CPU, RAM and storage to the listing.',
        },
        {
          title: 'Check ports and charger',
          description: 'Test USB-C / MagSafe and included power brick if claimed.',
        },
      ]
    case 'camera':
      return [
        {
          title: 'Check shutter count',
          description: 'Ask for shutter actuations and compare to asking price.',
        },
        {
          title: 'Inspect sensor and mount',
          description: 'Look for dust, scratches, and bent mount pins.',
        },
        {
          title: 'Test AF and cards',
          description: 'Confirm autofocus, IBIS, and card slots work.',
        },
        {
          title: 'Battery and charger',
          description: 'Confirm genuine batteries and included charger if listed.',
        },
      ]
    case 'power_tool':
      return [
        {
          title: 'Test under load',
          description: 'Run the tool briefly and listen for grinding or weak torque.',
        },
        {
          title: 'Check batteries',
          description: 'Confirm voltage, charge level, and that packs are genuine.',
        },
        {
          title: 'Inspect chuck / bits',
          description: 'Look for wear, rust, and missing accessories claimed.',
        },
        {
          title: 'Safety cut-outs',
          description: 'Confirm switches and safety features engage cleanly.',
        },
      ]
    case 'furniture':
      return [
        {
          title: 'Inspect for damage',
          description: 'Check stains, scratches, loose joints and missing hardware.',
        },
        {
          title: 'Measure before you go',
          description: 'Confirm dimensions fit your space and doorway.',
        },
        {
          title: 'Assemble / disassemble',
          description: 'Ask if it comes apart for transport and if tools are needed.',
        },
        {
          title: 'Smoke / pet odours',
          description: 'Smell fabric and cushions before paying.',
        },
      ]
    case 'vehicle':
      return [
        {
          title: 'PPSR and paperwork',
          description: 'Check finance, written-off status, and matching VIN.',
        },
        {
          title: 'Service history',
          description: 'Ask for receipts and confirm odometer looks plausible.',
        },
        {
          title: 'Test drive',
          description: 'Listen for noises, check gears, brakes and warning lights.',
        },
        {
          title: 'Independent inspection',
          description: 'Budget for a pre-purchase inspection on higher-value cars.',
        },
      ]
    default:
      return [
        {
          title: 'Confirm it matches the listing',
          description: 'Brand, model, size/variant and included extras.',
        },
        {
          title: 'Test before you pay',
          description: 'Power it on or try it on — photos hide a lot.',
        },
        {
          title: 'Check for faults',
          description: 'Look for damage, missing parts, and wear beyond the photos.',
        },
        {
          title: 'Meet safely',
          description: 'Public place, daylight, and don’t transfer money sight-unseen.',
        },
      ]
  }
}

/** @deprecated Prefer risksForCategory — kept for older imports. */
export const demoRisks = risksForCategory('vr_headset')

export function categoryGlyph(
  category: AnalysisResult['product']['category'],
): string {
  switch (category) {
    case 'vr_headset':
      return 'VR'
    case 'phone':
      return 'PH'
    case 'console':
      return 'GM'
    case 'camera':
      return 'CAM'
    case 'laptop':
      return 'PC'
    case 'tablet':
      return 'TAB'
    case 'wearable':
      return 'WT'
    case 'audio':
      return 'AU'
    case 'gpu':
      return 'GPU'
    case 'power_tool':
      return 'TL'
    case 'furniture':
      return 'FU'
    case 'clothing':
      return 'CL'
    case 'vehicle':
      return 'VE'
    case 'jewellery':
      return 'JW'
    case 'collectible':
      return 'CO'
    default:
      return 'IT'
  }
}

export function analysingSteps(
  _tier?: 'full' | 'emerging' | 'basic',
): readonly string[] {
  return [
    'Finding current eBay Australia listings',
    'Checking listing quality',
    'Calculating a fair offer',
    'Assessing this listing',
  ] as const
}
