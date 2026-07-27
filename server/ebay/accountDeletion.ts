import { createHash } from 'node:crypto'

/**
 * eBay Marketplace Account Deletion challenge response.
 * Hash MUST be SHA-256(challengeCode + verificationToken + endpoint) in that order.
 */
export function buildEbayChallengeResponse(input: {
  challengeCode: string
  verificationToken: string
  endpoint: string
}): string {
  return createHash('sha256')
    .update(input.challengeCode, 'utf8')
    .update(input.verificationToken, 'utf8')
    .update(input.endpoint, 'utf8')
    .digest('hex')
}

export function getEbayDeletionEnv(): {
  verificationToken: string | null
  endpoint: string | null
} {
  return {
    verificationToken:
      process.env.EBAY_DELETION_VERIFICATION_TOKEN?.trim() || null,
    endpoint: process.env.EBAY_DELETION_ENDPOINT?.trim() || null,
  }
}

export type EbayDeletionIdentifiers = {
  username: string | null
  userId: string | null
  eiasToken: string | null
}

/**
 * Schema audit (20260727_sell_speed):
 * listing_observations / listing_lifecycles store eBay *listing* fields
 * (item id, title, price, url, condition, location, dates) — NOT seller
 * username, userId, or eiasToken. Client persist omits `raw` jsonb entirely.
 *
 * Therefore a MARKETPLACE_ACCOUNT_DELETION notification cannot be linked
 * to any persisted SussIt row today. We acknowledge and log receipt only.
 */
export async function handleEbayAccountDeletionData(
  identifiers: EbayDeletionIdentifiers,
  meta: { notificationId: string | null; topic: string },
): Promise<{
  action: 'NO_LINKABLE_DATA'
  reason: string
}> {
  const fingerprint = fingerprintIdentifiers(identifiers)
  console.info('[ebay/account-deletion] processed', {
    topic: meta.topic,
    notificationId: meta.notificationId,
    identifierFingerprint: fingerprint,
    action: 'NO_LINKABLE_DATA',
  })

  return {
    action: 'NO_LINKABLE_DATA',
    reason:
      'Persisted eBay data is listing-scoped (item id/title/price/url/etc.) and does not include seller username, userId, or eiasToken — nothing to delete for this notification.',
  }
}

/** Non-reversible short fingerprint for logs — not the raw PII. */
export function fingerprintIdentifiers(
  identifiers: EbayDeletionIdentifiers,
): string {
  const material = [
    identifiers.username ?? '',
    identifiers.userId ?? '',
    identifiers.eiasToken ?? '',
  ].join('|')
  return createHash('sha256').update(material, 'utf8').digest('hex').slice(0, 12)
}
