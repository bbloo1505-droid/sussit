import { ebayConfig } from './ebay/config.ts'

export type StatusResponse = {
  ok: true
  services: {
    openai: { configured: boolean; model: string }
    ebay: {
      configured: boolean
      environment: string
      marketplaceId: string
    }
    supabase: { configured: boolean }
  }
  readyFor: {
    liveExtract: boolean
    liveComps: boolean
    /** True when Browse returns sandbox US test data (not AU production) */
    ebaySandboxOnly: boolean
    persistence: boolean
  }
}

export function handleStatus(): StatusResponse {
  const openaiKey = Boolean(process.env.OPENAI_API_KEY?.trim())
  const ebay = ebayConfig()
  const supabaseConfigured = Boolean(
    process.env.VITE_SUPABASE_URL?.trim() &&
      (process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
        process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
  )

  return {
    ok: true,
    services: {
      openai: {
        configured: openaiKey,
        model: process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini',
      },
      ebay: {
        configured: ebay.configured,
        environment: ebay.environment,
        marketplaceId: ebay.marketplaceId,
      },
      supabase: { configured: supabaseConfigured },
    },
    readyFor: {
      liveExtract: openaiKey,
      liveComps: ebay.configured && !ebay.isSandbox,
      ebaySandboxOnly: ebay.configured && ebay.isSandbox,
      persistence: supabaseConfigured,
    },
  }
}
