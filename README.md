# SussIt

Know before you buy.

Australian mobile-first second-hand buying app.

- **Free:** homepage screenshot / paste → “Should I buy this?”
- **SussIt Flip (subscription):** `/flip` hunt catalogue, Max Buy, sell speed — *Find it cheap. Flip it fast.*

Works **without API keys** (fixtures + paste heuristic). See [docs/without-keys.md](docs/without-keys.md).

Demo unlock Flip locally via **Activate Flip (demo)** on `/flip` (Stripe later).

## Develop

```bash
npm install
cp .env.example .env   # optional until keys arrive
npm run dev
npm test
npm run test:benchmark
```

| Variable | Needed for |
|----------|------------|
| `OPENAI_API_KEY` | Live screenshot extract (paste works free) |
| `EBAY_CLIENT_ID` / `EBAY_CLIENT_SECRET` | Live AU comps |
| Supabase keys | Cloud persistence (optional) |

See [docs/ebay-browse.md](docs/ebay-browse.md). Without eBay keys, comps use fixtures.
