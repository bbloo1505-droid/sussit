import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type StatusPayload = {
  ok: true
  services: {
    openai: { configured: boolean }
    ebay: { configured: boolean; marketplaceId: string; environment: string }
    supabase: { configured: boolean }
  }
  readyFor: {
    liveExtract: boolean
    liveComps: boolean
    ebaySandboxOnly: boolean
    persistence: boolean
  }
}

export function SetupStatus() {
  const [status, setStatus] = useState<StatusPayload | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch('/api/status')
      .then((r) => r.json())
      .then((json: StatusPayload) => {
        if (!cancelled && json.ok) setStatus(json)
      })
      .catch(() => {
        /* ignore */
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!status) return null

  const rows = [
    {
      label: 'Screenshot extract',
      ok: status.readyFor.liveExtract,
      hint: status.readyFor.liveExtract
        ? 'OpenAI connected'
        : 'Add OPENAI_API_KEY (or use paste / demo)',
    },
    {
      label: 'Live AU comps',
      ok: status.readyFor.liveComps,
      hint: status.readyFor.liveComps
        ? `eBay ${status.services.ebay.marketplaceId}`
        : status.readyFor.ebaySandboxOnly
          ? `Sandbox OK (${status.services.ebay.marketplaceId}) — need Production for AU`
          : 'Waiting on eBay API keys',
    },
    {
      label: 'Cloud persistence',
      ok: status.readyFor.persistence,
      hint: status.readyFor.persistence
        ? 'Supabase configured'
        : 'Optional — fixtures/session for now',
    },
  ]

  return (
    <section className="mt-8 rounded-[18px] border border-white/10 bg-surface px-4 py-3">
      <p className="font-display text-[10px] font-bold tracking-[0.14em] text-muted">
        SETUP
      </p>
      <ul className="mt-2 space-y-2">
        {rows.map((row) => (
          <li key={row.label} className="flex items-start justify-between gap-3">
            <span className="text-[13px] text-cream">{row.label}</span>
            <span
              className={`text-right text-[12px] ${row.ok ? 'text-lime' : 'text-muted'}`}
            >
              {row.ok ? 'Ready' : row.hint}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[11px] leading-5 text-muted">
        eBay pending? Keep building with fixtures. See{' '}
        <Link to="/flip" className="text-cream underline-offset-2 hover:underline">
          Flip
        </Link>{' '}
        after demo unlock.
      </p>
    </section>
  )
}
