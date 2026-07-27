import { z } from 'zod'

export const extractedListingSchema = z.object({
  category: z.enum([
    'phone',
    'console',
    'vr_headset',
    'camera',
    'laptop',
    'unknown',
  ]),
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
  refused: z.boolean(),
  refusalReason: z.string().nullable(),
})

export type ExtractedListing = z.infer<typeof extractedListingSchema>

export const V0_CATEGORIES = new Set(['phone', 'console', 'vr_headset'])
