#!/usr/bin/env node
/**
 * Offline-friendly hunt poll CLI.
 * With eBay keys + `npm run dev` running: curl localhost.
 * Without: exits 0 and prints fixture reminder.
 *
 * Usage: npm run poll:hunt
 */

const base = process.env.SUSSIT_API_BASE ?? 'http://localhost:5173'

async function main() {
  try {
    const res = await fetch(`${base}/api/poll-hunt`, { method: 'POST' })
    const json = await res.json()
    console.log(JSON.stringify(json, null, 2))
    if (!json.ok) process.exitCode = 1
    else if (json.source === 'unavailable') {
      console.log(
        '\nNo eBay keys yet — fixtures still power Flip. Add EBAY_CLIENT_ID/SECRET when approved.',
      )
    }
  } catch (error) {
    console.error(
      'Could not reach',
      base,
      '- start `npm run dev` first, or set SUSSIT_API_BASE.',
    )
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}

void main()
