import type { Plugin } from 'vite'
import { handleExtract, type ExtractRequestBody } from './server/handleExtract.ts'

async function readJson(req: import('http').IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  return JSON.parse(raw) as unknown
}

function sendJson(
  res: import('http').ServerResponse,
  status: number,
  body: unknown,
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

/** Local /api/* handlers for Vite dev (mirrors Vercel functions). */
export function apiPlugin(): Plugin {
  return {
    name: 'sussit-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/extract') || req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = (await readJson(req)) as ExtractRequestBody
          const result = await handleExtract(body)
          sendJson(res, result.ok ? 200 : 400, result)
        } catch (error) {
          console.error('[api/extract]', error)
          sendJson(res, 500, { ok: false, error: 'Server error' })
        }
      })
    },
  }
}
