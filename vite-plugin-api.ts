import type { Plugin } from 'vite'
import { handleExtract, type ExtractRequestBody } from './server/handleExtract.ts'
import { handleEbayAccountDeletionRequest } from './server/handleEbayAccountDeletion.ts'

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
        const fullUrl = req.url ?? ''
        const url = fullUrl.split('?')[0] ?? ''

        try {
          if (url === '/api/extract' && req.method === 'POST') {
            const body = (await readJson(req)) as ExtractRequestBody
            const result = await handleExtract(body)
            sendJson(res, result.ok ? 200 : 400, result)
            return
          }

          if (
            url === '/api/ebay/account-deletion' &&
            (req.method === 'GET' || req.method === 'POST')
          ) {
            const challengeCode = new URL(
              fullUrl,
              'http://localhost',
            ).searchParams.get('challenge_code')
            const body =
              req.method === 'POST' ? await readJson(req) : undefined
            const result = await handleEbayAccountDeletionRequest({
              method: req.method,
              challengeCode,
              body,
            })
            sendJson(res, result.status, result.body)
            return
          }
        } catch (error) {
          console.error('[api]', error)
          sendJson(res, 500, { ok: false, error: 'Server error' })
          return
        }

        next()
      })
    },
  }
}
