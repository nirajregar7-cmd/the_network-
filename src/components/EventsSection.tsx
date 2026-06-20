import React, { useState, useEffect, useMemo } from 'react';
import { CampusEvent, UserProfile } from '../types';
import { api } from '../api';
import {
  Calendar, Plus, X, Search, MapPin, Clock, Users, Globe,
  Rocket, BookOpen, Mic, Trophy, Music, Dumbbell, Pencil, Trash2,
  CheckCircle2, ExternalLink, ArrowRight, ChevronLeft, Zap, Award, Link
} from 'lucide-react';
import Avatar from './Avatar';

interface EventsSectionProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  darkMode: boolean;
  onViewUserProfile?: (userId: string) => void;
}

const EVENT_CATEGORIES = ['Hackathon', 'Study Group', 'Seminar', 'Workshop', 'Cultural', 'Sports', 'Social', 'General'];

const CAT_COLORS: Record<string, string> = {
  Hackathon: 'bg-orange-500/10 text-orange-500',
  'Study Group': 'bg-blue-500/10 text-blue-500',
  Seminar: 'bg-violet-500/10 text-violet-500',
  Workshop: 'bg-cyan-500/10 text-cyan-500',
  Cultural: 'bg-rose-500/10 text-rose-500',
  Sports: 'bg-emerald-500/10 text-emerald-500',
  Social: 'bg-amber-500/10 text-amber-500',
  General: 'bg-slate-500/10 text-slate-500',
};

const CAT_ICONS: Record<string, React.ReactNode> = {
  Hackathon: <Rocket size={11} />,
  'Study Group': <BookOpen size={11} />,
  Seminar: <Mic size={11} />,
  Workshop: <Zap size={11} />,
  Cultural: <Music size={11} />,
  Sports: <Dumbbell size={11} />,
  Social: <Users size={11} />,
  General: <Calendar size={11} />,
};

interface EventFormState {
  title: string;
  description: string;
  category: string;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  college: string;
  maxSeats: string;
  isOnline: boolean;
  link: string;
}

const blank: EventFormState = {
  title: '', description: '', category: 'General', date: '', time: '',
  venue: '', organizer: '', college: '', maxSeats: '', isOnline: false, link: '',
};

export default function EventsSection({ currentUser, allUsers, darkMode, onViewUserProfile }: EventsSectionProps) {
  const [events, setEvents] = useState<CampusEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CampusEvent | null>(null);
  const [form, setForm] = useState<EventFormState>(blank);
  const [saving, setSaving] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CampusEvent | null>(null);

  useEffect(() => {
    api.events.getAll()
      .then((data: CampusEvent[]) => setEvents(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return events.filter(e => {
      const matchSearch = search === '' || e.title.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase()) || e.organizer.toLowerCase().includes(search.toLowerCase());
      const matchCat = catFilter === 'All' || e.category === catFilter;
      return matchSearch && matchCat;
    });
  }, [events, search, catFilter]);

  const myEvents = events.filter(e => e.registeredIds.includes(currentUser.id) || e.organizerId === currentUser.id);

  const resetForm = () => { setForm(blank); setShowForm(false); setEditingEvent(null); };

  const startEdit = (ev: CampusEvent) => {
    setForm({
      title: ev.title, description: ev.description, category: ev.category,
      date: ev.date, time: ev.time, venue: ev.venue, organizer: ev.organizer,
      college: ev.college, maxSeats: ev.maxSeats?.toString() || '', isOnline: ev.isOnline, link: ev.link,
    });
    setEditingEvent(ev);
    setShowForm(true);
    setSelectedEvent(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim() || !form.date.trim()) return;
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        date: form.date.trim(),
        time: form.time.trim(),
        venue: form.venue.trim(),
        organizer: form.organizer.trim() || currentUser.fullName,
        organizerId: currentUser.id,
        college: form.college.trim() || currentUser.college,
        maxSeats: form.maxSeats ? parseInt(form.maxSeats) : null,
        isOnline: form.isOnline,
        link: form.link.trim(),
      };
      if (editingEvent) {
        const updated = await api.events.update(editingEvent.id, payload);
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? updated : e));
        if (selectedEvent?.id === editingEvent.id) setSelectedEvent(updated);
      } else {
        const created = await api.events.create(payload);
        setEvents(prev => [created, ...prev]);
      }
      resetForm();
    } catch {}
    setSaving(false);
  };

  const handleRegister = async (ev: CampusEvent) => {
    const isRegistered = ev.registeredIds.includes(currentUser.id);
    try {
      const updated = isRegistered
        ? await api.events.unregister(ev.id, currentUser.id)
        : await api.events.register(ev.id, currentUser.id);
      setEvents(prev => prev.map(e => e.id === ev.id ? updated : e));
      if (selectedEvent?.id === ev.id) setSelectedEvent(updated);
    } catch {}
  };

  const handleDelete = async (ev: CampusEvent) => {
    if (!confirm(`Delete "${ev.title}"?`)) return;
    try {
      await api.events.delete(ev.id);
      setEvents(prev => prev.filter(e => e.id !== ev.id));
      if (selectedEvent?.id === ev.id) setSelectedEvent(null);
    } catch {}
  };

  const card = `rounded-2xl border ${darkMode ? 'bg-[#121217] border-white/10' : 'bg-white border-neutral-200'}`;

  // ── Detail Modal ──────────────────────────────────────────────────────────────
  if (selectedEvent) {
    const ev = selectedEvent;
    const isRegistered = ev.registeredIds.includes(currentUser.id);
    const isOrganizer = ev.organizerId === currentUser.id;
    const spotsLeft = ev.maxSeats ? ev.maxSeats - ev.registeredIds.length : null;
    const isFull = spotsLeft !== null && spotsLeft <= 0;
    const registeredUsers = ev.registeredIds.map(id => allUsers.find(u => u.id === id)).filter(Boolean) as UserProfile[];

    return (
      <div className="flex-1 min-w-0 space-y-4 pb-10">
        <button onClick={() => setSelectedEvent(null)} className={`flex items-center gap-1.5 text-xs font-semibold cursor-pointer hover:opacity-70 transition-opacity ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <ChevronLeft size={14} />Back to Events
        </button>

        <div className={`${card} overflow-hidden`}>
          {/* Hero banner */}
          <div className={`h-24 bg-gradient-to-r ${ev.category === 'Hackathon' ? 'from-orange-500 to-rose-500' : ev.category === 'Study Group' ? 'from-blue-500 to-indigo-500' : ev.category === 'Seminar' ? 'from-violet-500 to-purple-600' : ev.category === 'Workshop' ? 'from-cyan-500 to-teal-500' : ev.category === 'Cultural' ? 'from-pink-500 to-rose-500' : ev.category === 'Sports' ? 'from-emerald-500 to-green-600' : 'from-indigo-500 to-purple-500'} relative flex items-center px-6`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white">
                {CAT_ICONS[ev.category] || <Calendar size={20} />}
              </div>
              <div>
                <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-bold uppercase">{ev.category}</span>
                {ev.isOnline && <span className="ml-1.5 px-2 py-0.5 rounded bg-white/20 text-white text-[9px] font-bold">🌐 Online</span>}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <h2 className={`font-bold text-base leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ev.title}</h2>
              {isOrganizer && (
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => startEdit(ev)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 cursor-pointer transition-all"><Pencil size={12} /></button>
                  <button onClick={() => handleDelete(ev)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all"><Trash2 size={12} /></button>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon: <Calendar size={12} />, text: ev.date },
                ev.time && { icon: <Clock size={12} />, text: ev.time },
                ev.venue && { icon: <MapPin size={12} />, text: ev.venue },
                ev.college && { icon: <Award size={12} />, text: ev.college },
              ].filter(Boolean).map((item: any, i) => (
                <div key={i} className={`flex items-center gap-2 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <span className="text-indigo-500 shrink-0">{item.icon}</span>
                  {item.text}
                </div>
              ))}
            </div>

            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{ev.description}</p>

            {/* Organizer */}
            <div className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-neutral-50'}`}>
              {(() => {
                const org = allUsers.find(u => u.id === ev.organizerId);
                return org ? (
                  <>
                    <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 font-bold text-xs shrink-0">
                      <Avatar avatar={org.avatar} />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{org.fullName}</p>
                      <p className="text-[10px] text-slate-400">{org.branch} · {org.college}</p>
                    </div>
                    <button onClick={() => { setSelectedEvent(null); onViewUserProfile?.(org.id); }} className="ml-auto text-[10px] text-indigo-500 font-semibold cursor-pointer hover:underline">
                      View Profile
                    </button>
                  </>
                ) : (
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>By {ev.organizer}</p>
                );
              })()}
            </div>

            {/* Seats + link */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className={`text-[10px] font-mono uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Seats</p>
                <p className={`text-sm font-bold ${isFull ? 'text-rose-500' : (darkMode ? 'text-white' : 'text-slate-900')}`}>
                  {ev.registeredIds.length} registered{ev.maxSeats ? ` / ${ev.maxSeats} max` : ''}
                  {isFull && ' · FULL'}
                </p>
              </div>
              {ev.link && (
                <a href={ev.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-indigo-500 border border-indigo-500/30 hover:bg-indigo-500/10 cursor-pointer transition-all">
                  <Link size={11} />Event Link <ExternalLink size={9} />
                </a>
              )}
            </div>

            {/* Register button */}
            {!isOrganizer && (
              <button
                onClick={() => handleRegister(ev)}
                disabled={isFull && !isRegistered}
                className={`w-full py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${isRegistered ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20' : isFull ? 'bg-neutral-100 dark:bg-white/5 text-slate-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'}`}
              >
                {isRegistered ? '✓ Registered — Click to cancel' : isFull ? 'Event Full' : '🎟 Register for this Event'}
              </button>
            )}

            {/* Registered attendees */}
            {registeredUsers.length > 0 && (
              <div>
                <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Attendees ({registeredUsers.length})</p>
                <div className="flex flex-wrap gap-2">
                  {registeredUsers.slice(0, 12).map(u => (
                    <button key={u.id} onClick={() => { setSelectedEvent(null); onViewUserProfile?.(u.id); }} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-[10px] cursor-pointer hover:opacity-80 transition-all ${darkMode ? 'border-white/10 bg-white/5 text-slate-300' : 'border-neutral-200 bg-neutral-50 text-slate-700'}`}>
                      <div className="w-3.5 h-3.5 rounded-full overflow-hidden"><Avatar avatar={u.avatar} /></div>
                      {u.fullName.split(' ')[0]}
                    </button>
                  ))}
                  {registeredUsers.length > 12 && <span className={`text-[10px] self-center ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>+{registeredUsers.length - 12} more</span>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            <Calendar size={18} className="text-rose-500" />Campus Events
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Discover, register, and host campus events</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingEvent(null); setForm({ ...blank, college: currentUser.college, organizer: currentUser.fullName }); }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold cursor-pointer transition-all"
        >
          <Plus size={13} />Post Event
        </button>
      </div>

      {/* My registered events summary */}
      {myEvents.length > 0 && (
        <div className={`${card} p-4`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Your Events ({myEvents.length})</p>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {myEvents.map(ev => (
              <button key={ev.id} onClick={() => setSelectedEvent(ev)} className={`shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border cursor-pointer hover:opacity-80 transition-all text-left ${darkMode ? 'border-white/10 bg-white/5' : 'border-neutral-200 bg-neutral-50'}`}>
                <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold ${CAT_COLORS[ev.category] || 'bg-slate-100 text-slate-500'}`}>{CAT_ICONS[ev.category]}{ev.category}</span>
                <span className={`text-[11px] font-semibold truncate max-w-32 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ev.title}</span>
                {ev.organizerId === currentUser.id && <span className="text-[8px] font-bold text-amber-500">Owner</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Create / Edit Form */}
      {showForm && (
        <div className={`${card} p-5`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-slate-900'}`}>{editingEvent ? '✏️ Edit Event' : '📅 Post a New Event'}</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X size={14} /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title *" required className={`px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50' : 'bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300'}`} />
              <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={`px-3 py-2 rounded-xl border text-xs outline-none cursor-pointer ${darkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-neutral-200 text-slate-900'}`}>
                {EVENT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your event — what's it about, who should attend? *" required rows={3} className={`w-full px-3 py-2 rounded-xl border text-xs outline-none resize-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-indigo-500/50' : 'bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-300'}`} />
            <div className="grid sm:grid-cols-3 gap-3">
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} required className={`px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-neutral-200 text-slate-900'}`} />
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className={`px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-neutral-200 text-slate-900'}`} />
              <input value={form.maxSeats} onChange={e => setForm(p => ({ ...p, maxSeats: e.target.value }))} placeholder="Max seats (optional)" type="number" min="1" className={`px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400'}`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={form.venue} onChange={e => setForm(p => ({ ...p, venue: e.target.value }))} placeholder="Venue / location" className={`px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400'}`} />
              <input value={form.college} onChange={e => setForm(p => ({ ...p, college: e.target.value }))} placeholder="College / open to all" className={`px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400'}`} />
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <input value={form.link} onChange={e => setForm(p => ({ ...p, link: e.target.value }))} placeholder="Event link / meeting URL" className={`px-3 py-2 rounded-xl border text-xs outline-none ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-slate-500' : 'bg-white border-neutral-200 text-slate-900 placeholder:text-slate-400'}`} />
              <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
                <input type="checkbox" checked={form.isOnline} onChange={e => setForm(p => ({ ...p, isOnline: e.target.checked }))} className="w-3.5 h-3.5 rounded text-indigo-500" />
                <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Online event</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-neutral-100'}`}>Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold cursor-pointer disabled:opacity-50">
                {saving ? 'Saving...' : editingEvent ? 'Save Changes' : 'Post Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border ${darkMode ? 'bg-white/5 border-white/10' : 'bg-white border-neutral-200'}`}>
          <Search size={13} className="text-slate-400 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search events..." className={`flex-1 text-xs bg-transparent outline-none ${darkMode ? 'text-white placeholder:text-slate-500' : 'text-slate-900 placeholder:text-slate-400'}`} />
          {search && <button onClick={() => setSearch('')} className="text-slate-400 cursor-pointer"><X size={11} /></button>}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {['All', ...EVENT_CATEGORIES].map(cat => (
          <button key={cat} onClick={() => setCatFilter(cat)} className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all cursor-pointer ${catFilter === cat ? 'bg-indigo-500 text-white' : (darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-neutral-100 text-slate-500 hover:bg-neutral-200')}`}>
            {cat !== 'All' && CAT_ICONS[cat]}{cat}
          </button>
        ))}
      </div>

      {/* Event Cards */}
      {loading ? (
        <div className={`${card} p-10 text-center`}>
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Loading events...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${card} p-10 text-center`}>
          <Calendar size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-sm font-semibold text-slate-400">No events yet</p>
          <p className="text-[11px] text-slate-400 mt-1">Be the first to post a campus event!</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(ev => {
            const isRegistered = ev.registeredIds.includes(currentUser.id);
            const isOrganizer = ev.organizerId === currentUser.id;
            const spotsLeft = ev.maxSeats ? ev.maxSeats - ev.registeredIds.length : null;
            const isFull = spotsLeft !== null && spotsLeft <= 0 && !isRegistered;

            return (
              <div key={ev.id} className={`${card} p-4 flex flex-col gap-3 hover:shadow-md transition-all group`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${CAT_COLORS[ev.category] || 'bg-slate-100 text-slate-500'}`}>
                        {CAT_ICONS[ev.category]}{ev.category}
                      </span>
                      {ev.isOnline && <span className="text-[9px] font-bold text-slate-400">🌐 Online</span>}
                      {isRegistered && <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-500"><CheckCircle2 size={9} />Registered</span>}
                    </div>
                    <h3 className={`font-bold text-xs leading-snug group-hover:text-indigo-500 transition-colors ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ev.title}</h3>
                  </div>
                  {isOrganizer && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={e => { e.stopPropagation(); startEdit(ev); }} className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-500/10 cursor-pointer transition-all"><Pencil size={9} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(ev); }} className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-all"><Trash2 size={9} /></button>
                    </div>
                  )}
                </div>

                <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ev.description}
                </p>

                <div className="flex flex-col gap-1">
                  <div className={`flex items-center gap-1.5 text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Calendar size={9} className="text-indigo-500" />{ev.date}{ev.time && ` · ${ev.time}`}
                  </div>
                  {ev.venue && <div className={`flex items-center gap-1.5 text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}><MapPin size={9} className="text-rose-500" />{ev.venue}</div>}
                  {ev.college && <div className={`flex items-center gap-1.5 text-[10px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}><Award size={9} className="text-amber-500" />{ev.college}</div>}
                </div>

                <div className="flex items-center justify-between mt-auto pt-2 border-t border-neutral-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {ev.registeredIds.slice(0, 4).map(uid => {
                        const u = allUsers.find(x => x.id === uid);
                        return u ? <div key={uid} className={`w-4 h-4 rounded-full border-2 ${darkMode ? 'border-[#121217]' : 'border-white'} overflow-hidden bg-indigo-100 dark:bg-indigo-900/30`}><Avatar avatar={u.avatar} /></div> : null;
                      })}
                    </div>
                    <span className={`text-[9px] font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {ev.registeredIds.length}{ev.maxSeats ? `/${ev.maxSeats}` : ''} going
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setSelectedEvent(ev)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${darkMode ? 'text-slate-400 hover:bg-white/5' : 'text-slate-500 hover:bg-neutral-100'}`}>
                      Details <ArrowRight size={8} />
                    </button>
                    {!isOrganizer && (
                      <button
                        onClick={() => handleRegister(ev)}
                        disabled={isFull}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold cursor-pointer transition-all ${isRegistered ? 'bg-emerald-500/10 text-emerald-500 hover:bg-rose-500/10 hover:text-rose-500' : isFull ? 'bg-neutral-100 dark:bg-white/5 text-slate-400 cursor-not-allowed' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                      >
                        {isRegistered ? '✓ Going' : isFull ? 'Full' : 'Register'}
                      </button>
                    )}
                    {isOrganizer && <span className="text-[9px] font-bold text-amber-500">Your event</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
