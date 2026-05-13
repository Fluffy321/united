import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split large vendors into named chunks so they can be cached
        // independently of app code. Each chunk gets a content-hash filename
        // so a CDN can cache it indefinitely; only changed chunks re-download.
        manualChunks(id) {
          // Supabase has no React dependency — safe to split independently.
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          // All other node_modules (React, recharts, d3, leaflet, react-leaflet,
          // framer-motion, etc.) go into one vendor chunk. Splitting any of these
          // into separate chunks creates cross-chunk circular dependencies that
          // break production initialization order (TDZ / undefined React errors).
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
