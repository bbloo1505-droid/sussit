import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiPlugin } from './vite-plugin-api.ts'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.OPENAI_API_KEY = env.OPENAI_API_KEY ?? process.env.OPENAI_API_KEY
  process.env.OPENAI_MODEL = env.OPENAI_MODEL ?? process.env.OPENAI_MODEL

  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
