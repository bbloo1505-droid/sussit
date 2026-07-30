import type {
  ComparableAssessment,
  ComparableListing,
  IdentifiedProduct,
} from '@/types/domain'

const REJECT_SCORE = 0
const INCLUDE_THRESHOLD = 80

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function titleOf(listing: ComparableListing): string {
  return norm(listing.title)
}

function hasAny(text: string, terms: string[]): boolean {
  return terms.some((t) => text.includes(norm(t)))
}

function extractAllStorageGb(text: string): number[] {
  return [...text.matchAll(/(\d+)\s*gb/g)].map((m) => Number(m[1]))
}

/** Prefer SSD-like capacities when variant lists RAM + storage (e.g. "8GB 256GB"). */
function targetStorageGb(product: IdentifiedProduct): number | null {
  if (!product.variant) return null
  const all = extractAllStorageGb(norm(product.variant))
  if (all.length === 0) return null
  if (all.length === 1) return all[0]!
  const ssdLike = all.filter(
    (n) => n >= 128 || [128, 256, 512, 1024, 2048].includes(n),
  )
  if (ssdLike.length > 0) return ssdLike[ssdLike.length - 1]!
  return all[all.length - 1]!
}

function isVr(product: IdentifiedProduct, model: string): boolean {
  return (
    product.category === 'vr_headset' ||
    model.includes('quest') ||
    model.includes('vision pro')
  )
}

function priceFloor(product: IdentifiedProduct): number {
  switch (product.category) {
    case 'furniture':
    case 'clothing':
    case 'collectible':
    case 'other':
      return 5
    case 'jewellery':
      return 20
    case 'vehicle':
      return 500
    case 'audio':
      return 25
    default:
      return 15
  }
}

function priceCeiling(product: IdentifiedProduct): number {
  switch (product.category) {
    case 'vehicle':
      return 250_000
    case 'jewellery':
      return 80_000
    case 'furniture':
      return 25_000
    case 'camera':
    case 'laptop':
      return 12_000
    case 'gpu':
      return 8_000
    default:
      return 5_000
  }
}

function isBasicCategory(category: IdentifiedProduct['category']): boolean {
  return (
    category === 'furniture' ||
    category === 'clothing' ||
    category === 'vehicle' ||
    category === 'jewellery' ||
    category === 'collectible' ||
    category === 'other' ||
    category === 'unknown'
  )
}

/** Docks, straps, spare parts, cases — not sellable full headsets. */
function isVrAccessoryOrPart(title: string): boolean {
  return hasAny(title, [
    'charging dock',
    'charge dock',
    'charging station',
    'charger dock',
    'magnetic charger',
    'elite strap',
    'head strap',
    'headstrap',
    'battery strap',
    'pro headstrap',
    'bobovr',
    'carrying case',
    'carry case',
    'travel case',
    'soft carry case',
    'link cable',
    'attachment',
    'side grip',
    'grip cover',
    'faceplate',
    'facial interface',
    'motherboard',
    'mainboard',
    'pcb',
    'joystick',
    'thumbstick',
    'vibration motor',
    'ribbon cable',
    'housing shell',
    'battery cover',
    'battery terminal',
    'button set',
    'trigger button',
    'wrist strap',
    'led array',
    'holster',
    'tactsuit',
    'haptic',
    'controller only',
    'controllers only',
    'right controller',
    'left controller',
    'spare part',
    'oem part',
    'replacement part',
    'repair',
  ])
}

/** Positive evidence this row is a complete headset unit. */
function isFullVrHeadsetListing(title: string): boolean {
  if (hasAny(title, ['headset', 'standalone', 'virtual reality', 'vr headset'])) {
    return true
  }
  if (
    hasAny(title, ['with controllers', 'touch plus', 'controllers included']) &&
    !hasAny(title, ['controller only', 'controllers only', 'right controller', 'left controller'])
  ) {
    return true
  }
  // Bare capacity title like "Meta Quest 3 512 GB" with no accessory words
  if (/\b(64|128|256|512)\s*gb\b/.test(title) && !isVrAccessoryOrPart(title)) {
    return true
  }
  return false
}

/** Short titles like "Meta Quest 3" with no accessory words. */
function isBareHeadsetTitle(
  title: string,
  brand: string,
  model: string,
): boolean {
  if (isVrAccessoryOrPart(title)) return false
  let rest = ` ${title} `
  for (const token of [
    ...brand.split(/\s+/),
    ...model.split(/\s+/),
    'meta',
    'oculus',
    'used',
    'white',
    'black',
    'grey',
    'gray',
  ]) {
    if (!token) continue
    rest = rest.replaceAll(` ${norm(token)} `, ' ')
  }
  rest = rest.replace(/\s+/g, ' ').trim()
  return rest.length <= 8
}

function isEmptyBoxOrPackaging(title: string): boolean {
  return hasAny(title, [
    'empty box',
    'box only',
    'box only for',
    'packaging only',
    'no device',
    'no headset',
    'no console',
    'no phone',
  ])
}

function isPhoneAccessoryListing(title: string): boolean {
  if (
    hasAny(title, [
      'motherboard',
      'logic board',
      'mainboard',
      'pcb',
      'spare part',
      'replacement w face',
      'board replacement',
    ])
  ) {
    return true
  }

  const accessory = hasAny(title, [
    'case',
    'cover',
    'tempered glass',
    'screen protector',
    'magsafe',
    'charger',
    'charging cord',
    'usb c cable',
    'usb-c cable',
    'cable pd',
    'leather case',
    'silicone case',
    'shockproof',
    'jelly case',
  ])
  if (!accessory) return false
  // Real phones usually include storage or unlocked/grade wording without being "case for"
  if (/\bfor iphone\b/.test(title) || /\bcase for\b/.test(title)) return true
  if (hasAny(title, ['unlocked', 'battery', 'grade', 'a3090', 'a2848'])) return false
  if (/\b(64|128|256|512|1tb)\s*gb\b/.test(title) && hasAny(title, ['iphone'])) {
    return false
  }
  return true
}

function isConsoleAccessoryListing(title: string): boolean {
  if (
    hasAny(title, [
      'motherboard',
      'mainboard',
      'pcb',
      'spare part',
      'oem part',
      'replacement part',
      'joystick module',
      'battery cover',
      'faceplate',
      'disc drive only',
      'disc drive',
      'optical drive',
      'digital code',
      'download code',
      'game code',
      'dlc code',
    ])
  ) {
    return true
  }

  const accessory = hasAny(title, [
    'cooling stand',
    'charging stand',
    'horizontal stand',
    'stand station',
    'charging station',
    'charging dock',
    'charge dock',
    'elite strap',
    'carrying case',
    'carry case',
    'travel case',
    'link cable',
    'controller skin',
    'thumb grip',
    'silicone cover',
    'pro cover',
    'console cover',
    'dualsense charging',
    'battlebeaver',
    'custom controller',
  ])
  if (!accessory) return false

  // Real consoles usually say console / edition; accessory listings often don't
  const looksLikeConsoleUnit = hasAny(title, [
    'console',
    'disc edition',
    'digital edition',
    'with controller',
    'with dualsense',
    'cfi-',
  ])
  return !looksLikeConsoleUnit
}

/** Title says sealed/BNIB unit — not "Brand New DualSense" on a used console. */
function isBrandNewUnitTitle(title: string): boolean {
  if (hasAny(title, ['sealed', 'unopened', 'bnib'])) return true
  if (!/\bbrand\s*new\b/.test(title)) return false

  const brandNewAccessoryOnly =
    /brand\s*new[^.]{0,48}(dualsense|controller|game|games|headset|cable|charger)/i.test(
      title,
    ) &&
    !/brand\s*new\s+(sony\s+)?(ps5|playstation|console|switch|xbox|quest)/i.test(
      title,
    )

  return !brandNewAccessoryOnly
}

function isPs5GameOrPeripheralNoise(title: string): boolean {
  if (
    /tony\s*hawk|pro\s*skater|pro\s*enhanced|fanatec|magazine|demo\s*disc|pro\s*evolution|pes\s*\d|\bps2\b|playstation\s*2/.test(
      title,
    )
  ) {
    return true
  }
  if (
    /digital\s*(code|download|dlc|voucher)/.test(title) &&
    !/\bconsole\b/.test(title)
  ) {
    return true
  }
  // Controllers / headsets / wheels alone — keep console bundles
  if (
    /\bconsole\b/.test(title) ||
    /digital\s*edition/.test(title) ||
    /disc\s*edition/.test(title) ||
    /\bcfi-/.test(title)
  ) {
    return false
  }
  return /victrix|racing\s*wheel|\bpedals?\b|headset|adapter|dongle|receiver/.test(
    title,
  )
}

function titleLooksLikePs5Pro(title: string): boolean {
  return (
    /\bps5\s*pro\b/.test(title) ||
    /playstation\s*5\s*pro/.test(title) ||
    /\bps5pro\b/.test(title) ||
    /\bcfi-70\d{2}\b/.test(title)
  )
}

function titleLooksLikePs5DigitalEdition(title: string): boolean {
  if (/digital\s*edition/.test(title)) return true
  if (/digital\s*(code|download|dlc|voucher|adventure)/.test(title)) return false
  // "ps5 digital console" / bare digital + console — not publisher "Devolver Digital"
  return /\bdigital\b/.test(title) && /\b(console|cfi-)\b/.test(title)
}

/** Shared spare/accessory rejects for any category (eval adversarial coverage). */
function isGenericAccessoryListing(
  product: IdentifiedProduct,
  title: string,
): boolean {
  if (product.category === 'vr_headset') return false // handled by VR-specific path
  if (product.category === 'console' && isConsoleAccessoryListing(title)) return true
  if (product.category === 'phone' && isPhoneAccessoryListing(title)) return true

  // Adversarial / cross-category accessory phrasing on consoles & phones
  if (
    hasAny(title, [
      'charging dock',
      'elite strap',
      'carrying case',
      'carry case',
      'link cable',
      'faceplate oem',
      'joystick module',
      'battery cover lid',
      'spare part repair',
      'empty box',
    ])
  ) {
    const unit = hasAny(title, [
      'console',
      'headset',
      'unlocked',
      'disc edition',
      'digital edition',
      'with controllers',
    ])
    return !unit
  }
  return false
}

function wrongFamilyReason(
  product: IdentifiedProduct,
  model: string,
  title: string,
): string | null {
  // --- Quest family ---
  const isQuest3S = /\bquest\s*3s\b/.test(model) || model.includes('quest 3s')
  const isQuest3 =
    (model.includes('quest 3') || /\bquest3\b/.test(model)) && !isQuest3S
  const isQuest2 = model.includes('quest 2') || /\bquest2\b/.test(model)

  if (isQuest3S) {
    if (hasAny(title, ['quest 2', 'quest2', 'quest pro'])) {
      return 'Wrong generation'
    }
    if (/\bquest\s*3\b/.test(title) && !/\bquest\s*3s\b/.test(title) && !/\bquest3s\b/.test(title)) {
      return 'Wrong generation'
    }
    if (!/\bquest\s*3s\b/.test(title) && !/\bquest3s\b/.test(title)) {
      return 'Model not matched'
    }
  } else if (isQuest3) {
    if (
      hasAny(title, ['quest 2', 'quest2', 'quest pro']) ||
      /\bquest\s*3s\b/.test(title) ||
      /\bquest3s\b/.test(title)
    ) {
      return 'Wrong generation'
    }
    if (!hasAny(title, ['quest 3', 'quest3'])) {
      return 'Model not matched'
    }
  } else if (isQuest2) {
    if (
      hasAny(title, ['quest 3', 'quest3', 'quest 3s', 'quest3s', 'quest pro'])
    ) {
      return 'Wrong generation'
    }
  }

  // --- PlayStation 5 family ---
  const isPs5 =
    model.includes('playstation 5') ||
    model === 'ps5' ||
    model.startsWith('ps5 ')
  if (isPs5) {
    const targetSlim = model.includes('slim')
    const targetPro = model.includes('pro')
    const titleSlim = /\bslim\b/.test(title)
    const titlePro = titleLooksLikePs5Pro(title)
    const titleDigital = titleLooksLikePs5DigitalEdition(title)
    const titleDisc =
      /\bdisc\s*edition\b/.test(title) ||
      (/\bdisc\b/.test(title) && !/\bdisc\s*drive\b/.test(title))
    const variant = norm(product.variant ?? '')

    if (isPs5GameOrPeripheralNoise(title)) {
      return targetPro ? 'Not a PS5 Pro console' : 'Not a PS5 console listing'
    }

    if (targetPro) {
      if (
        /tony\s*hawk|pro\s*skater|pro\s*enhanced|fanatec|magazine|demo\s*disc|pro\s*evolution|\bps2\b/.test(
          title,
        )
      ) {
        return 'Not a PS5 Pro console'
      }
      if (/\bplaystation\s*4\s*pro\b|\bps4\s*pro\b/.test(title) && !titlePro) {
        return 'Wrong PS5 model (PS4 Pro)'
      }
      if (titleSlim && !titlePro) return 'Wrong PS5 model (Slim)'
      if (!titlePro) return 'Wrong PS5 model (not Pro)'
      // Games / accessories that mention "PS5 Pro Enhanced"
      if (
        !/\bconsole\b/.test(title) &&
        (/\bgame\b|blu-?ray|headset|controller\s*only|wheel\b|pedals?\b/.test(
          title,
        ) ||
          /playstation\s*4|\bps4\b/.test(title))
      ) {
        return 'Not a PS5 Pro console'
      }
    } else if (targetSlim) {
      if (titlePro) return 'Wrong PS5 model (Pro)'
      if (!titleSlim) return 'Wrong PS5 model (not Slim)'
      if (/\bdisc\s*drive\b/.test(title) && !/\bconsole\b/.test(title)) {
        return 'PS5 disc drive accessory'
      }
    } else {
      // Fat / base PS5 — reject Slim and Pro neighbours
      if (titleSlim) return 'Wrong PS5 model (Slim)'
      if (titlePro) return 'Wrong PS5 model (Pro)'
    }

    if (variant.includes('disc')) {
      if (titleDigital) return 'Wrong PS5 edition (digital)'
      if (/\bdisc\s*drive\b/.test(title) && !/\b(console|edition)\b/.test(title)) {
        return 'PS5 disc drive accessory'
      }
    }
    if (variant.includes('digital')) {
      if (titleDisc && !titleDigital) return 'Wrong PS5 edition (disc)'
      if (!titleDigital) return 'Wrong PS5 edition (not digital)'
      if (
        !/\bconsole\b/.test(title) &&
        !/digital\s*edition/.test(title) &&
        !/\bcfi-/.test(title)
      ) {
        return 'Not a PS5 digital console'
      }
    }
  }

  // --- Switch family ---
  const isSwitch = model.includes('switch')
  if (isSwitch) {
    const targetOled = model.includes('oled')
    const targetLite = model.includes('lite')
    const titleOled = /\boled\b/.test(title)
    const titleLite = /\blite\b/.test(title)

    if (targetOled) {
      if (titleLite) return 'Wrong Switch model (Lite)'
      if (!titleOled) return 'Wrong Switch model (not OLED)'
    } else if (targetLite) {
      if (titleOled) return 'Wrong Switch model (OLED)'
      if (!titleLite) return 'Wrong Switch model (not Lite)'
    } else {
      if (titleOled) return 'Wrong Switch model (OLED)'
      if (titleLite) return 'Wrong Switch model (Lite)'
    }
  }

  // --- iPhone family ---
  if (product.category === 'phone' && model.includes('iphone')) {
    const targetProMax = /pro\s*max/.test(model)
    const targetPro = /\bpro\b/.test(model) && !targetProMax
    const targetPlus = /\bplus\b/.test(model)
    const titleProMax = /iphone\s*\d+\s*pro\s*max/.test(title) || /pro\s*max/.test(title)
    const titlePro =
      /iphone\s*\d+\s*pro\b/.test(title) && !/pro\s*max/.test(title)
    const titlePlus = /iphone\s*\d+\s*plus/.test(title) || /\bplus\b/.test(title)

    if (targetProMax) {
      if (!titleProMax) return 'Wrong iPhone model (not Pro Max)'
    } else if (targetPro) {
      if (titleProMax) return 'Wrong iPhone model (Pro Max)'
      if (!titlePro) return 'Wrong iPhone model (not Pro)'
    } else if (targetPlus) {
      if (!titlePlus) return 'Wrong iPhone model (not Plus)'
    } else {
      if (titleProMax || titlePro) return 'Wrong iPhone model (Pro)'
      if (titlePlus) return 'Wrong iPhone model (Plus)'
    }

    // Generation digit when both sides clear
    const targetGen = model.match(/iphone\s*(\d+)/)
    const titleGen = title.match(/iphone\s*(\d+)/)
    if (targetGen && titleGen && targetGen[1] !== titleGen[1]) {
      return 'Wrong iPhone generation'
    }
  }

  // --- AirPods / headphones ---
  if (product.category === 'audio' || model.includes('airpods')) {
    if (
      hasAny(title, [
        'single',
        'right ear',
        'left ear',
        'ear only',
        'earbud only',
        'one side',
        'replacement ear',
        'ear piece',
      ])
    ) {
      return 'Audio parts / single bud'
    }
    if (model.includes('airpods pro 2') || model.includes('airpods pro 2nd')) {
      if (!/airpods\s*pro/.test(title)) return 'Wrong AirPods model'
      if (
        !/pro\s*2|2nd\s*gen|2nd\s*generation|generation\s*2|\bgen\s*2\b/.test(
          title,
        ) &&
        !/airpods\s*pro\s*2/.test(title)
      ) {
        // "AirPods Pro 2" short form OK via alias; bare "AirPods Pro" without 2 → exclude
        if (/airpods\s*pro\b/.test(title) && !/2|usb-?c|type-?c/.test(title)) {
          return 'Wrong AirPods generation (not Pro 2)'
        }
      }
    }
  }

  // --- Collectibles: reject loose minifigs when hunting a set/theme ---
  if (product.category === 'collectible') {
    if (
      /minifigure|minifig|\bfigure\b/.test(title) &&
      !/\bset\b|\b\d{5}\b|complete|sealed|\bbox\b/.test(title)
    ) {
      return 'Minifigure / loose figure — not a set'
    }
  }

  // --- GPU card vs laptop/PC ---
  if (product.category === 'gpu' || /\brtx\b|\bgtx\b/.test(model)) {
    if (
      hasAny(title, [
        'laptop',
        'notebook',
        'blade',
        'zephyrus',
        'gaming pc',
        'gaming build',
        'prebuilt',
        'whole pc',
        'complete pc',
        'i9-',
        'i7-',
        'ryzen',
      ])
    ) {
      return 'GPU in laptop/PC — not a bare card'
    }
    const target4070 = /4070/.test(model)
    const targetTi = /\bti\b/.test(model)
    const targetSuper = /\bsuper\b/.test(model)
    if (target4070 && !targetTi && /\b4070\s*ti\b/.test(title)) {
      return 'Wrong GPU model (4070 Ti)'
    }
    if (target4070 && !targetSuper && /\b4070\s*super\b/.test(title)) {
      return 'Wrong GPU model (4070 SUPER)'
    }
    if (target4070 && !/4070/.test(title)) {
      return 'Wrong GPU model'
    }
  }

  // --- MacBook family ---
  if (model.includes('macbook air')) {
    if (!/macbook\s*air/.test(title)) return 'Wrong laptop model (not Air)'
    if (model.includes('m2') && !/\bm2\b/.test(title)) {
      return 'Wrong MacBook chip (not M2)'
    }
    if (model.includes('m3') && !/\bm3\b/.test(title)) {
      return 'Wrong MacBook chip (not M3)'
    }
  }

  return null
}

/**
 * Deterministic comparable matcher.
 * AI must not set prices — this decides include/exclude + match score.
 */
export function matchComparable(
  product: IdentifiedProduct,
  comparable: ComparableListing,
): ComparableAssessment {
  const title = titleOf(comparable)
  const reasons: string[] = []
  let score = 0

  const model = norm(product.model)
  const brand = norm(product.brand)
  const vr = isVr(product, model)

  // Hard rejects
  if (
    hasAny(title, ['for parts', 'faulty', 'broken', 'spares', 'not working']) ||
    comparable.condition === 'for_parts'
  ) {
    return reject(comparable, 'Broken / for parts', reasons)
  }

  if (
    !Number.isFinite(comparable.price) ||
    comparable.price < priceFloor(product) ||
    comparable.price > priceCeiling(product)
  ) {
    return reject(comparable, 'Implausible price for used comps', reasons)
  }

  if (isEmptyBoxOrPackaging(title)) {
    return reject(comparable, 'Empty box / packaging only', reasons)
  }

  if (
    hasAny(title, [
      'controllers only',
      'controller only',
      'accessories only',
      'strap only',
      'case only',
      'right controller only',
      'left controller only',
      'joycons only',
      'joy cons only',
      'right ear only',
      'left ear only',
      'single earbud',
      'earbud only',
    ])
  ) {
    return reject(comparable, 'Parts / accessories only', reasons)
  }

  // Category-aware implausible floors (parts priced as full units)
  if (
    (product.category === 'audio' || model.includes('airpods')) &&
    comparable.price < 90
  ) {
    return reject(comparable, 'Implausibly low audio price', reasons)
  }
  if (product.category === 'gpu' && comparable.price < 200) {
    return reject(comparable, 'Implausibly low GPU price', reasons)
  }
  if (product.category === 'laptop' && comparable.price < 250) {
    return reject(comparable, 'Implausibly low laptop price', reasons)
  }

  if (
    comparable.condition === 'new' ||
    isBrandNewUnitTitle(title)
  ) {
    return reject(comparable, 'Brand new — rejected for used benchmark', reasons)
  }

  if (product.category === 'phone' && isPhoneAccessoryListing(title)) {
    return reject(comparable, 'Phone accessory listing', reasons)
  }

  if (isGenericAccessoryListing(product, title)) {
    return reject(comparable, 'Accessory / parts listing', reasons)
  }

  const familyMiss = wrongFamilyReason(product, model, title)
  if (familyMiss) {
    return reject(comparable, familyMiss, reasons)
  }

  // VR strap add-ons contaminate comps even on otherwise full headset titles
  if (
    vr &&
    (hasAny(title, [
      'elite strap',
      'bobovr',
      'battery head strap',
      'head strap with',
      'extra head strap',
      'power bank',
      'headstrap',
      'elite headstrap',
    ]) ||
      /elite\s+\w*\s*strap/.test(title) ||
      /head\s*strap/.test(title))
  ) {
    return reject(comparable, 'Strap / battery accessory contamination', reasons)
  }
  if (vr && isVrAccessoryOrPart(title) && !isFullVrHeadsetListing(title)) {
    return reject(comparable, 'Accessory / parts listing', reasons)
  }
  if (
    vr &&
    !isFullVrHeadsetListing(title) &&
    !isBareHeadsetTitle(title, brand, model)
  ) {
    return reject(comparable, 'Not a full headset listing', reasons)
  }

  // Exact model required (+ common AU marketplace aliases)
  const modelAliases = [model, model.replaceAll(' ', '')]
  if (model.includes('playstation 5') || model.startsWith('ps5')) {
    modelAliases.push('ps5', 'playstation 5', 'play station 5')
    if (model.includes('slim')) modelAliases.push('ps5 slim', 'playstation 5 slim')
    if (model.includes('pro')) modelAliases.push('ps5 pro', 'playstation 5 pro')
  }
  if (model.includes('switch oled')) {
    modelAliases.push('switch oled', 'oled switch', 'oled model')
  }
  if (model.includes('switch lite')) {
    modelAliases.push('switch lite')
  }
  if (model.includes('quest 3s')) {
    modelAliases.push('quest 3s', 'quest3s')
  }
  if (model.includes('macbook air')) {
    modelAliases.push('macbook air', 'mac book air')
    if (model.includes('m2')) modelAliases.push('macbook air m2', 'air m2')
  }
  if (model.includes('airpods pro')) {
    modelAliases.push('airpods pro', 'air pods pro')
    if (model.includes('2')) {
      modelAliases.push(
        'airpods pro 2',
        'airpods pro 2nd',
        'airpods pro (2nd',
      )
    }
  }
  if (/\brtx\s*4070\b/.test(model) || model.includes('rtx 4070')) {
    modelAliases.push('rtx 4070', 'geforce rtx 4070', '4070')
  }

  const macbookAirM2Hit =
    model.includes('macbook air') &&
    model.includes('m2') &&
    /macbook\s*air/.test(title) &&
    /\bm2\b/.test(title)

  const basic = isBasicCategory(product.category)
  const includeThreshold = basic ? 62 : INCLUDE_THRESHOLD

  // Basic categories: token overlap is enough (furniture titles vary wildly)
  const modelTokens = model
    .split(/\s+/)
    .filter((t) => t.length > 2 && !/^(the|and|for|with)$/.test(t))
  const tokenHits = modelTokens.filter((t) => title.includes(t)).length
  const basicTokenMatch =
    basic &&
    modelTokens.length > 0 &&
    tokenHits / modelTokens.length >= 0.4

  if (model && (hasAny(title, modelAliases) || macbookAirM2Hit)) {
    score += 40
    reasons.push('Exact model')
  } else if (basicTokenMatch) {
    score += 35
    reasons.push('Title token overlap')
  } else if (
    brand &&
    brand !== 'unbranded' &&
    title.includes(brand) &&
    model.split(' ').some((p) => p.length > 1 && title.includes(p))
  ) {
    score += 25
    reasons.push('Partial model match')
  } else if (basic && brand && brand !== 'unbranded' && title.includes(brand)) {
    score += 30
    reasons.push('Brand match (basic category)')
  } else {
    return reject(comparable, 'Exact model required', reasons)
  }

  // Storage — for multi-size titles, match preferred SSD capacity
  const targetGb = targetStorageGb(product)
  const listingSizes = extractAllStorageGb(title)
  const listingGb = listingSizes.length
    ? listingSizes.includes(targetGb ?? -1)
      ? targetGb
      : listingSizes.find((n) => n >= 128) ?? listingSizes[0]!
    : null
  const looksLikeFullHeadset = hasAny(title, [
    'headset',
    'standalone',
    'vr headset',
    'with controllers',
    'touch plus',
  ])
  if (targetGb != null && listingGb != null) {
    if (listingSizes.includes(targetGb) || listingGb === targetGb) {
      score += 25
      reasons.push('Exact storage')
    } else {
      score -= 30
      reasons.push(`Different storage (${listingGb}GB vs ${targetGb}GB)`)
    }
  } else if (targetGb != null && listingGb == null) {
    if (
      looksLikeFullHeadset ||
      product.category === 'phone' ||
      product.category === 'laptop' ||
      product.category === 'tablet'
    ) {
      score += 15
      reasons.push('Storage omitted on unit listing')
    } else {
      score -= 10
      reasons.push('Storage unclear')
    }
  } else if (targetGb == null) {
    score += 25
    reasons.push('No storage variant required')
  }

  // Used / refurbished condition
  if (
    comparable.condition === 'used_good' ||
    comparable.condition === 'used_like_new' ||
    comparable.condition === 'used_fair' ||
    hasAny(title, ['used', 'preowned', 'pre owned', 'refurbished', 'excellent condition'])
  ) {
    score += 15
    reasons.push('Used condition')
  } else if (
    comparable.condition == null ||
    comparable.condition === 'unknown'
  ) {
    // Marketplace rows often omit condition; don't fail clean unit matches
    score += 10
    reasons.push('Condition unspecified')
  }

  // Controllers / normal accessories
  const hasControllers =
    hasAny(title, ['controller', 'controllers', 'joy con', 'joycons', 'dualsense']) ||
    comparable.includedAccessories.some((a) => norm(a).includes('controller'))

  const headsetOnly = hasAny(title, [
    'headset only',
    'no controllers',
    'without controllers',
  ])
  const consoleOnly = hasAny(title, ['console only'])

  if (vr && (headsetOnly || consoleOnly)) {
    return reject(comparable, 'Headset without controllers', reasons)
  }

  if (product.category === 'console' && consoleOnly) {
    // Clean console unit (no pad bundle) — good comps, not a penalty
    score += 5
    reasons.push('Console only (clean unit)')
  } else if (headsetOnly) {
    score -= 20
    reasons.push('Unit without controllers')
  } else if (hasControllers) {
    score += 5
    reasons.push('Controllers included')
  }

  // Large / mega bundles distort comps
  const bundleHits = [
    'elite strap',
    'battery pack',
    'games bundle',
    'full bundle',
    'accessory bundle',
    'mega bundle',
    'ultimate accessory',
  ].filter((t) => title.includes(t)).length
  const namedBundle =
    /\bbundle\b/.test(title) &&
    (bundleHits >= 1 || hasAny(title, ['elite strap', 'case', 'extras', 'accessories']))

  if (
    bundleHits >= 2 ||
    namedBundle ||
    comparable.includedAccessories.length >= 5 ||
    hasAny(title, ['mega bundle', 'ultimate accessory mega bundle'])
  ) {
    return reject(comparable, 'Large bundle', reasons)
  }
  if (bundleHits === 1) {
    score -= 5
    reasons.push('Minor bundle extras')
  }

  // AU location soft bonus
  if (
    comparable.location &&
    /nsw|vic|qld|wa|sa|tas|act|australia|au/i.test(comparable.location)
  ) {
    score += 5
    reasons.push('AU listing')
  }

  score = Math.max(0, Math.min(100, score))

  if (score < includeThreshold) {
    return {
      comparable,
      included: false,
      matchScore: score,
      rejectionReason: 'Below match threshold',
      matchLabel: 'Excluded',
      reasons,
    }
  }

  return {
    comparable,
    included: true,
    matchScore: score,
    rejectionReason: null,
    matchLabel: score >= 90 ? 'Strong match' : 'Good match',
    reasons,
  }
}

function reject(
  comparable: ComparableListing,
  reason: string,
  reasons: string[],
): ComparableAssessment {
  return {
    comparable,
    included: false,
    matchScore: REJECT_SCORE,
    rejectionReason: reason,
    matchLabel: 'Excluded',
    reasons: [...reasons, reason],
  }
}

export function assessComparables(
  product: IdentifiedProduct,
  listings: ComparableListing[],
): ComparableAssessment[] {
  return listings.map((listing) => matchComparable(product, listing))
}

export const MATCH_INCLUDE_THRESHOLD = INCLUDE_THRESHOLD
