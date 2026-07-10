import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'us.junited.app',
  appName: 'JUnited',
  webDir: 'dist',
  server: {
    // Capacitor serves the built bundle; deep links and OAuth redirects still
    // resolve against production. Keep androidScheme/iosScheme defaults.
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
