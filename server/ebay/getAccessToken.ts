import { ebayApiHost, ebayConfig } from './config.ts'

type TokenCache = {
  accessToken: string
  expiresAtMs: number
}

let cache: TokenCache | null = null

/** Application token via client credentials. Cached until near expiry. */
export async function getEbayAccessToken(): Promise<string> {
  const cfg = ebayConfig()
  if (!cfg.configured) {
    throw new Error('MISSING_EBAY_KEYS')
  }

  const now = Date.now()
  if (cache && cache.expiresAtMs > now + 60_000) {
    return cache.accessToken
  }

  const host = ebayApiHost(cfg.environment)
  const basic = Buffer.from(`${cfg.clientId}:${cfg.clientSecret}`).toString(
    'base64',
  )
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: cfg.scope,
  })

  const res = await fetch(`${host}/identity/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`EBAY_TOKEN_FAILED:${res.status}:${text.slice(0, 200)}`)
  }

  const json = (await res.json()) as {
    access_token: string
    expires_in: number
  }

  cache = {
    accessToken: json.access_token,
    expiresAtMs: now + json.expires_in * 1000,
  }

  return cache.accessToken
}
