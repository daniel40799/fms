import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
  },
  server: {
    // Keep app calls relative (/api, /oauth2, /uploads). Azure deployments must route
    // /api, /uploads, /oauth2, and /login/oauth2 to the backend, currently via Front Door.
    proxy: {
      '/api': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/login/oauth2': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
    },
  },
})
