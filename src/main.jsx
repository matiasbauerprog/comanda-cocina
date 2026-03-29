import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Capture PWA install prompt GLOBALLY before React mounts
// This is critical because Chrome fires beforeinstallprompt very early
window.deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
  console.log('[PWA] Install prompt captured and ready');
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker for PWA install support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => console.log('[PWA] Service Worker registered'))
      .catch((err) => console.error('[PWA] SW registration failed:', err));
  });
}
