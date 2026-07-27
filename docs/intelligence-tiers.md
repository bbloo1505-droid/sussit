# Universal intake, narrow intelligence

SussIt accepts **any** Marketplace listing, but only issues strong Buy / Offer
verdicts where comparable data is actually good.

```
User submits item
        ↓
Identify category / brand / model / variant
        ↓
Do we have strong category intelligence?
       ↙                    ↘
     YES                     NO
      ↓                       ↓
Full analysis            Limited market data
Buy / Offer              Lower confidence
Deal score               No fake precision
```

## Tiers

| Tier | Categories | Behaviour |
|------|------------|-----------|
| **full** | phone, console, vr_headset | Strong comps + offers |
| **emerging** | camera, laptop, tablet, wearable, audio, gpu, power_tool | Accept + show comps; no punchy Buy/Overpriced yet |
| **basic** | furniture, clothing, vehicle, jewellery, collectible, other… | Accept; **LIMITED MARKET DATA** only |

## Product graph

Normalize every extract into a `ProductNode` (`src/lib/intelligence/productGraph.ts`):

- `productId` e.g. `META_QUEST_3_512GB`
- family / storage / bundle hints

Prefer polling a curated SKU universe later — not every random search.

## Positioning

- Consumer: **Know what to pay before you buy.**
- Flip: **Know what will flip — and what to pay.**
