import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { CaseResult, EvalReport, SuiteSummary } from '../types.ts'

const RESULTS_DIR = path.resolve(process.cwd(), 'tests/eval/results')
const HISTORY_FILE = path.join(RESULTS_DIR, 'history.json')

export async function loadPreviousReport(): Promise<EvalReport | null> {
  try {
    const raw = await readFile(
      path.join(RESULTS_DIR, 'eval-results.json'),
      'utf8',
    )
    return JSON.parse(raw) as EvalReport
  } catch {
    return null
  }
}

export async function writeReports(report: EvalReport): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true })
  await writeFile(
    path.join(RESULTS_DIR, 'eval-results.json'),
    JSON.stringify(report, null, 2),
    'utf8',
  )
  await writeFile(
    path.join(RESULTS_DIR, 'eval-results.html'),
    renderHtml(report),
    'utf8',
  )

  let history: EvalReport[] = []
  try {
    history = JSON.parse(await readFile(HISTORY_FILE, 'utf8')) as EvalReport[]
  } catch {
    history = []
  }
  history.push(report)
  history = history.slice(-30)
  await writeFile(HISTORY_FILE, JSON.stringify(history, null, 2), 'utf8')
}

export function summarizeSuite(
  suite: SuiteSummary['suite'],
  results: CaseResult[],
): SuiteSummary {
  const rows = results.filter((r) => r.suite === suite)
  const passed = rows.filter((r) => r.passed).length
  const failed = rows.filter((r) => !r.passed && r.severity === 'fail').length
  const warned = rows.filter((r) => r.severity === 'warn').length
  const total = rows.length
  return {
    suite,
    total,
    passed,
    failed,
    warned,
    score: total === 0 ? 100 : Number(((passed / total) * 100).toFixed(2)),
    metrics: {},
  }
}

export function buildHighlights(results: CaseResult[]) {
  const matching = results.filter(
    (r) => r.suite === 'matching' || r.suite === 'adversarial',
  )

  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0
  let wrongModelFails = 0
  let accessoryFails = 0

  for (const r of matching) {
    const expectation = String(r.metrics?.expectation ?? '')
    const included = r.metrics?.included === true
    if (expectation === 'EXPECTED_INCLUDE') {
      if (included) tp += 1
      else fn += 1
    } else if (expectation === 'EXPECTED_EXCLUDE') {
      if (included) {
        fp += 1
        if (r.metrics?.wrongModel === true) wrongModelFails += 1
        if (r.metrics?.accessory === true) accessoryFails += 1
      } else tn += 1
    }
  }

  const idRows = results.filter((r) => r.suite === 'identification')
  const idPass = idRows.filter((r) => r.passed).length
  const precision = tp + fp === 0 ? 1 : tp / (tp + fp)
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn)
  const badCompRejection = tn + fp === 0 ? 1 : tn / (tn + fp)

  return {
    identificationAccuracy:
      idRows.length === 0
        ? 100
        : Number(((idPass / idRows.length) * 100).toFixed(2)),
    comparablePrecision: Number((precision * 100).toFixed(2)),
    comparableRecall: Number((recall * 100).toFixed(2)),
    badCompRejectionRate: Number((badCompRejection * 100).toFixed(2)),
    wrongModelContamination: wrongModelFails,
    accessoryContamination: accessoryFails,
    valuationFailures: results.filter(
      (r) => r.suite === 'valuation' && !r.passed,
    ).length,
    verdictConsistencyFailures: results.filter(
      (r) => r.suite === 'verdict' && !r.passed,
    ).length,
    lowConfidenceFailures: results.filter(
      (r) => r.suite === 'low_info' && !r.passed,
    ).length,
  }
}

function renderHtml(report: EvalReport): string {
  const fails = report.failures.slice(0, 200)
  const delta =
    report.previous != null
      ? (report.overallScore - report.previous.overallScore).toFixed(2)
      : 'n/a'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>SussIt Eval Lab</title>
  <style>
    body { font-family: ui-sans-serif, system-ui, sans-serif; background:#111; color:#f5f5f5; margin:0; padding:24px; }
    h1 { color:#c6ff00; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap:12px; }
    .card { background:#1a1a1a; border:1px solid #333; border-radius:12px; padding:14px; }
    .muted { color:#888; }
    .fail { color:#f87171; }
    .pass { color:#86efac; }
    table { width:100%; border-collapse:collapse; margin-top:16px; font-size:13px; }
    th, td { border-bottom:1px solid #333; padding:8px; text-align:left; vertical-align:top; }
    th { color:#c6ff00; }
  </style>
</head>
<body>
  <h1>SussIt Eval Lab</h1>
  <p class="muted">${report.generatedAt} · ${report.mode} · seed ${report.seed} · ${report.runtimeMs}ms</p>
  <div class="grid">
    <div class="card"><div class="muted">Overall</div><div style="font-size:28px">${report.overallScore}</div></div>
    <div class="card"><div class="muted">Cases</div><div style="font-size:28px">${report.totalCases}</div></div>
    <div class="card"><div class="muted">Failures</div><div style="font-size:28px" class="fail">${report.totalFailed}</div></div>
    <div class="card"><div class="muted">Δ vs previous</div><div style="font-size:28px">${delta}</div></div>
  </div>

  <h2>Highlights</h2>
  <div class="grid">
    ${Object.entries(report.highlights)
      .map(
        ([k, v]) =>
          `<div class="card"><div class="muted">${k}</div><div>${v}</div></div>`,
      )
      .join('')}
  </div>

  <h2>Suites</h2>
  <table>
    <tr><th>Suite</th><th>Total</th><th>Passed</th><th>Failed</th><th>Score</th></tr>
    ${report.suites
      .map(
        (s) =>
          `<tr><td>${s.suite}</td><td>${s.total}</td><td class="pass">${s.passed}</td><td class="fail">${s.failed}</td><td>${s.score}</td></tr>`,
      )
      .join('')}
  </table>

  <h2>Worst failures</h2>
  <table>
    <tr><th>ID</th><th>Suite</th><th>Model</th><th>Why</th></tr>
    ${fails
      .map(
        (f) =>
          `<tr><td>${f.id}</td><td>${f.suite}</td><td>${f.modelKey}</td><td class="fail">${f.reasons.join('; ')}<div class="muted">${f.description}</div></td></tr>`,
      )
      .join('')}
  </table>

  ${
    report.regressions.length
      ? `<h2>Regressions</h2><table><tr><th>ID</th><th>Was</th><th>Now</th></tr>${report.regressions
          .map(
            (r) =>
              `<tr><td>${r.id}<div class="muted">${r.description}</div></td><td>${r.was}</td><td class="fail">${r.now}</td></tr>`,
          )
          .join('')}</table>`
      : '<p class="muted">No regressions vs previous run.</p>'
  }
</body>
</html>`
}
