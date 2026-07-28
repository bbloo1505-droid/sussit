import type { IdentifiedProduct } from '@/types/domain'
import {
  IPHONE14_128_PRODUCT_ID,
  PS5_DISC_PRODUCT_ID,
  QUEST_PRODUCT_ID,
  SWITCH_OLED_PRODUCT_ID,
  XBOX_SERIES_X_PRODUCT_ID,
} from '@/lib/sellSpeed/seedQuestLifecycle'

export function canonicalProductId(product: IdentifiedProduct): string {
  const brand = product.brand.toUpperCase().replace(/\s+/g, '_')
  const model = product.model.toUpperCase().replace(/\s+/g, '_')
  const variant = (product.variant ?? 'BASE').toUpperCase().replace(/\s+/g, '')
  const id = `${brand}_${model}_${variant}`
  const hay = `${brand} ${model} ${variant}`.toLowerCase()

  if (
    hay.includes('quest') &&
    hay.includes('3') &&
    (variant.includes('512') || product.variant?.includes('512'))
  ) {
    return QUEST_PRODUCT_ID
  }
  if (hay.includes('switch') && hay.includes('oled')) {
    return SWITCH_OLED_PRODUCT_ID
  }
  if (hay.includes('iphone') && hay.includes('14') && hay.includes('128')) {
    return IPHONE14_128_PRODUCT_ID
  }
  if (
    (hay.includes('playstation') || hay.includes('ps5')) &&
    (hay.includes('disc') || !hay.includes('digital'))
  ) {
    return PS5_DISC_PRODUCT_ID
  }
  if (hay.includes('xbox') && hay.includes('series') && hay.includes('x')) {
    return XBOX_SERIES_X_PRODUCT_ID
  }

  return id
}
