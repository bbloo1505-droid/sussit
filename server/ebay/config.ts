export type EbayEnvironment = 'sandbox' | 'production'

export function ebayConfig() {
  const clientId = process.env.EBAY_CLIENT_ID?.trim() ?? ''
  const clientSecret = process.env.EBAY_CLIENT_SECRET?.trim() ?? ''
  const environment = (process.env.EBAY_ENVIRONMENT?.trim() ??
    'production') as EbayEnvironment

  // Sandbox has almost no EBAY_AU inventory — default US for integration testing.
  // Production SussIt must use EBAY_AU.
  const marketplaceId =
    process.env.EBAY_MARKETPLACE_ID?.trim() ||
    (environment === 'sandbox' ? 'EBAY_US' : 'EBAY_AU')

  const scope =
    process.env.EBAY_OAUTH_SCOPE?.trim() ||
    'https://api.ebay.com/oauth/api_scope'

  const itemLocationCountry =
    process.env.EBAY_ITEM_LOCATION_COUNTRY?.trim() ||
    (environment === 'sandbox'
      ? marketplaceId === 'EBAY_AU'
        ? 'AU'
        : 'US'
      : 'AU')

  return {
    clientId,
    clientSecret,
    environment,
    marketplaceId,
    itemLocationCountry,
    scope,
    configured: Boolean(clientId && clientSecret),
    isSandbox: environment === 'sandbox',
  }
}

export function ebayApiHost(environment: EbayEnvironment): string {
  return environment === 'sandbox'
    ? 'https://api.sandbox.ebay.com'
    : 'https://api.ebay.com'
}
