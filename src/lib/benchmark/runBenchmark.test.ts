import { describe, expect, it } from 'vitest'
import { runBenchmark } from '@/lib/benchmark/runBenchmark'

describe('V0 fixture benchmark', () => {
  it('produces market + Max Buy for every hunt SKU', async () => {
    const { passed, failed, results } = await runBenchmark()
    for (const row of results) {
      // eslint-disable-next-line no-console
      console.log(`${row.ok ? 'PASS' : 'FAIL'} ${row.label}: ${row.details}`)
    }
    expect(failed).toBe(0)
    expect(passed).toBe(results.length)
    expect(passed).toBeGreaterThanOrEqual(5)
  })
})
