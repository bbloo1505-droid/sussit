# eBay Browse API (AU comps + hunt polling)

Day-one path for live Australian asking comps. Does **not** replace Marketplace Insights sold history.

## Setup

1. Create an app at https://developer.ebay.com/my/keys  
2. Copy **App ID (Client ID)** and **Cert ID (Client Secret)** into `.env`:

```bash
EBAY_CLIENT_ID=
EBAY_CLIENT_SECRET=
EBAY_ENVIRONMENT=production
EBAY_MARKETPLACE_ID=EBAY_AU
EBAY_OAUTH_SCOPE=https://api.ebay.com/oauth/api_scope
```

3. Restart `npm run dev`.

Without keys, SussIt falls back to fixture comps and shows a note on Flip refresh.

## Endpoints

| Route | Purpose |
|-------|---------|
| `POST /api/comps` | Search used AU fixed-price listings for brand/model/variant |
| `GET\|POST /api/ebay/account-deletion` | Marketplace Account Deletion (see `docs/ebay-account-deletion.md`) |

Client `createPricingProvider()` prefers live Browse results, then fixtures.

Production function: `api/comps.ts` (self-contained Vercel Function).
Local Vite: `server/handleComps.ts` via middleware when wired.


## Sandbox vs Production

| | Sandbox | Production |
|--|---------|------------|
| Keys | `SBX-…` | `PRD-…` |
| Host | `api.sandbox.ebay.com` | `api.ebay.com` |
| Inventory | Fake/US test data | Real ebay.com.au |
| SussIt config | `EBAY_ENVIRONMENT=sandbox` + `EBAY_MARKETPLACE_ID=EBAY_US` | `production` + `EBAY_AU` |

Sandbox Browse works for integration testing but is **not** Australian market data. Create a Production keyset for real AU comps.

## Next

- Apply for Marketplace Insights Limited Release (90-day sold history)
- Persist observations to Supabase from poll jobs / cron
