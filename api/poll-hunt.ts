import { handlePollHunt } from '../server/handlePollHunt.ts'

type Req = { method?: string }
type Res = {
  status: (code: number) => Res
  json: (body: unknown) => void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const result = await handlePollHunt()
  res.status(result.ok ? 200 : 400).json(result)
}
