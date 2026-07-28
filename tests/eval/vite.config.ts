import path from 'node:path'
import { defineConfig } from 'vite'

/** Shared resolve aliases for vite-node eval runners. */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
    },
  },
})
