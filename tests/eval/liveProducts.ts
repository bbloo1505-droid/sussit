/**
 * Controlled live-eval SKU universe — wider than the offline adversarial core.
 * Captures store these fields so scoring does not require EVAL_CATALOG entries.
 *
 * Includes full / emerging / basic categories so universal intake is exercised
 * against real EBAY_AU USED inventory.
 */
export type LiveEvalProduct = {
  brand: string
  model: string
  variant: string | null
  category:
    | 'phone'
    | 'console'
    | 'vr_headset'
    | 'camera'
    | 'laptop'
    | 'tablet'
    | 'wearable'
    | 'audio'
    | 'gpu'
    | 'power_tool'
    | 'furniture'
    | 'clothing'
    | 'jewellery'
    | 'collectible'
    | 'other'
  skuKey: string
  /** Rough AU used mid for display only */
  typicalAsk: number
}

export const LIVE_EVAL_PRODUCTS: LiveEvalProduct[] = [
  // --- full: VR ---
  {
    skuKey: 'quest-3',
    brand: 'Meta',
    model: 'Quest 3',
    variant: '512GB',
    category: 'vr_headset',
    typicalAsk: 750,
  },
  {
    skuKey: 'quest-3s',
    brand: 'Meta',
    model: 'Quest 3S',
    variant: '128GB',
    category: 'vr_headset',
    typicalAsk: 450,
  },
  {
    skuKey: 'quest-2',
    brand: 'Meta',
    model: 'Quest 2',
    variant: '128GB',
    category: 'vr_headset',
    typicalAsk: 280,
  },

  // --- full: consoles ---
  {
    skuKey: 'ps5-slim',
    brand: 'Sony',
    model: 'PlayStation 5 Slim',
    variant: 'Disc',
    category: 'console',
    typicalAsk: 580,
  },
  {
    skuKey: 'ps5-pro',
    brand: 'Sony',
    model: 'PlayStation 5 Pro',
    variant: null,
    category: 'console',
    typicalAsk: 850,
  },
  {
    skuKey: 'ps5-digital',
    brand: 'Sony',
    model: 'PlayStation 5 Slim',
    variant: 'Digital',
    category: 'console',
    typicalAsk: 550,
  },
  {
    skuKey: 'switch-oled',
    brand: 'Nintendo',
    model: 'Switch OLED',
    variant: null,
    category: 'console',
    typicalAsk: 380,
  },
  {
    skuKey: 'switch-lite',
    brand: 'Nintendo',
    model: 'Switch Lite',
    variant: null,
    category: 'console',
    typicalAsk: 180,
  },
  {
    skuKey: 'xbox-series-x',
    brand: 'Microsoft',
    model: 'Xbox Series X',
    variant: null,
    category: 'console',
    typicalAsk: 520,
  },
  {
    skuKey: 'xbox-series-s',
    brand: 'Microsoft',
    model: 'Xbox Series S',
    variant: null,
    category: 'console',
    typicalAsk: 320,
  },
  {
    skuKey: 'steam-deck',
    brand: 'Valve',
    model: 'Steam Deck',
    variant: '512GB',
    category: 'console',
    typicalAsk: 550,
  },
  {
    skuKey: 'ps4-pro',
    brand: 'Sony',
    model: 'PlayStation 4 Pro',
    variant: null,
    category: 'console',
    typicalAsk: 250,
  },

  // --- full: phones ---
  {
    skuKey: 'iphone-15-128',
    brand: 'Apple',
    model: 'iPhone 15',
    variant: '128GB',
    category: 'phone',
    typicalAsk: 720,
  },
  {
    skuKey: 'iphone-15-pro',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    variant: '256GB',
    category: 'phone',
    typicalAsk: 980,
  },
  {
    skuKey: 'iphone-16',
    brand: 'Apple',
    model: 'iPhone 16',
    variant: '128GB',
    category: 'phone',
    typicalAsk: 980,
  },
  {
    skuKey: 'galaxy-s24',
    brand: 'Samsung',
    model: 'Galaxy S24',
    variant: '128GB',
    category: 'phone',
    typicalAsk: 750,
  },
  {
    skuKey: 'pixel-8',
    brand: 'Google',
    model: 'Pixel 8',
    variant: '128GB',
    category: 'phone',
    typicalAsk: 580,
  },
  {
    skuKey: 'iphone-14',
    brand: 'Apple',
    model: 'iPhone 14',
    variant: '128GB',
    category: 'phone',
    typicalAsk: 580,
  },
  {
    skuKey: 'galaxy-s23',
    brand: 'Samsung',
    model: 'Galaxy S23',
    variant: '128GB',
    category: 'phone',
    typicalAsk: 520,
  },

  // --- emerging: camera ---
  {
    skuKey: 'sony-a7iii',
    brand: 'Sony',
    model: 'A7 III',
    variant: 'body',
    category: 'camera',
    typicalAsk: 1400,
  },
  {
    skuKey: 'canon-r6',
    brand: 'Canon',
    model: 'EOS R6',
    variant: 'body',
    category: 'camera',
    typicalAsk: 1800,
  },
  {
    skuKey: 'gopro-hero12',
    brand: 'GoPro',
    model: 'Hero 12',
    variant: null,
    category: 'camera',
    typicalAsk: 380,
  },
  {
    skuKey: 'dji-mini-3',
    brand: 'DJI',
    model: 'Mini 3',
    variant: null,
    category: 'camera',
    typicalAsk: 550,
  },

  // --- emerging: laptop ---
  {
    skuKey: 'macbook-air-m2',
    brand: 'Apple',
    model: 'MacBook Air M2',
    variant: '8GB 256GB',
    category: 'laptop',
    typicalAsk: 1100,
  },
  {
    skuKey: 'thinkpad-t14',
    brand: 'Lenovo',
    model: 'ThinkPad T14',
    variant: null,
    category: 'laptop',
    typicalAsk: 650,
  },

  // --- emerging: tablet ---
  {
    skuKey: 'ipad-air-m2',
    brand: 'Apple',
    model: 'iPad Air',
    variant: 'M2 128GB',
    category: 'tablet',
    typicalAsk: 750,
  },

  // --- emerging: wearable ---
  {
    skuKey: 'apple-watch-series-9',
    brand: 'Apple',
    model: 'Watch Series 9',
    variant: '45mm GPS',
    category: 'wearable',
    typicalAsk: 420,
  },

  // --- emerging: audio ---
  {
    skuKey: 'airpods-pro-2',
    brand: 'Apple',
    model: 'AirPods Pro 2',
    variant: null,
    category: 'audio',
    typicalAsk: 280,
  },
  {
    skuKey: 'sony-wh1000xm5',
    brand: 'Sony',
    model: 'WH-1000XM5',
    variant: null,
    category: 'audio',
    typicalAsk: 320,
  },
  {
    skuKey: 'bose-qc45',
    brand: 'Bose',
    model: 'QuietComfort 45',
    variant: null,
    category: 'audio',
    typicalAsk: 250,
  },

  // --- emerging: gpu ---
  {
    skuKey: 'rtx-4070',
    brand: 'NVIDIA',
    model: 'RTX 4070',
    variant: null,
    category: 'gpu',
    typicalAsk: 750,
  },
  {
    skuKey: 'rtx-4060',
    brand: 'NVIDIA',
    model: 'RTX 4060',
    variant: null,
    category: 'gpu',
    typicalAsk: 450,
  },
  {
    skuKey: 'rtx-3080',
    brand: 'NVIDIA',
    model: 'RTX 3080',
    variant: null,
    category: 'gpu',
    typicalAsk: 550,
  },

  // --- emerging: power tool ---
  {
    skuKey: 'makita-impact',
    brand: 'Makita',
    model: 'DTD172',
    variant: '18V',
    category: 'power_tool',
    typicalAsk: 220,
  },

  // --- basic: furniture / clothing / jewellery / collectibles ---
  {
    skuKey: 'ikea-kivik',
    brand: 'IKEA',
    model: 'Kivik',
    variant: null,
    category: 'furniture',
    typicalAsk: 450,
  },
  {
    skuKey: 'ikea-malm',
    brand: 'IKEA',
    model: 'Malm',
    variant: null,
    category: 'furniture',
    typicalAsk: 180,
  },
  {
    skuKey: 'nike-air-force-1',
    brand: 'Nike',
    model: 'Air Force 1',
    variant: null,
    category: 'clothing',
    typicalAsk: 120,
  },
  {
    skuKey: 'adidas-samba',
    brand: 'Adidas',
    model: 'Samba',
    variant: null,
    category: 'clothing',
    typicalAsk: 100,
  },
  {
    skuKey: 'jordan-1',
    brand: 'Nike',
    model: 'Air Jordan 1',
    variant: null,
    category: 'clothing',
    typicalAsk: 220,
  },
  {
    skuKey: 'lego-75192',
    brand: 'LEGO',
    model: '75192',
    variant: 'Millennium Falcon',
    category: 'collectible',
    typicalAsk: 900,
  },
  {
    skuKey: 'lego-75313',
    brand: 'LEGO',
    model: '75313',
    variant: 'AT-AT',
    category: 'collectible',
    typicalAsk: 220,
  },
  {
    skuKey: 'pandora-charm',
    brand: 'Pandora',
    model: 'Charm',
    variant: null,
    category: 'jewellery',
    typicalAsk: 80,
  },
  {
    skuKey: 'dyson-v8',
    brand: 'Dyson',
    model: 'V8',
    variant: null,
    category: 'other',
    typicalAsk: 280,
  },
]
