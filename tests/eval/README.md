# SussIt Eval Lab

Offline-first automated evaluation for identification, comparable matching,
valuation sanity, and verdict consistency.

## Commands

- `npm run eval` — full offline suite (≥10k deterministic cases). No live eBay.
- `npm run eval:live` — optional capped/rate-limited Browse API capture. Never CI.

## Layout

- `fixtures/` — saved eBay Browse JSON for replay
- `golden/` — hand-authored expected cases
- `adversarial/` — adversarial coverage manifest
- `generate/` — deterministic case generators (seed `20260727`)
- `evaluate/` — runners against current production algorithms (read-only)
- `results/` — `eval-results.json` + `eval-results.html` + history

## Safety

Does not mutate production valuation algorithms, Supabase data, or expose secrets.
Live mode refuses to run when `CI` / `GITHUB_ACTIONS` is set.
