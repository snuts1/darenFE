import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173, // Your Svelte dev server port
    proxy: {
      // Proxy requests from /api/... to http://localhost:8080/api/...
      '/api': {
        target: 'http://localhost:8080', // Your Go backend address
        changeOrigin: true, // needed for virtual hosted sites
        // No rewrite needed if your Go backend expects the /api prefix.
        // If your Go backend routes are like /v1/payback/trips (without /api),
        // you might need: rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})