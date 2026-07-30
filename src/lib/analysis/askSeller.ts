import type { AnalysisResult, IdentifiedProduct, ProductCategory } from '@/types/domain'

export type AskSellerPrompt = {
  /** Short label shown in UI */
  label: string
  /** Ready-to-send question for the seller */
  question: string
  /** Why this matters for the price read */
  why: string
}

/**
 * Deterministic prompts for gaps that hurt matching / confidence.
 * Prefer concrete seller questions over vague "need more info".
 */
export function buildAskSellerPrompts(
  product: IdentifiedProduct,
): AskSellerPrompt[] {
  const out: AskSellerPrompt[] = []
  const seen = new Set<string>()

  function add(prompt: AskSellerPrompt) {
    if (seen.has(prompt.label)) return
    seen.add(prompt.label)
    out.push(prompt)
  }

  const variant = product.variant?.trim() || null
  const condition = product.condition
  const missing = new Set(
    product.missingInformation.map((m) => m.toLowerCase()),
  )

  // --- Storage / capacity (biggest price swing for electronics) ---
  if (needsStorage(product.category) && !hasStorageHint(variant)) {
    add({
      label: 'Storage',
      question: storageQuestion(product),
      why: 'Storage changes the market price a lot on this category.',
    })
  }

  // --- Condition ---
  if (!condition || condition === 'unknown' || missing.has('condition')) {
    add({
      label: 'Condition',
      question:
        'How would you describe the condition — like new, good, or fair? Any scratches, dents, or faults?',
      why: 'Condition separates a fair buy from a walk-away.',
    })
  }

  // --- Category-specific ---
  switch (product.category) {
    case 'phone':
    case 'tablet':
      if (!hasBatteryHint(product)) {
        add({
          label: 'Battery health',
          question:
            'What is the battery health percentage, and is it original?',
          why: 'Battery wear is one of the biggest value hits on used phones/tablets.',
        })
      }
      add({
        label: 'Lock status',
        question:
          'Is Find My / activation lock off, and is the IMEI clean (not blacklisted)?',
        why: 'A locked or blacklisted device is hard to resell and risky to buy.',
      })
      break

    case 'vr_headset':
      if (!hasControllers(product)) {
        add({
          label: 'Controllers',
          question: 'Does it include both controllers, and do they track properly?',
          why: 'Headset-only listings price very differently from full kits.',
        })
      }
      add({
        label: 'Lenses',
        question: 'Any scratches, haze, or sun damage on the lenses?',
        why: 'Lens damage is expensive and often hidden in photos.',
      })
      break

    case 'console':
      if (isPs5Family(product) && !hasEditionHint(variant, product.model)) {
        add({
          label: 'Disc or Digital',
          question: 'Is this the Disc or Digital edition? Slim, Pro, or original?',
          why: 'PS5 editions trade at meaningfully different prices.',
        })
      }
      if (isSwitchFamily(product) && !/oled|lite/i.test(product.model)) {
        add({
          label: 'Model',
          question: 'Is it the original Switch, OLED, or Lite?',
          why: 'Switch variants are priced separately.',
        })
      }
      add({
        label: 'Controller',
        question: 'Does it include a working controller (and dock, if Switch OLED)?',
        why: 'Missing controllers drag the fair price down.',
      })
      break

    case 'laptop':
      if (!hasRamOrStorageHint(variant)) {
        add({
          label: 'Specs',
          question: 'What are the RAM and storage (e.g. 8GB / 256GB), and which chip (M1/M2/i5 etc)?',
          why: 'Laptop comps only make sense when specs match.',
        })
      }
      add({
        label: 'Battery / screen',
        question: 'How is battery life, and is the screen free of burn-in or cracks?',
        why: 'Battery and display faults change what you should pay.',
      })
      break

    case 'camera':
      add({
        label: 'Shutter count',
        question: 'What is the shutter count, and is it body-only or a kit with lens?',
        why: 'Shutter count and kit vs body swing camera prices hard.',
      })
      break

    case 'audio':
      add({
        label: 'Completeness',
        question: 'Is it a full set (both buds + case), and any battery or sound issues?',
        why: 'Single buds and weak batteries trade far below full sets.',
      })
      break

    case 'gpu':
      add({
        label: 'Card model',
        question:
          'Confirm the exact model (e.g. 4070 vs 4070 Ti / SUPER) and that it is a bare GPU, not in a PC or laptop.',
        why: 'Sibling SKUs and prebuilts distort comps.',
      })
      break

    case 'power_tool':
      add({
        label: 'Batteries',
        question: 'How many batteries and is a charger included? What voltage?',
        why: 'Bare tool vs kit pricing is very different.',
      })
      break

    case 'wearable':
      if (!variant) {
        add({
          label: 'Size / GPS',
          question: 'What size is it (e.g. 41/45mm), and is it GPS or Cellular?',
          why: 'Watch size and GPS vs Cellular change the comps.',
        })
      }
      break

    case 'clothing':
      add({
        label: 'Size',
        question: 'What size is it, and any wear, stains, or box included?',
        why: 'Size and condition drive clothing and sneaker prices.',
      })
      break

    case 'furniture':
      add({
        label: 'Dimensions',
        question: 'What are the dimensions, and any stains, pet damage, or missing parts?',
        why: 'Size and damage matter more than brand for furniture comps.',
      })
      break

    case 'vehicle':
      add({
        label: 'KMs / service',
        question: 'What is the odometer reading, rego status, and any service history?',
        why: 'KMs and paperwork dominate vehicle value.',
      })
      break

    case 'jewellery':
      add({
        label: 'Material',
        question: 'What metal/purity is it (e.g. 925 silver, 9ct gold), and any hallmarks or box?',
        why: 'Material and authenticity drive jewellery comps.',
      })
      break

    case 'collectible':
      add({
        label: 'Set / completeness',
        question: 'What is the set number, and is it complete with box/instructions?',
        why: 'Loose figures and incomplete sets price differently from sealed/complete sets.',
      })
      break

    default:
      if (!variant && product.identificationConfidence < 0.7) {
        add({
          label: 'Exact model',
          question:
            'Can you confirm the exact brand, model, and any size/capacity details?',
          why: 'A clearer model match gives a much better price read.',
        })
      }
      break
  }

  // Explicit extract gaps
  for (const gap of product.missingInformation) {
    const g = gap.toLowerCase()
    if (g.includes('charger')) {
      add({
        label: 'Charger',
        question: 'Does it include the original charger / cable?',
        why: 'Missing chargers change what buyers expect to pay.',
      })
    }
    if (g.includes('box')) {
      add({
        label: 'Box',
        question: 'Does it come with the original box?',
        why: 'Boxed units often clear higher asking prices.',
      })
    }
  }

  return out.slice(0, 5)
}

/** Show prompts when the read is weak or key fields are missing. */
export function shouldShowAskSeller(analysis: AnalysisResult): boolean {
  if (analysis.deal.verdictLabel === 'INSUFFICIENT DATA') return true
  if (analysis.deal.verdictLabel === 'LIMITED MARKET DATA') return true
  if (analysis.confidence.level === 'LOW') return true
  if (analysis.confidence.level === 'INSUFFICIENT') return true
  return buildAskSellerPrompts(analysis.product).length > 0 &&
    (analysis.product.identificationConfidence < 0.7 ||
      !analysis.product.variant ||
      !analysis.product.condition ||
      analysis.product.condition === 'unknown')
}

export function buildAskSellerMessage(prompts: AskSellerPrompt[]): string {
  if (prompts.length === 0) return ''
  const lines = prompts.map((p, i) => `${i + 1}. ${p.question}`)
  return [
    'Hey, interested in this — a few quick questions before I decide:',
    '',
    ...lines,
    '',
    'Cheers',
  ].join('\n')
}

function needsStorage(category: ProductCategory): boolean {
  return (
    category === 'phone' ||
    category === 'tablet' ||
    category === 'vr_headset' ||
    category === 'laptop' ||
    category === 'console'
  )
}

function hasStorageHint(variant: string | null): boolean {
  if (!variant) return false
  return /\d+\s*gb|\d+\s*tb/i.test(variant)
}

function hasRamOrStorageHint(variant: string | null): boolean {
  if (!variant) return false
  return /\d+\s*gb|\d+\s*tb|m[1-4]\b|i[3579]\b|ryzen/i.test(variant)
}

function hasBatteryHint(product: IdentifiedProduct): boolean {
  const blob = [
    ...product.sellerClaims,
    ...product.missingInformation,
    product.variant ?? '',
  ]
    .join(' ')
    .toLowerCase()
  return /battery\s*(health|%|percent)|bh\s*\d{2,3}/i.test(blob)
}

function hasControllers(product: IdentifiedProduct): boolean {
  return product.includedAccessories.some((a) =>
    /controller/i.test(a),
  )
}

function isPs5Family(product: IdentifiedProduct): boolean {
  return /playstation\s*5|\bps5\b/i.test(`${product.brand} ${product.model}`)
}

function isSwitchFamily(product: IdentifiedProduct): boolean {
  return /switch/i.test(product.model)
}

function hasEditionHint(variant: string | null, model: string): boolean {
  const blob = `${variant ?? ''} ${model}`.toLowerCase()
  return /\bdisc\b|\bdigital\b|\bslim\b|\bpro\b/.test(blob)
}

function storageQuestion(product: IdentifiedProduct): string {
  if (product.category === 'laptop') {
    return 'What storage and RAM does it have (e.g. 256GB SSD / 8GB)?'
  }
  if (product.category === 'console') {
    return 'How much storage does it have, and has it been expanded?'
  }
  return 'What storage capacity is it — e.g. 128GB, 256GB, or 512GB?'
}
