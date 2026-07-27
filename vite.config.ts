import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiPlugin } from './vite-plugin-api.ts'

/**
 * Server-only env for Vite middleware (process.env).
 * Do NOT use VITE_ prefix for secrets — those would ship to the client.
 */
const SERVER_ENV_KEYS = [
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_DB_URL',
  'EBAY_CLIENT_ID',
  'EBAY_CLIENT_SECRET',
  'EBAY_ENVIRONMENT',
  'EBAY_MARKETPLACE_ID',
  'EBAY_ITEM_LOCATION_COUNTRY',
  'EBAY_OAUTH_SCOPE',
  'EBAY_DELETION_VERIFICATION_TOKEN',
  'EBAY_DELETION_ENDPOINT',
] as const

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  for (const key of SERVER_ENV_KEYS) {
    process.env[key] = env[key] ?? process.env[key]
  }

  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
