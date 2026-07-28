import { handleStatus } from '../server/handleStatus.ts'

type Req = { method?: string }
type Res = {
  status: (code: number) => Res
  json: (body: unknown) => void
}

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }
  res.status(200).json(handleStatus())
}
