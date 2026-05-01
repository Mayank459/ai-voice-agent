import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Production build outputs to FastAPI's static folder
  build: {
    outDir: '../static',
    emptyOutDir: true,
  },

  // Dev-only proxy — not used in production (FastAPI serves everything)
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
