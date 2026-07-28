import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { IdentificationCase } from '../types.ts'

/** Load hand-authored golden identification cases. */
export async function loadGoldenIdentificationCases(): Promise<IdentificationCase[]> {
  const file = path.resolve(
    process.cwd(),
    'tests/eval/golden/identification.json',
  )
  const raw = JSON.parse(await readFile(file, 'utf8')) as {
    cases: Array<{
      id: string
      inputText: string
      expected: IdentificationCase['expected']
    }>
  }
  return raw.cases.map((c) => ({
    id: c.id,
    suite: 'identification' as const,
    category: c.expected.category,
    modelKey: c.id.replace(/^golden-id-/, ''),
    description: `Golden identify: ${c.id}`,
    inputText: c.inputText,
    expected: {
      ...c.expected,
      condition: c.expected.condition ?? null,
      storageGb: c.expected.storageGb ?? null,
      variant: c.expected.variant ?? null,
    },
  }))
}
