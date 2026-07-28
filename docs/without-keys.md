# Building without API keys

SussIt is designed to keep progressing while OpenAI / eBay / Supabase keys are pending.

## What works offline

| Feature | How |
|---------|-----|
| Free homepage | Screenshot falls back to Quest demo; **paste text** uses free heuristic extract |
| Valuation / Max Buy / Flip Score | Fixture comps + seeded lifecycle data |
| Hunt board | `/flip` demo unlock — 5 V0 SKUs including Xbox Series X |
| Confirmed sales | Log flips → `CONFIRMED_SOLD` training signal |
| Relist copy | Deterministic listing text from Flip numbers |
| Sales history | `/flip/history` |
| Benchmark | `npm run test:benchmark` |
| Setup status | Home page `/api/status` |

## Paste extract (no OpenAI)

Paste text that includes a `$` price and a known V0 product, e.g.:

```
Meta Quest 3 512GB $520 Sydney used with controllers
```

## When keys arrive

1. `OPENAI_API_KEY` → live screenshot extract  
2. `EBAY_CLIENT_ID` + `EBAY_CLIENT_SECRET` → live AU comps (`docs/ebay-browse.md`)  
3. Supabase URL + keys → replace session stores (stub already in `src/lib/supabase/client.ts`)

```bash
npm run poll:hunt   # needs npm run dev + eBay keys for live data
```
