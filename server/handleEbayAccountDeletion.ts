import {
  buildEbayChallengeResponse,
  getEbayDeletionEnv,
  handleEbayAccountDeletionData,
  type EbayDeletionIdentifiers,
} from './ebay/accountDeletion.ts'

export type AccountDeletionHttpResult = {
  status: number
  body: unknown
}

/**
 * GET — eBay endpoint verification challenge.
 * POST — MARKETPLACE_ACCOUNT_DELETION notification.
 */
export async function handleEbayAccountDeletionRequest(input: {
  method: string
  challengeCode?: string | null
  body?: unknown
}): Promise<AccountDeletionHttpResult> {
  const method = input.method.toUpperCase()

  if (method === 'GET') {
    return handleChallengeGet(input.challengeCode)
  }

  if (method === 'POST') {
    return await handleDeletionPost(input.body)
  }

  return { status: 405, body: { ok: false, error: 'Method not allowed' } }
}

function handleChallengeGet(
  challengeCode: string | null | undefined,
): AccountDeletionHttpResult {
  if (!challengeCode) {
    return {
      status: 400,
      body: { ok: false, error: 'Missing challenge_code query parameter' },
    }
  }

  const { verificationToken, endpoint } = getEbayDeletionEnv()
  if (!verificationToken || !endpoint) {
    console.error(
      '[ebay/account-deletion] Missing EBAY_DELETION_VERIFICATION_TOKEN or EBAY_DELETION_ENDPOINT',
    )
    return {
      status: 500,
      body: { ok: false, error: 'Deletion endpoint not configured' },
    }
  }

  const challengeResponse = buildEbayChallengeResponse({
    challengeCode,
    verificationToken,
    endpoint,
  })

  return {
    status: 200,
    body: { challengeResponse },
  }
}

async function handleDeletionPost(
  body: unknown,
): Promise<AccountDeletionHttpResult> {
  if (body == null || typeof body !== 'object') {
    return { status: 400, body: { ok: false, error: 'Malformed JSON payload' } }
  }

  const payload = body as Record<string, unknown>
  const metadata = payload.metadata as Record<string, unknown> | undefined
  const notification = payload.notification as Record<string, unknown> | undefined

  if (!metadata || typeof metadata.topic !== 'string') {
    return {
      status: 400,
      body: { ok: false, error: 'Malformed payload: missing metadata.topic' },
    }
  }

  const topic = metadata.topic
  if (topic !== 'MARKETPLACE_ACCOUNT_DELETION') {
    console.warn('[ebay/account-deletion] unexpected topic', { topic })
    return {
      status: 400,
      body: { ok: false, error: `Unexpected notification topic: ${topic}` },
    }
  }

  const data = (notification?.data ?? {}) as Record<string, unknown>
  const identifiers: EbayDeletionIdentifiers = {
    username: typeof data.username === 'string' ? data.username : null,
    userId: typeof data.userId === 'string' ? data.userId : null,
    eiasToken: typeof data.eiasToken === 'string' ? data.eiasToken : null,
  }

  const notificationId =
    typeof notification?.notificationId === 'string'
      ? notification.notificationId
      : null

  // Deletion work is intentionally a no-op until we store linkable seller IDs.
  // Keep it awaited so logs flush before the 2xx ack (handler is fast).
  const result = await handleEbayAccountDeletionData(identifiers, {
    notificationId,
    topic,
  })

  return {
    status: 200,
    body: {
      ok: true,
      topic,
      action: result.action,
    },
  }
}
