# eBay Marketplace Account Deletion / Closure

SussIt **does persist** eBay Browse listing data (sessionStorage + Supabase
`listing_observations`). We therefore do **not** claim eBay’s
“not persisting eBay data” exemption, and we implement this notification endpoint.

## Endpoint

`GET|POST /api/ebay/account-deletion`

### GET — challenge verification

eBay sends `?challenge_code=...`. Response:

```json
{ "challengeResponse": "<sha256 hex>" }
```

Hash input (exact order): `challengeCode + verificationToken + endpoint`

### POST — account deletion notification

Expects `metadata.topic === "MARKETPLACE_ACCOUNT_DELETION"`.

**Schema audit:** persisted eBay rows store listing fields only
(item id, title, price, url, condition, location, dates, qty signals).
They do **not** store seller `username`, `userId`, or `eiasToken`.

Deletion handler therefore takes action `NO_LINKABLE_DATA`: acknowledge 200,
log a non-reversible identifier fingerprint, delete nothing (including no
unrelated SussIt user data).

## Environment variables (server-only)

| Variable | Purpose |
|----------|---------|
| `EBAY_DELETION_VERIFICATION_TOKEN` | 32–80 chars `[A-Za-z0-9_-]`; same value entered in eBay portal |
| `EBAY_DELETION_ENDPOINT` | Exact public HTTPS URL registered with eBay |

## Production vs local

| Environment | Implementation |
|-------------|----------------|
| **Production (Vercel)** | `api/ebay/account-deletion.ts` — real Vercel Function (self-contained) |
| **Local Vite** | `vite-plugin-api.ts` → `server/handleEbayAccountDeletion.ts` |

`vercel.json` rewrites SPA routes to `index.html` but **excludes** `/api/*` so functions are not swallowed.

## Production URL to paste into eBay

```
https://sussit.vercel.app/api/ebay/account-deletion
```

`EBAY_DELETION_ENDPOINT` must match that string **exactly** (scheme, host, path, no trailing slash unless registered with one).
