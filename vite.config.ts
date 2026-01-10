import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  root: path.resolve(__dirname, 'frontend'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: [
      'dentists-mainly-tennis-trainer.trycloudflare.com',
      'localhost',
      '127.0.0.1'
    ]
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
  },
})