import React, { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface Props {
  darkMode: boolean;
}

export default function InstallPrompt({ darkMode }: Props) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }
    if (sessionStorage.getItem('pwa-prompt-dismissed')) {
      setDismissed(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setInstalled(true);
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-prompt-dismissed', '1');
    setDismissed(true);
    setShow(false);
  };

  if (installed || dismissed || !show || !deferredPrompt) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Bottom sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col items-center"
        style={{
          background: 'linear-gradient(160deg, #1a0d2e 0%, #0d0d14 60%, #000000 100%)',
          borderRadius: '24px 24px 0 0',
          padding: '12px 24px 40px',
          boxShadow: '0 -8px 48px rgba(109,40,217,0.25)',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.25)',
            marginBottom: 24,
          }}
        />

        {/* App icon */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            overflow: 'hidden',
            marginBottom: 20,
            boxShadow: '0 4px 24px rgba(109,40,217,0.5)',
            border: '2px solid rgba(109,40,217,0.4)',
          }}
        >
          <img
            src="/icons/icon-192x192.png"
            alt="The Network"
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>

        {/* Title */}
        <h2
          style={{
            color: '#fff',
            fontWeight: 800,
            fontSize: 22,
            margin: '0 0 10px',
            textAlign: 'center',
            letterSpacing: '-0.3px',
          }}
        >
          Install The Network
        </h2>

        {/* Subtitle */}
        <p
          style={{
            color: 'rgba(255,255,255,0.55)',
            fontSize: 14,
            textAlign: 'center',
            margin: '0 0 24px',
            lineHeight: 1.5,
            maxWidth: 300,
          }}
        >
          Get the full app experience — faster, offline-ready, and on your home screen like a real app.
        </p>

        {/* Feature bullets */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
          {[
            { emoji: '⚡', text: 'Loads faster than the browser' },
            { emoji: '🔔', text: 'Real-time message notifications' },
            { emoji: '🔒', text: 'Private & secure — always' },
          ].map(({ emoji, text }) => (
            <div
              key={text}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 14,
                padding: '13px 16px',
                border: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <span style={{ fontSize: 20 }}>{emoji}</span>
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Install button */}
        <button
          onClick={handleInstall}
          style={{
            width: '100%',
            padding: '16px 0',
            borderRadius: 16,
            background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 50%, #4f46e5 100%)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 16,
            border: 'none',
            cursor: 'pointer',
            letterSpacing: '0.2px',
            boxShadow: '0 4px 20px rgba(109,40,217,0.5)',
            marginBottom: 16,
          }}
        >
          📲 Install App — Free
        </button>

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          Not now
        </button>
      </div>
    </>
  );
}
