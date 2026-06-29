import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['logo.png', 'icon-*.png', 'offline.html', 'splash-*.png', 'screenshots/*.png'],
      manifest: false,
    }),
  ],
  server: {
    watch: {
      // Negeer geüploade trainingsmappen/PDF's — die kunnen door een viewer
      // gelockt zijn en lieten de file-watcher crashen (EBUSY).
      ignored: ['**/wetransfer_*/**', '**/*.pdf'],
    },
    proxy: {
      // Forward /api/* naar vercel dev (draait standaard op poort 3000).
      // Start met: vercel dev (in plaats van vite) voor volledige API-functionaliteit.
      '/api': 'http://localhost:3000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-motion': ['framer-motion'],
        },
      },
    },
  },
})
