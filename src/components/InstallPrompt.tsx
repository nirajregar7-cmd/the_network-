import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

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

  useEffect(() => {
    // Already installed as standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show after 3 seconds
      setTimeout(() => setShow(true), 3000);
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

  if (installed || !show || !deferredPrompt) return null;

  return (
    <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl shadow-2xl border p-4 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-300 ${darkMode ? 'bg-[#121217] border-white/10 text-white' : 'bg-white border-neutral-200 text-slate-900'}`}>
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0">
        <Smartphone size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight">Install The Network</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Add to your phone for the full app experience</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[11px] font-bold transition-all cursor-pointer border-0 flex items-center gap-1"
        >
          <Download size={12} /> Install
        </button>
        <button
          onClick={() => setShow(false)}
          className={`p-1.5 rounded-lg transition-all cursor-pointer border-0 ${darkMode ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-neutral-100 text-slate-400'}`}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
