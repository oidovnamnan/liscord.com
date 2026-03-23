import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/index.css'
import './styles/components.css'
import App from './App.tsx'

// ═══ Chunk Load Error Recovery ═══
// When Vercel deploys a new version, old JS chunks are deleted.
// If a user has the app open with references to old chunks, the server
// returns HTML instead of JS, causing a MIME type error and blank screen.
// This handler auto-reloads to get the fresh chunks.
window.addEventListener('vite:preloadError', () => {
  const lastReload = sessionStorage.getItem('chunk-reload');
  const now = Date.now();
  // Prevent infinite reload loops — only reload once per 10 seconds
  if (!lastReload || now - parseInt(lastReload) > 10000) {
    sessionStorage.setItem('chunk-reload', now.toString());
    window.location.reload();
  }
});

// Fallback: catch chunk loading errors at window level
window.addEventListener('error', (e) => {
  if (e.message?.includes('Failed to fetch dynamically imported module') ||
    e.message?.includes('Loading chunk') ||
    e.message?.includes('text/html')) {
    const lastReload = sessionStorage.getItem('chunk-reload');
    const now = Date.now();
    if (!lastReload || now - parseInt(lastReload) > 10000) {
      sessionStorage.setItem('chunk-reload', now.toString());
      window.location.reload();
    }
  }
});

// Apply saved theme — but NOT on storefront pages (those force light)
const pathname = window.location.pathname;
const isStorefront = pathname.length > 1 && !/^\/(app|login|register|super)(\/|$)/i.test(pathname);
if (!isStorefront) {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  const resolved = savedTheme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : savedTheme;
  document.documentElement.setAttribute('data-theme', resolved);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
