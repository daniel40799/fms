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
    // Local keeps backend calls relative and proxies them to the Spring Boot backend.
    // Azure dev sets VITE_API_BASE_URL at build time; future prod should leave it blank
    // and route these same paths through Front Door or an equivalent reverse proxy.
    proxy: {
      '/api': 'http://localhost:8080',
      '/oauth2': 'http://localhost:8080',
      '/login/oauth2': 'http://localhost:8080',
      '/uploads': 'http://localhost:8080',
    },
  },
})
