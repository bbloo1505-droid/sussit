import { createHash } from 'node:crypto'

/**
 * Production Vercel Function: /api/ebay/account-deletion
 *
 * Self-contained (no local .ts imports) so Vercel Node runtime can load it
 * reliably. Local Vite middleware uses server/handleEbayAccountDeletion.ts.
 */

type Req = {
  method?: string
  url?: string
  query?: Record<string, string | string[] | undefined>
  body?: unknown
}

type Res = {
  status: (code: number) => Res
  json: (body: unknown) => void
  setHeader: (name: string, value: string) => void
}

function queryParam(
  req: Req,
  key: string,
): string | null {
  const fromQuery = req.query?.[key]
  if (Array.isArray(fromQuery)) return fromQuery[0] ?? null
  if (typeof fromQuery === 'string') return fromQuery

  if (req.url) {
    try {
      const path = req.url.startsWith('http')
        ? req.url
        : `https://sussit.vercel.app${req.url}`
      return new URL(path).searchParams.get(key)
    } catch {
      return null
    }
  }
  return null
}

function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex')
}

function buildChallengeResponse(
  challengeCode: string,
  verificationToken: string,
  endpoint: string,
): string {
  // Exact concatenation — no separators, spaces, or newlines.
  return sha256Hex(challengeCode + verificationToken + endpoint)
}

function fingerprintIdentifiers(data: {
  username: string | null
  userId: string | null
  eiasToken: string | null
}): string {
  return sha256Hex(
    `${data.username ?? ''}|${data.userId ?? ''}|${data.eiasToken ?? ''}`,
  ).slice(0, 12)
}

function handleGet(req: Req): { status: number; body: unknown } {
  const challengeCode = queryParam(req, 'challenge_code')
  if (!challengeCode) {
    return {
      status: 400,
      body: { ok: false, error: 'Missing challenge_code query parameter' },
    }
  }

  const verificationToken =
    process.env.EBAY_DELETION_VERIFICATION_TOKEN?.trim() || null
  const endpoint = process.env.EBAY_DELETION_ENDPOINT?.trim() || null

  if (!verificationToken || !endpoint) {
    console.error(
      '[ebay/account-deletion] Missing EBAY_DELETION_VERIFICATION_TOKEN or EBAY_DELETION_ENDPOINT',
    )
    return {
      status: 500,
      body: { ok: false, error: 'Deletion endpoint not configured' },
    }
  }

  return {
    status: 200,
    body: {
      challengeResponse: buildChallengeResponse(
        challengeCode,
        verificationToken,
        endpoint,
      ),
    },
  }
}

function handlePost(body: unknown): { status: number; body: unknown } {
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
  const identifiers = {
    username: typeof data.username === 'string' ? data.username : null,
    userId: typeof data.userId === 'string' ? data.userId : null,
    eiasToken: typeof data.eiasToken === 'string' ? data.eiasToken : null,
  }

  const notificationId =
    typeof notification?.notificationId === 'string'
      ? notification.notificationId
      : null

  // Schema audit: we do not store username/userId/eiasToken — no deletion.
  // Log fingerprint only (never raw identifiers).
  console.info('[ebay/account-deletion] processed', {
    topic,
    notificationId,
    identifierFingerprint: fingerprintIdentifiers(identifiers),
    action: 'NO_LINKABLE_DATA',
  })

  return {
    status: 200,
    body: {
      ok: true,
      topic,
      action: 'NO_LINKABLE_DATA',
    },
  }
}

export default function handler(req: Req, res: Res) {
  const method = (req.method ?? 'GET').toUpperCase()

  let result: { status: number; body: unknown }
  if (method === 'GET') {
    result = handleGet(req)
  } else if (method === 'POST') {
    result = handlePost(req.body)
  } else {
    result = { status: 405, body: { ok: false, error: 'Method not allowed' } }
  }

  res.setHeader('Content-Type', 'application/json')
  res.status(result.status).json(result.body)
}
