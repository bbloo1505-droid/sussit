import { z } from 'zod'

export const PRODUCT_CATEGORIES = [
  'phone',
  'console',
  'vr_headset',
  'camera',
  'laptop',
  'tablet',
  'wearable',
  'audio',
  'gpu',
  'power_tool',
  'furniture',
  'clothing',
  'vehicle',
  'jewellery',
  'collectible',
  'other',
  'unknown',
] as const

export const extractedListingSchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  variant: z.string().nullable(),
  askingPrice: z.number().nullable(),
  currency: z.literal('AUD').nullable(),
  condition: z
    .enum([
      'new',
      'used_like_new',
      'used_good',
      'used_fair',
      'for_parts',
      'unknown',
    ])
    .nullable(),
  location: z.string().nullable(),
  includedAccessories: z.array(z.string()),
  missingInformation: z.array(z.string()),
  sellerClaims: z.array(z.string()),
  visibleIssues: z.array(z.string()),
  identificationConfidence: z.number().min(0).max(1),
  /** Only true when brand/model/price cannot be extracted at all */
  refused: z.boolean(),
  refusalReason: z.string().nullable(),
})

export type ExtractedListing = z.infer<typeof extractedListingSchema>

/** @deprecated use intelligence tiers — kept for older call sites */
export const V0_CATEGORIES = new Set(['phone', 'console', 'vr_headset'])
