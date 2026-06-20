import React, { useState, useEffect, useRef } from 'react';
import { Notification } from '../types';
import { api } from '../api';
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, MessageSquare, X, CheckCheck } from 'lucide-react';

interface NotificationsDropdownProps {
  userId: string;
  darkMode: boolean;
  onNavigate: (view: string, actorId?: string) => void;
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  like: <Heart size={14} className="text-rose-500" />,
  comment: <MessageCircle size={14} className="text-blue-500" />,
  connection_request: <UserPlus size={14} className="text-indigo-500" />,
  connection_accepted: <UserCheck size={14} className="text-emerald-500" />,
  message: <MessageSquare size={14} className="text-violet-500" />,
};

function viewForType(type: string): string {
  if (type === 'message') return 'messages';
  if (type === 'like' || type === 'comment') return 'feed';
  if (type === 'connection_request' || type === 'connection_accepted') return 'dashboard';
  return 'feed';
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsDropdown({ userId, darkMode, onNavigate }: NotificationsDropdownProps) {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifs.filter(n => !n.isRead).length;

  const fetchNotifs = async () => {
    try {
      const data = await api.notifications.getForUser(userId);
      setNotifs(data);
    } catch {}
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 20000);
    return () => clearInterval(interval);
  }, [userId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const handleOpen = async () => {
    setOpen(o => !o);
  };

  const markRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    setLoading(true);
    await api.notifications.markAllRead(userId);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setLoading(false);
  };

  const handleNotifClick = async (n: Notification) => {
    await markRead(n.id);
    setOpen(false);
    const view = viewForType(n.type);
    const actorId = n.type === 'message' ? n.actorId : undefined;
    onNavigate(view, actorId);
  };

  return (
    <div className="relative" ref={dropRef}>
      <button
        onClick={handleOpen}
        className={`relative p-2 rounded-full border transition-all cursor-pointer ${darkMode ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-neutral-200 hover:bg-neutral-100 text-slate-700'}`}
        title="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] flex items-center justify-center bg-rose-500 text-white text-[9px] font-bold rounded-full px-1 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 top-full mt-2 w-80 rounded-2xl shadow-xl border z-50 overflow-hidden ${darkMode ? 'bg-[#16161D] border-white/10' : 'bg-white border-neutral-200'}`}
          style={{ maxHeight: 440 }}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${darkMode ? 'border-white/10' : 'border-neutral-100'}`}>
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-indigo-500" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-500 text-[9px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="flex items-center gap-1 text-[10px] font-semibold text-indigo-500 hover:text-indigo-600 cursor-pointer"
                  title="Mark all as read"
                >
                  <CheckCheck size={11} />
                  All read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X size={13} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 370 }}>
            {notifs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell size={28} className="text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-400">You're all caught up!</p>
                <p className="text-[10px] text-slate-400 mt-1">Likes, comments, and connections will appear here</p>
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => handleNotifClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all cursor-pointer border-b last:border-b-0 ${darkMode ? 'border-white/5 hover:bg-white/5' : 'border-neutral-50 hover:bg-neutral-50'} ${!n.isRead ? (darkMode ? 'bg-indigo-500/5' : 'bg-indigo-50/60') : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${darkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                    {TYPE_ICON[n.type] || <Bell size={14} className="text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-semibold leading-snug ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{n.title}</p>
                    <p className={`text-[10px] mt-0.5 leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{n.body}</p>
                    <p className="text-[9px] font-mono text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                    <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-white/10 text-slate-400' : 'bg-slate-100 text-slate-400'}`}>
                      {n.type === 'message' ? 'Open chat →' : n.type === 'connection_request' ? 'View →' : 'Go →'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
