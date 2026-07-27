# SussIt

Know before you buy.

Australian mobile-first second-hand buying decision app. Upload a Marketplace listing screenshot — SussIt identifies the product, compares current asking prices, and helps you decide what to offer.

## Stack

React · TypeScript · Vite · Tailwind · shadcn-style UI

## Develop

```bash
npm install
cp .env.example .env   # add OPENAI_API_KEY for live extraction
npm run dev
npm test
```

Without `OPENAI_API_KEY`, extract falls back to Meta Quest 3 demo data so the UI still works.

## V0 scope

- Upload screenshot or paste listing text → OpenAI extract (structured JSON)
- Confirm / fix product → valuation engine (`TestPricingProvider` fixtures)
- Result with comps, offer, risks, outcome capture
- No auth, Stripe, or eBay production API yet
