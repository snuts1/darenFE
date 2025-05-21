import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
// Import named exports from carbon-preprocess-svelte
import { optimizeImports, optimizeCss} from 'carbon-preprocess-svelte';
// You'll likely still want svelte-preprocess for general SCSS compilation, TypeScript, etc.
import sveltePreprocess from 'svelte-preprocess';
import path from 'path'; 

// https://vitejs.dev/config/
export default defineConfig({
  base: '/payback',
  plugins: [
    svelte({
      preprocess: [
        optimizeImports(), // Handles Carbon component import optimization
        sveltePreprocess({ // Handles general SCSS, TypeScript, PostCSS, etc.
          scss: {
            // If you need to specify includePaths for Sass to find @carbon/styles,
            // you can do it here. However, direct npm package imports in SCSS
            // usually work if `sass` is correctly resolving node_modules.
          includePaths: [path.resolve('./node_modules')],
          },
        })
      ]
  }),
  optimizeCss()
],
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