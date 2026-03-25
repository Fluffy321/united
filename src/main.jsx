import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Sync Tailwind 'dark' class with OS preference
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const applyTheme = (e) => document.documentElement.classList.toggle('dark', e.matches);
applyTheme(mq);
mq.addEventListener('change', applyTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)