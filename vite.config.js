import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const packageNameFromId = (id) => {
  const marker = 'node_modules/';
  const index = id.lastIndexOf(marker);
  if (index === -1) return null;

  const parts = id.slice(index + marker.length).split('/');
  if (parts[0]?.startsWith('@')) return `${parts[0]}/${parts[1]}`;
  return parts[0];
};

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
        // Split large vendors into named chunks so route-only libraries do not
        // ride along in the first shared vendor download.
        manualChunks(id) {
          if (id.includes('/node_modules/recharts/')) {
            return 'vendor-charts';
          }

          const pkg = packageNameFromId(id);
          if (!pkg) return undefined;

          if (pkg.startsWith('@supabase/')) {
            return 'vendor-supabase';
          }

          if (['react', 'react-dom', 'scheduler'].includes(pkg)) {
            return 'vendor-react';
          }

          if (['react-router', 'react-router-dom', '@remix-run/router'].includes(pkg)) {
            return 'vendor-router';
          }

          if (pkg.startsWith('@tanstack/')) {
            return 'vendor-query';
          }

          if (['leaflet', 'react-leaflet', 'react-leaflet-cluster', '@react-leaflet/core'].includes(pkg)) {
            return 'vendor-maps';
          }

          if (
            pkg === 'recharts' ||
            pkg === 'recharts-scale' ||
            pkg === 'react-smooth' ||
            pkg === 'decimal.js-light' ||
            pkg === 'lodash' ||
            pkg === 'fast-equals' ||
            pkg.startsWith('d3-')
          ) {
            return 'vendor-charts';
          }

          if (['framer-motion', 'motion-dom', 'motion-utils'].includes(pkg)) {
            return 'vendor-motion';
          }

          if (pkg.startsWith('@radix-ui/')) {
            return 'vendor-radix';
          }

          if (pkg === 'lucide-react') {
            return 'vendor-icons';
          }
        },
      },
    },
  },
});
