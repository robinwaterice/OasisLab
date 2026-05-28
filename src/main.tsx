import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register Service Worker for PWA Add to Home Screen support (Production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('Oasis Lab sw registered successfully:', registration.scope);

        // Proactively check for updates on registration
        registration.update();

        // Listen for new service workers
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('New version detected! Auto-reloading to apply update.');
                // Auto reload the page to activate the new Service Worker instantly
                window.location.reload();
              }
            });
          }
        });
      })
      .catch((err) => {
        console.log('Oasis Lab sw registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(

  <StrictMode>
    <App />
  </StrictMode>,
);
