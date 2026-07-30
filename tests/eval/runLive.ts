/**
 * Optional live eBay eval — NEVER run in CI.
 * Cap + rate-limit Browse API calls against a controlled query list.
 *
 * Usage: npm run eval:live
 * Wider pass: EVAL_LIVE_MAX_CALLS=24 npm run eval:live
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildSearchQuery } from '../../server/ebay/buildBrowseQuery.ts'
import { browseSearchAu } from '../../server/ebay/browseSearch.ts'
import { LIVE_EVAL_PRODUCTS } from './liveProducts.ts'
import { EVAL_SEED } from './seed.ts'
import type { EvalReport } from './types.ts'

/** Load local .env into process.env without printing values. */
async function loadDotEnv() {
  try {
    const raw = await readFile(path.resolve(process.cwd(), '.env'), 'utf8')
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq <= 0) continue
      const key = trimmed.slice(0, eq).trim()
      let value = trimmed.slice(eq + 1).trim()
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      if (process.env[key] == null || process.env[key] === '') {
        process.env[key] = value
      }
    }
  } catch {
    // no .env — rely on process env
  }
}

await loadDotEnv()

const MAX_CALLS = Number(
  process.env.EVAL_LIVE_MAX_CALLS ?? LIVE_EVAL_PRODUCTS.length,
)
const DELAY_MS = Number(process.env.EVAL_LIVE_DELAY_MS ?? 1100)

const CONTROLLED_QUERIES = LIVE_EVAL_PRODUCTS.map((p) => ({
  query: buildSearchQuery(p),
  skuKey: p.skuKey,
  product: p,
}))

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  if (process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true') {
    console.error('eval:live refused — do not run live eBay eval in CI')
    process.exit(1)
  }

  const started = Date.now()
  // Warm token / config via a dry path — browseSearchAu loads .env through vite if present
  const queries = CONTROLLED_QUERIES.slice(0, MAX_CALLS)
  const fixtureDir = path.resolve(
    process.cwd(),
    'tests/eval/fixtures/ebay-browse/live-captures',
  )
  await mkdir(fixtureDir, { recursive: true })

  const { readdir, unlink } = await import('node:fs/promises')
  for (const file of await readdir(fixtureDir)) {
    if (file.endsWith('.json')) await unlink(path.join(fixtureDir, file))
  }

  const captures: Array<{
    query: string
    skuKey: string
    category: string
    total: number
    saved: string
    itemCount: number
  }> = []

  console.log(
    `\nWide live eval: ${queries.length} SKUs across ${new Set(queries.map((q) => q.product.category)).size} categories\n`,
  )

  for (let i = 0; i < queries.length; i++) {
    const entry = queries[i]!
    const q = entry.query
    console.log(
      `[${i + 1}/${queries.length}] ${entry.product.category} · ${entry.skuKey}`,
    )
    console.log(`  q: ${q}`)
    const listings = await browseSearchAu({
      query: q,
      limit: 20,
      category: entry.product.category,
    })
    const file = path.join(fixtureDir, `${entry.skuKey}.json`)
    const payload = {
      savedAt: new Date().toISOString(),
      query: q,
      skuKey: entry.skuKey,
      product: entry.product,
      marketplaceId: process.env.EBAY_MARKETPLACE_ID ?? 'EBAY_AU',
      itemSummaries: listings.map((l) => ({
        itemId: l.externalId ?? l.id,
        title: l.title,
        price: { value: String(l.price), currency: l.currency },
        condition: l.condition,
        itemWebUrl: l.url,
        itemLocation: l.location
          ? { city: l.location, country: 'AU' }
          : undefined,
      })),
      total: listings.length,
    }
    await writeFile(file, JSON.stringify(payload, null, 2), 'utf8')
    captures.push({
      query: q,
      skuKey: entry.skuKey,
      category: entry.product.category,
      total: listings.length,
      saved: file,
      itemCount: listings.length,
    })
    if (i < queries.length - 1) await sleep(DELAY_MS)
  }

  const report: EvalReport = {
    generatedAt: new Date().toISOString(),
    mode: 'live',
    seed: EVAL_SEED,
    totalCases: captures.length,
    totalPassed: captures.length,
    totalFailed: 0,
    totalWarned: 0,
    overallScore: 100,
    runtimeMs: Date.now() - started,
    suites: [
      {
        suite: 'ebay_replay',
        total: captures.length,
        passed: captures.length,
        failed: 0,
        warned: 0,
        score: 100,
        metrics: { calls: captures.length, maxCalls: MAX_CALLS },
      },
    ],
    byCategory: {},
    byModel: {},
    failures: [],
    previous: null,
    regressions: [],
    highlights: {
      identificationAccuracy: 0,
      comparablePrecision: 0,
      comparableRecall: 0,
      badCompRejectionRate: 0,
      wrongModelContamination: 0,
      accessoryContamination: 0,
      valuationFailures: 0,
      verdictConsistencyFailures: 0,
      lowConfidenceFailures: 0,
    },
  }

  const outDir = path.resolve(process.cwd(), 'tests/eval/results')
  await mkdir(outDir, { recursive: true })
  await writeFile(
    path.join(outDir, 'eval-live-captures.json'),
    JSON.stringify({ report, captures }, null, 2),
    'utf8',
  )

  console.log('\n=== SussIt Eval Lab (live wide) ===')
  console.log(`Calls: ${captures.length}/${MAX_CALLS}`)
  for (const c of captures) {
    console.log(
      `- [${c.category}] ${c.skuKey}: ${c.itemCount} items (total~${c.total})`,
    )
  }
  console.log('Scoring captures…')
  const { spawnSync } = await import('node:child_process')
  const score = spawnSync(
    process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['run', 'eval:live:score'],
    {
      stdio: 'inherit',
      cwd: process.cwd(),
      shell: process.platform === 'win32',
      env: process.env,
    },
  )
  if (score.status !== 0) {
    console.error('eval:live:score failed — run npm run eval:live:score manually')
    process.exit(score.status ?? 1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
