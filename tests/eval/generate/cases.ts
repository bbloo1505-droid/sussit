import { EVAL_CATALOG, findSku, skuToProduct, CONDITIONS } from '../catalog.ts'
import { EVAL_SEED, intBetween, mulberry32, pick } from '../seed.ts'
import type {
  IdentificationCase,
  LowInfoCase,
  MatchingCase,
  ValuationCase,
  VerdictCase,
} from '../types.ts'

const ACCESSORY_TEMPLATES = [
  '{brand} {model} charging dock',
  '{brand} {model} elite strap',
  '{brand} {model} carrying case',
  '{brand} {model} link cable',
  '{model} controller only',
  '{model} right controller only',
  '{model} left controller only',
  '{brand} {model} faceplate OEM',
  '{brand} {model} joystick module',
  '{brand} {model} battery cover lid',
  '{brand} {model} spare part repair',
  'Empty box only for {brand} {model}',
  '{brand} {model} empty box no headset',
]

const BROKEN_TEMPLATES = [
  '{brand} {model} {variant} for parts broken screen',
  '{brand} {model} {variant} faulty not working',
  '{brand} {model} {variant} spares or repair',
]

const BUNDLE_TEMPLATES = [
  '{brand} {model} {variant} + elite strap + battery pack + case + games bundle',
  '{brand} {model} {variant} ultimate accessory mega bundle',
]

const HEADSET_ONLY = [
  '{brand} {model} {variant} headset only — no controllers',
  '{brand} {model} {variant} without controllers',
]

const SPELLINGS: Record<string, string[]> = {
  'Quest 3': ['Quest 3', 'quest3', 'QUEST 3', 'Meta Quest3', 'Oculus Quest 3'],
  'Quest 3S': ['Quest 3S', 'quest 3s', 'Quest3S', 'Meta Quest 3s'],
  'Quest 2': ['Quest 2', 'quest2', 'Oculus Quest 2'],
  'PlayStation 5': ['PlayStation 5', 'PS5', 'ps5', 'Play Station 5'],
  'PlayStation 5 Slim': ['PS5 Slim', 'PlayStation 5 Slim', 'ps5 slim'],
  'PlayStation 5 Pro': ['PS5 Pro', 'PlayStation 5 Pro'],
  'Switch OLED': ['Switch OLED', 'OLED Switch', 'Nintendo Switch OLED'],
  'Switch Lite': ['Switch Lite', 'Nintendo Switch Lite'],
  Switch: ['Switch', 'Nintendo Switch'],
  'iPhone 13': ['iPhone 13', 'iphone13', 'Iphone 13'],
  'iPhone 14': ['iPhone 14', 'iphone 14'],
  'iPhone 15': ['iPhone 15', 'iphone15'],
  'iPhone 15 Pro': ['iPhone 15 Pro', 'iphone 15 pro'],
  'iPhone 15 Pro Max': ['iPhone 15 Pro Max', '15 Pro Max'],
  'iPhone 16': ['iPhone 16', 'iphone16'],
}

function fill(
  template: string,
  parts: {
    brand: string
    model: string
    variant: string
  },
): string {
  return template
    .replaceAll('{brand}', parts.brand)
    .replaceAll('{model}', parts.model)
    .replaceAll('{variant}', parts.variant)
    .replace(/\s+/g, ' ')
    .trim()
}

function goodTitle(sku: ReturnType<typeof findSku>, spelling: string): string {
  const variant = sku.variant ?? ''
  if (sku.category === 'vr_headset') {
    return `${sku.brand} ${spelling} ${variant} VR Headset with Controllers`.replace(
      /\s+/g,
      ' ',
    )
  }
  if (sku.category === 'phone') {
    const labeled = /iphone/i.test(spelling) ? spelling : `iPhone ${spelling}`
    return `${labeled} ${variant} unlocked used`.replace(/\s+/g, ' ')
  }
  if (sku.model.includes('Digital')) {
    return `${spelling} Digital Edition console used`
  }
  if (sku.variant === 'Digital') {
    return `${spelling} Digital Edition used`
  }
  if (sku.variant === 'Disc') {
    return `${spelling} Disc Edition with controller`
  }
  return `${sku.brand} ${spelling} ${variant} used console`.replace(/\s+/g, ' ')
}

/** Thousands of deterministic matching / adversarial cases. */
export function generateMatchingCases(seed = EVAL_SEED): MatchingCase[] {
  const rng = mulberry32(seed)
  const cases: MatchingCase[] = []
  let n = 0

  for (const sku of EVAL_CATALOG) {
    const target = skuToProduct(sku)
    const spellings = SPELLINGS[sku.model] ?? [sku.model]
    const variant = sku.variant ?? ''

    // Good includes
    for (const spelling of spellings) {
      for (const condition of CONDITIONS) {
        cases.push({
          id: `match-inc-${sku.key}-${n++}`,
          suite: 'matching',
          category: sku.category,
          modelKey: sku.key,
          description: `Include good ${sku.key} (${spelling}, ${condition})`,
          target: { ...target, condition },
          candidate: {
            title: goodTitle(sku, spelling),
            price: sku.typicalAsk + intBetween(rng, -40, 40),
            condition,
            includedAccessories: target.includedAccessories,
          },
          expectation: 'EXPECTED_INCLUDE',
          tags: ['good', 'spelling'],
        })
      }
    }

    // Accessories — must exclude
    for (const tmpl of ACCESSORY_TEMPLATES) {
      cases.push({
        id: `adv-acc-${sku.key}-${n++}`,
        suite: 'adversarial',
        category: sku.category,
        modelKey: sku.key,
        description: `Reject accessory: ${tmpl}`,
        target,
        candidate: {
          title: fill(tmpl, { brand: sku.brand, model: sku.model, variant }),
          price: intBetween(rng, 20, 160),
          condition: 'used_good',
          includedAccessories: [],
        },
        expectation: 'EXPECTED_EXCLUDE',
        tags: ['accessory', 'adversarial'],
      })
    }

    // Broken / for parts
    for (const tmpl of BROKEN_TEMPLATES) {
      cases.push({
        id: `adv-brk-${sku.key}-${n++}`,
        suite: 'adversarial',
        category: sku.category,
        modelKey: sku.key,
        description: `Reject broken: ${tmpl}`,
        target,
        candidate: {
          title: fill(tmpl, { brand: sku.brand, model: sku.model, variant }),
          price: Math.round(sku.typicalAsk * 0.35),
          condition: 'for_parts',
          includedAccessories: [],
        },
        expectation: 'EXPECTED_EXCLUDE',
        tags: ['broken', 'adversarial'],
      })
    }

    // Bundles — exclude or ambiguous (we expect exclude via large bundle)
    for (const tmpl of BUNDLE_TEMPLATES) {
      cases.push({
        id: `adv-bun-${sku.key}-${n++}`,
        suite: 'adversarial',
        category: sku.category,
        modelKey: sku.key,
        description: `Reject mega bundle`,
        target,
        candidate: {
          title: fill(tmpl, { brand: sku.brand, model: sku.model, variant }),
          price: Math.round(sku.typicalAsk * 1.45),
          condition: 'used_good',
          includedAccessories: [
            'left controller',
            'right controller',
            'elite strap',
            'battery pack',
            'case',
            'games',
          ],
        },
        expectation: 'EXPECTED_EXCLUDE',
        tags: ['bundle', 'adversarial'],
      })
    }

    // Headset only / missing controllers (VR)
    if (sku.category === 'vr_headset') {
      for (const tmpl of HEADSET_ONLY) {
        cases.push({
          id: `adv-ho-${sku.key}-${n++}`,
          suite: 'adversarial',
          category: sku.category,
          modelKey: sku.key,
          description: `Reject headset-only`,
          target,
          candidate: {
            title: fill(tmpl, { brand: sku.brand, model: sku.model, variant }),
            price: Math.round(sku.typicalAsk * 0.7),
            condition: 'used_good',
            includedAccessories: [],
          },
          expectation: 'EXPECTED_EXCLUDE',
          tags: ['headset_only', 'adversarial'],
        })
      }
    }

    // Wrong generation / neighbours
    for (const wrongKey of [...sku.wrongGen, ...sku.neighbours]) {
      if (wrongKey === sku.key) continue
      const wrong = findSku(wrongKey)
      const wrongSpell = (SPELLINGS[wrong.model] ?? [wrong.model])[0]!
      cases.push({
        id: `adv-wrong-${sku.key}-${wrong.key}-${n++}`,
        suite: 'adversarial',
        category: sku.category,
        modelKey: sku.key,
        description: `Reject wrong model ${wrong.key} for target ${sku.key}`,
        target,
        candidate: {
          title: goodTitle(wrong, wrongSpell),
          price: wrong.typicalAsk,
          condition: 'used_good',
          includedAccessories: wrong.category === 'vr_headset'
            ? ['left controller', 'right controller']
            : [],
        },
        expectation: 'EXPECTED_EXCLUDE',
        tags: ['wrong_model', 'adversarial'],
      })
    }

    // Storage mismatches (phones / VR with storage)
    if (sku.storageGb === 512) {
      cases.push({
        id: `adv-stor-${sku.key}-${n++}`,
        suite: 'adversarial',
        category: sku.category,
        modelKey: sku.key,
        description: `Reject different storage 128GB`,
        target,
        candidate: {
          title: `${sku.brand} ${sku.model} 128GB VR Headset with Controllers`,
          price: sku.typicalAsk - 80,
          condition: 'used_good',
          includedAccessories: ['left controller', 'right controller'],
        },
        expectation: 'EXPECTED_EXCLUDE',
        tags: ['storage', 'adversarial'],
      })
    }
    if (sku.storageGb === 128 && sku.category === 'phone') {
      cases.push({
        id: `adv-stor-${sku.key}-${n++}`,
        suite: 'adversarial',
        category: sku.category,
        modelKey: sku.key,
        description: `Reject different storage 256GB`,
        target,
        candidate: {
          title: `${sku.model} 256GB unlocked used`,
          price: sku.typicalAsk + 60,
          condition: 'used_good',
        },
        expectation: 'EXPECTED_EXCLUDE',
        tags: ['storage', 'adversarial'],
      })
    }

    // Brand-new sealed
    cases.push({
      id: `adv-new-${sku.key}-${n++}`,
      suite: 'adversarial',
      category: sku.category,
      modelKey: sku.key,
      description: `Reject brand new sealed`,
      target,
      candidate: {
        title: `Brand new ${sku.brand} ${sku.model} ${variant} sealed BNIB`.replace(
          /\s+/g,
          ' ',
        ),
        price: Math.round(sku.typicalAsk * 1.25),
        condition: 'new',
      },
      expectation: 'EXPECTED_EXCLUDE',
      tags: ['new', 'adversarial'],
    })

    // Noise padding — scale to 10k+ deterministic cases
    for (let i = 0; i < 450; i++) {
      const spelling = pick(rng, spellings)
      const noise = pick(rng, [
        'pickup only',
        'can post',
        'Melbourne',
        'Sydney',
        'as new',
        'barely used',
        'OG charger',
        'fast sale',
        'price firm',
        'negotiable',
        'VIC',
        'NSW',
      ])
      cases.push({
        id: `match-noise-${sku.key}-${n++}`,
        suite: 'matching',
        category: sku.category,
        modelKey: sku.key,
        description: `Include noisy good title`,
        target,
        candidate: {
          title: `${goodTitle(sku, spelling)} — ${noise}`,
          price: sku.typicalAsk + intBetween(rng, -50, 50),
          condition: 'used_good',
          includedAccessories: target.includedAccessories,
        },
        expectation: 'EXPECTED_INCLUDE',
        tags: ['noise', 'good'],
      })
    }

    // Extra adversarial spellings / abbreviations / noisy rejects
    for (let i = 0; i < 140; i++) {
      const kind = pick(rng, [
        'accessory',
        'broken',
        'wrong',
        'empty_box',
        'abbrev',
      ] as const)
      if (kind === 'accessory') {
        const tmpl = pick(rng, ACCESSORY_TEMPLATES)
        cases.push({
          id: `adv-extra-acc-${sku.key}-${n++}`,
          suite: 'adversarial',
          category: sku.category,
          modelKey: sku.key,
          description: `Reject accessory variant`,
          target,
          candidate: {
            title: `${fill(tmpl, { brand: sku.brand, model: sku.model, variant })} #${i}`,
            price: intBetween(rng, 15, 180),
            condition: 'used_good',
          },
          expectation: 'EXPECTED_EXCLUDE',
          tags: ['accessory', 'adversarial'],
        })
      } else if (kind === 'broken') {
        cases.push({
          id: `adv-extra-brk-${sku.key}-${n++}`,
          suite: 'adversarial',
          category: sku.category,
          modelKey: sku.key,
          description: `Reject for-parts noisy`,
          target,
          candidate: {
            title: `${sku.model} ${variant} spares/repair cracked — lot ${i}`,
            price: Math.round(sku.typicalAsk * 0.25),
            condition: 'for_parts',
          },
          expectation: 'EXPECTED_EXCLUDE',
          tags: ['broken', 'adversarial'],
        })
      } else if (kind === 'wrong' && sku.neighbours.length) {
        const wrong = findSku(pick(rng, sku.neighbours))
        cases.push({
          id: `adv-extra-wrong-${sku.key}-${n++}`,
          suite: 'adversarial',
          category: sku.category,
          modelKey: sku.key,
          description: `Reject wrong model neighbour`,
          target,
          candidate: {
            title: goodTitle(wrong, (SPELLINGS[wrong.model] ?? [wrong.model])[0]!),
            price: wrong.typicalAsk + intBetween(rng, -30, 30),
            condition: 'used_good',
            includedAccessories:
              wrong.category === 'vr_headset'
                ? ['left controller', 'right controller']
                : [],
          },
          expectation: 'EXPECTED_EXCLUDE',
          tags: ['wrong_model', 'adversarial'],
        })
      } else if (kind === 'empty_box') {
        cases.push({
          id: `adv-extra-box-${sku.key}-${n++}`,
          suite: 'adversarial',
          category: sku.category,
          modelKey: sku.key,
          description: `Reject empty box`,
          target,
          candidate: {
            title: `Empty box only ${sku.brand} ${sku.model} packaging no device`,
            price: intBetween(rng, 10, 60),
            condition: 'used_fair',
          },
          expectation: 'EXPECTED_EXCLUDE',
          tags: ['accessory', 'adversarial'],
        })
      } else {
        cases.push({
          id: `adv-extra-abbr-${sku.key}-${n++}`,
          suite: 'adversarial',
          category: sku.category,
          modelKey: sku.key,
          description: `Reject replacement part abbreviation`,
          target,
          candidate: {
            title: `${sku.model} OEM PCB / MB repair spare part only`,
            price: intBetween(rng, 20, 90),
            condition: 'for_parts',
          },
          expectation: 'EXPECTED_EXCLUDE',
          tags: ['accessory', 'adversarial'],
        })
      }
    }
  }

  return cases
}

export function generateIdentificationCases(seed = EVAL_SEED): IdentificationCase[] {
  const rng = mulberry32(seed + 1)
  const cases: IdentificationCase[] = []
  let n = 0

  for (const sku of EVAL_CATALOG) {
    const spellings = SPELLINGS[sku.model] ?? [sku.model]
    for (const spelling of spellings) {
      for (const conditionPhrase of [
        'lightly used',
        'used good condition',
        'like new',
        'with box and charger',
      ]) {
        const price = sku.typicalAsk + intBetween(rng, -20, 20)
        const loc = pick(rng, ['Melbourne', 'Sydney', 'Brisbane', 'Perth'])
        const text =
          `${spelling} ${sku.variant ?? ''} ${conditionPhrase} $${price} ${loc}`.replace(
            /\s+/g,
            ' ',
          )
        cases.push({
          id: `id-${sku.key}-${n++}`,
          suite: 'identification',
          category: sku.category,
          modelKey: sku.key,
          description: `Identify ${sku.key} from paste`,
          inputText: text,
          expected: {
            category: sku.category,
            brand: sku.brand,
            model: sku.model,
            variant: sku.variant,
            storageGb: sku.storageGb,
            condition: null,
          },
        })
      }
    }
  }

  return cases
}

export function generateLowInfoCases(): LowInfoCase[] {
  const vague = [
    'iPhone',
    'old camera',
    'PS5 stuff',
    'Makita drill',
    'laptop for sale',
    'console',
    'VR headset',
    'Apple watch',
    'phone 128gb',
    'gaming stuff Melbourne',
  ]
  return vague.map((inputText, i) => ({
    id: `low-${i}`,
    suite: 'low_info' as const,
    category: 'ambiguous' as const,
    modelKey: 'low-info',
    description: `Low info: ${inputText}`,
    inputText,
  }))
}

export function generateValuationCases(seed = EVAL_SEED): ValuationCase[] {
  const rng = mulberry32(seed + 2)
  const cases: ValuationCase[] = []
  let n = 0

  for (const sku of EVAL_CATALOG) {
    const target = skuToProduct(sku)
    const base: number[] = []
    for (let i = 0; i < 12; i++) {
      base.push(sku.typicalAsk + intBetween(rng, -35, 35))
    }
    cases.push({
      id: `val-base-${sku.key}-${n++}`,
      suite: 'valuation',
      category: sku.category,
      modelKey: sku.key,
      description: `Stable median for ${sku.key}`,
      target,
      prices: base,
      asserts: {
        minSample: 12,
        medianMin: sku.typicalAsk - 50,
        medianMax: sku.typicalAsk + 50,
        maxDispersion: 0.35,
      },
    })

    cases.push({
      id: `val-outlier-${sku.key}-${n++}`,
      suite: 'valuation',
      category: sku.category,
      modelKey: sku.key,
      description: `Outliers must not dominate ${sku.key}`,
      target,
      prices: base,
      outlierPrices: [5, 9, sku.typicalAsk * 8, 50_000],
      asserts: {
        minSample: 12,
        outlierMedianShiftMax: 0.12,
      },
    })
  }

  return cases
}

export function generateVerdictCases(): VerdictCase[] {
  const cases: VerdictCase[] = []
  let n = 0
  for (const sku of EVAL_CATALOG) {
    const product = skuToProduct(sku)
    cases.push({
      id: `verdict-${sku.key}-${n++}`,
      suite: 'verdict',
      category: sku.category,
      modelKey: sku.key,
      description: `Higher ask cannot improve deal for ${sku.key}`,
      product,
      marketMedian: sku.typicalAsk,
      marketP25: Math.round(sku.typicalAsk * 0.92),
      marketP75: Math.round(sku.typicalAsk * 1.08),
      sampleCount: 10,
      askingPrices: [
        Math.round(sku.typicalAsk * 0.7),
        Math.round(sku.typicalAsk * 0.85),
        sku.typicalAsk,
        Math.round(sku.typicalAsk * 1.15),
        Math.round(sku.typicalAsk * 1.35),
      ],
    })
  }
  return cases
}
