import React, { useEffect, useState } from 'react';
import { Bell, BellOff, X } from 'lucide-react';

const VAPID_PUBLIC_KEY = 'BMFhS7bR4UacelWJY8tepeccTdJW-FXMCDnFsNwzpWuyRS3n_-ayeRde3XSIvLt83L5WssZXn44RMcL5zPzQxhQ';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

interface Props {
  userId: string;
  darkMode: boolean;
}

export default function NotificationSetup({ userId, darkMode }: Props) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [show, setShow] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;
    const current = Notification.permission;
    setPermission(current);
    // Show prompt after 5s if not yet decided
    if (current === 'default') {
      setTimeout(() => setShow(true), 5000);
    }
  }, []);

  const subscribe = async () => {
    if (!('serviceWorker' in navigator)) return;
    setSubscribing(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') { setShow(false); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      const { endpoint, keys } = sub.toJSON() as any;
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, endpoint, p256dh: keys.p256dh, auth: keys.auth }),
      });

      setShow(false);
    } catch (err) {
      console.warn('Push subscription failed:', err);
    } finally {
      setSubscribing(false);
    }
  };

  if (!show || permission === 'granted' || permission === 'denied') return null;

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-2xl shadow-2xl border p-4 flex items-center gap-3 animate-in slide-in-from-top-4 duration-300 ${darkMode ? 'bg-[#121217] border-white/10 text-white' : 'bg-white border-neutral-200 text-slate-900'}`}>
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shrink-0">
        <Bell size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-bold leading-tight">Enable Notifications</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Messages, connection updates & new posts from your network</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={subscribe}
          disabled={subscribing}
          className="px-3 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-[11px] font-bold transition-all cursor-pointer border-0 flex items-center gap-1"
        >
          {subscribing ? '...' : <><Bell size={11} /> Allow</>}
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
