import { handleExtract, type ExtractRequestBody } from '../server/handleExtract.ts'

type Req = { method?: string; body?: ExtractRequestBody }
type Res = {
  status: (code: number) => Res
  json: (body: unknown) => void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const result = await handleExtract((req.body ?? {}) as ExtractRequestBody)
  res.status(result.ok ? 200 : 400).json(result)
}
