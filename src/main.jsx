import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initAnalytics, installGlobalErrorLogging } from '@/lib/analytics'

installGlobalErrorLogging();
initAnalytics().catch(() => {});

const resetDevelopmentServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  await Promise.all(registrations.map((registration) => registration.unregister()));

  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
  }
};

// Keep local development fresh, and only enable offline caching in production.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    if (import.meta.env.DEV) {
      resetDevelopmentServiceWorker().catch(() => {});
      return;
    }

    navigator.serviceWorker.register('/sw.js')
      .then((registration) => registration.update().catch(() => {}))
      .catch(() => {});
  });

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'JUNITED_APP_UPDATED') return;
    if (sessionStorage.getItem('junited-sw-refreshed') === '1') return;
    sessionStorage.setItem('junited-sw-refreshed', '1');
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
