# Sell speed & Flip intelligence

Pricing accuracy remains the product. Sell speed is **observed**, never guessed by an LLM.

## Product tiers

- **Free homepage (`/`):** Should I buy this? — screenshot / paste listing analysis.
- **SussIt Flip (`/flip`):** subscription unlocks hunt catalogue, Max Buy, sell speed.

Signature Flip metric: **MAX BUY** — highest purchase price that still hits the reseller’s min profit and min ROI after a fee buffer.

Flip listing detail returns **BUY / NEGOTIATE / PASS** against that Max Buy.

## Signals (honest)

| Signal | Meaning |
|--------|---------|
| `CONFIRMED_SOLD` | Sold quantity increased, or user reported a sale |
| `DISAPPEARED` | Listing no longer returned / UNAVAILABLE — **not** a confirmed sale |
| `ACTIVE` | Still listed |

UI copy must say “observed disappearance” unless evidence is confirmed sales.

Until Marketplace Insights (sold history) is approved:

- Say **typical asking / estimated resale from comps**, not “average sold price”.
- Sell-through from lifecycle = **observed movement**, not Terapeak %.

## Data sources

| Source | Role |
|--------|------|
| Browse API | Day-one AU active comps + lifecycle polling |
| Marketplace Insights API | Limited Release — 90-day sold history (apply via Buy APIs Requirements) |
| Seller Hub Product Research / Terapeak | UI only for Pro sellers — **not** an API SussIt can call |
| Scrapers | Out of scope for core product |

## Day-one collection (no Feed / Insights required)

1. Poll Browse search for a product set every few hours.
2. Snapshot `external_id`, price, availability, sold qty.
3. Diff item IDs → new / still active / missing.
4. Apply for Marketplace Insights Limited Release in parallel.

## Schema

See `supabase/migrations/20260727_sell_speed.sql`.

## Flip Score inputs

Margin/ROI + sell speed + liquidity + valuation confidence → 0–100.

**Capital velocity** = expected profit ÷ expected days to sell.

**Max Buy** = min(profit constraint, ROI constraint) after fee buffer.
