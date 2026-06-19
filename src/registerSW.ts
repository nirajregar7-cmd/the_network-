export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' });
      console.log('[PWA] Service worker registered:', reg.scope);

      // Force update check immediately
      reg.update();

      // When a new SW is waiting, skip waiting so it takes over right away
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New SW installed — tell it to skip waiting
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // When the SW takes control, reload once to get fresh content
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    } catch (err) {
      console.warn('[PWA] Service worker registration failed:', err);
    }
  });
}
