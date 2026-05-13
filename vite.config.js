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
          // react-leaflet uses React.forwardRef — it MUST live in the same chunk
          // as React to avoid undefined React when vendor-map executes before vendor.
          // Leaflet + react-leaflet fall through to the vendor catch-all below.
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        },
      },
    },
  },
});
