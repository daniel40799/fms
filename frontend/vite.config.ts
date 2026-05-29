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
    // Keep app calls relative (/api, /oauth2, /uploads). Production must route /api through
    // Azure Static Web Apps linked API/backend routing or an explicit VITE_API_BASE_URL strategy.
    proxy: {
      '/api': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/login/oauth2': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
    },
  },
})
