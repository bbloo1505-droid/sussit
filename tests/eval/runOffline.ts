/**
 * SussIt Eval Lab — offline runner (no live eBay, no Supabase writes).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  generateIdentificationCases,
  generateLowInfoCases,
  generateMatchingCases,
  generateValuationCases,
  generateVerdictCases,
} from './generate/cases.ts'
import { loadGoldenIdentificationCases } from './golden/loadGolden.ts'
import {
  evalEbayReplay,
  evalIdentification,
  evalLowInfo,
  evalMatching,
  evalValuation,
  evalVerdict,
} from './evaluate/runners.ts'
import {
  buildHighlights,
  loadPreviousReport,
  summarizeSuite,
  writeReports,
} from './report/writeReport.ts'
import { EVAL_SEED } from './seed.ts'
import { skuToProduct, findSku } from './catalog.ts'
import type { CaseResult, EvalReport } from './types.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  const started = Date.now()
  const previous = await loadPreviousReport()

  const matching = generateMatchingCases(EVAL_SEED)
  const identification = [
    ...generateIdentificationCases(EVAL_SEED),
    ...(await loadGoldenIdentificationCases()),
  ]
  const valuation = generateValuationCases(EVAL_SEED)
  const verdict = generateVerdictCases()
  const lowInfo = generateLowInfoCases()

  const replayCases = [
    {
      id: 'ebay-replay-quest3',
      suite: 'ebay_replay' as const,
      category: 'vr_headset' as const,
      modelKey: 'quest-3',
      description: 'Replay saved Browse JSON for Quest 3',
      fixturePath: path.join(
        'tests/eval/fixtures/ebay-browse',
        'quest3-sample.json',
      ),
      target: skuToProduct(findSku('quest-3')),
      minIncluded: 1,
      maxAccessoryContamination: 0,
    },
  ]

  const results: CaseResult[] = []

  for (const c of identification) results.push(evalIdentification(c))
  for (const c of matching) results.push(evalMatching(c))
  for (const c of valuation) results.push(evalValuation(c))
  for (const c of verdict) results.push(evalVerdict(c))
  for (const c of lowInfo) results.push(evalLowInfo(c))
  for (const c of replayCases) results.push(await evalEbayReplay(c))

  const suites = (
    [
      'identification',
      'matching',
      'adversarial',
      'valuation',
      'verdict',
      'low_info',
      'ebay_replay',
    ] as const
  ).map((s) => summarizeSuite(s, results))

  const totalCases = results.length
  const totalPassed = results.filter((r) => r.passed).length
  const totalFailed = results.filter((r) => !r.passed && r.severity === 'fail').length
  const totalWarned = results.filter((r) => r.severity === 'warn').length
  const overallScore =
    totalCases === 0
      ? 100
      : Number(((totalPassed / totalCases) * 100).toFixed(2))

  const byCategory: EvalReport['byCategory'] = {}
  const byModel: EvalReport['byModel'] = {}
  for (const r of results) {
    const cat = byCategory[r.category] ?? {
      total: 0,
      passed: 0,
      failed: 0,
      score: 0,
    }
    cat.total += 1
    if (r.passed) cat.passed += 1
    else if (r.severity === 'fail') cat.failed += 1
    byCategory[r.category] = cat

    const mod = byModel[r.modelKey] ?? {
      total: 0,
      passed: 0,
      failed: 0,
      score: 0,
    }
    mod.total += 1
    if (r.passed) mod.passed += 1
    else if (r.severity === 'fail') mod.failed += 1
    byModel[r.modelKey] = mod
  }
  for (const key of Object.keys(byCategory)) {
    const row = byCategory[key]!
    row.score = Number(((row.passed / row.total) * 100).toFixed(2))
  }
  for (const key of Object.keys(byModel)) {
    const row = byModel[key]!
    row.score = Number(((row.passed / row.total) * 100).toFixed(2))
  }

  const failures = results
    .filter((r) => !r.passed && r.severity === 'fail')
    .sort((a, b) => {
      // Prefer contamination / adversarial / valuation failures first
      const score = (r: typeof a) => {
        let s = 0
        if (r.metrics?.accessory === true) s += 5
        if (r.metrics?.wrongModel === true) s += 5
        if (r.suite === 'adversarial') s += 3
        if (r.suite === 'valuation') s += 2
        if (r.suite === 'identification') s += 1
        return s
      }
      return score(b) - score(a)
    })

  const previousFailIds = new Set(
    previous?.failures.map((f) => f.id) ?? [],
  )
  const regressions = failures
    .filter((f) => previous && !previousFailIds.has(f.id))
    .filter((f) => {
      // Newly failing vs previous pass set: if previous report had this id as pass, it's regression
      // We only stored failures previously — approximate: if overall had the case count and id wasn't in failures
      return previous != null && previous.totalCases > 0
    })
    .slice(0, 50)
    .map((f) => ({
      id: f.id,
      description: f.description,
      was: 'pass/unknown',
      now: f.reasons.join('; '),
    }))

  // Better regression detection using history of all result ids if available
  let refinedRegressions = regressions
  if (previous) {
    const prevFail = new Set(previous.failures.map((f) => f.id))
    refinedRegressions = failures
      .filter((f) => !prevFail.has(f.id))
      .map((f) => ({
        id: f.id,
        description: f.description,
        was: 'not in previous failures',
        now: f.reasons.join('; '),
      }))
      .slice(0, 100)
  }

  const report: EvalReport = {
    generatedAt: new Date().toISOString(),
    mode: 'offline',
    seed: EVAL_SEED,
    totalCases,
    totalPassed,
    totalFailed,
    totalWarned,
    overallScore,
    runtimeMs: Date.now() - started,
    suites,
    byCategory,
    byModel,
    failures: failures.slice(0, 1000),
    previous: previous
      ? {
          overallScore: previous.overallScore,
          totalFailed: previous.totalFailed,
          generatedAt: previous.generatedAt,
        }
      : null,
    regressions: refinedRegressions,
    highlights: buildHighlights(results),
  }

  await writeReports(report)

  // Console summary
  console.log('\n=== SussIt Eval Lab (offline) ===')
  console.log(`Cases: ${totalCases}`)
  console.log(`Passed: ${totalPassed}`)
  console.log(`Failed: ${totalFailed}`)
  console.log(`Warned: ${totalWarned}`)
  console.log(`Overall score: ${overallScore}`)
  console.log(`Runtime: ${report.runtimeMs}ms`)
  console.log('\nHighlights:')
  for (const [k, v] of Object.entries(report.highlights)) {
    console.log(`  ${k}: ${v}`)
  }
  console.log('\nBy category:')
  for (const [k, v] of Object.entries(byCategory)) {
    console.log(`  ${k}: ${v.score}% (${v.failed} fails / ${v.total})`)
  }
  console.log('\nWorst 20 failures:')
  for (const f of failures.slice(0, 20)) {
    console.log(
      `- [${f.suite}] ${f.modelKey}: ${f.reasons.join('; ')} | ${f.description}`,
    )
  }
  console.log(
    `\nWrote tests/eval/results/eval-results.json and eval-results.html`,
  )

  if (totalFailed > 0) process.exitCode = 0 // eval lab reports failures; do not fail CI by default
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
