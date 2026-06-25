import React, { useState, useEffect } from 'react';
import { UserProfile, Post, CampusEvent, Project, Community, GroupChat } from '../types';
import { api } from '../api';
import Avatar from './Avatar';
import {
  FileText, Calendar, Rocket, Users, MessageSquare,
  Trash2, Pencil, X, Check, Heart, MessageCircle,
  Globe, MapPin, Clock, Tag, ChevronRight, AlertTriangle,
  Lightbulb, Wrench, Zap, UserPlus, Crown
} from 'lucide-react';

interface MyContentSectionProps {
  currentUser: UserProfile;
  darkMode: boolean;
  posts: Post[];
  onDeletePost: (id: string) => void;
}

type Tab = 'posts' | 'events' | 'projects' | 'communities' | 'groups';

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: 'posts',       label: 'Posts',       icon: <FileText size={13} /> },
  { key: 'events',      label: 'Events',      icon: <Calendar size={13} /> },
  { key: 'projects',    label: 'Projects',    icon: <Rocket size={13} /> },
  { key: 'communities', label: 'Communities', icon: <Users size={13} /> },
  { key: 'groups',      label: 'Groups',      icon: <MessageSquare size={13} /> },
];

const STAGE_COLORS: Record<string, string> = {
  Idea:     'bg-amber-500/10 text-amber-600',
  Building: 'bg-blue-500/10 text-blue-600',
  MVP:      'bg-violet-500/10 text-violet-600',
  Launched: 'bg-emerald-500/10 text-emerald-600',
};
const STAGE_ICONS: Record<string, React.ReactNode> = {
  Idea:     <Lightbulb size={10} />,
  Building: <Wrench size={10} />,
  MVP:      <Zap size={10} />,
  Launched: <Globe size={10} />,
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function ConfirmDelete({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1"><AlertTriangle size={10} /> Delete?</span>
      <button onClick={onConfirm} className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-bold cursor-pointer border-0">Yes</button>
      <button onClick={onCancel}  className="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-white/10 text-[10px] font-bold cursor-pointer border-0">No</button>
    </div>
  );
}

export default function MyContentSection({ currentUser, darkMode, posts, onDeletePost }: MyContentSectionProps) {
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  const [events,      setEvents]      = useState<CampusEvent[]>([]);
  const [projects,    setProjects]    = useState<Project[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [groups,      setGroups]      = useState<GroupChat[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [deletingId,  setDeletingId]  = useState<string | null>(null);
  const [confirmId,   setConfirmId]   = useState<string | null>(null);

  const [editingEvent,   setEditingEvent]   = useState<CampusEvent | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const myPosts       = posts.filter(p => p.authorId === currentUser.id);
  const myEvents      = events.filter(e => e.organizerId === currentUser.id);
  const myProjects    = projects.filter(p => p.creatorId === currentUser.id);
  const myCommunities = communities.filter(c => c.creatorId === currentUser.id);
  const myGroups      = groups.filter(g => g.creatorId === currentUser.id);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.events.getAll(),
      api.projects.getAll(),
      api.communities.getAll(),
      api.groupChats.getAll(),
    ]).then(([ev, pr, co, gr]) => {
      setEvents(ev);
      setProjects(pr);
      setCommunities(co);
      setGroups(gr);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const counts: Record<Tab, number> = {
    posts:       myPosts.length,
    events:      myEvents.length,
    projects:    myProjects.length,
    communities: myCommunities.length,
    groups:      myGroups.length,
  };

  async function handleDeletePost(id: string) {
    setDeletingId(id);
    try { await api.posts.delete(id); onDeletePost(id); } catch {}
    setDeletingId(null); setConfirmId(null);
  }

  async function handleDeleteEvent(id: string) {
    setDeletingId(id);
    try { await api.events.delete(id); setEvents(p => p.filter(e => e.id !== id)); } catch {}
    setDeletingId(null); setConfirmId(null);
  }

  async function handleDeleteProject(id: string) {
    setDeletingId(id);
    try { await api.projects.delete(id); setProjects(p => p.filter(x => x.id !== id)); } catch {}
    setDeletingId(null); setConfirmId(null);
  }

  async function handleDeleteCommunity(id: string) {
    setDeletingId(id);
    try { await api.communities.delete(id); setCommunities(p => p.filter(c => c.id !== id)); } catch {}
    setDeletingId(null); setConfirmId(null);
  }

  async function handleDeleteGroup(id: string) {
    setDeletingId(id);
    try { await api.groupChats.delete(id); setGroups(p => p.filter(g => g.id !== id)); } catch {}
    setDeletingId(null); setConfirmId(null);
  }

  async function saveEvent() {
    if (!editingEvent) return;
    try {
      const updated = await api.events.update(editingEvent.id, {
        title: editingEvent.title,
        description: editingEvent.description,
        date: editingEvent.date,
        time: editingEvent.time,
        venue: editingEvent.venue,
        maxSeats: editingEvent.maxSeats,
      });
      setEvents(p => p.map(e => e.id === updated.id ? updated : e));
      setEditingEvent(null);
    } catch {}
  }

  async function saveProject() {
    if (!editingProject) return;
    try {
      const updated = await api.projects.update(editingProject.id, {
        title: editingProject.title,
        description: editingProject.description,
        stage: editingProject.stage,
        tags: editingProject.tags,
        lookingFor: editingProject.lookingFor,
      });
      setProjects(p => p.map(x => x.id === updated.id ? updated : x));
      setEditingProject(null);
    } catch {}
  }

  const card = `rounded-2xl border p-4 transition-all ${darkMode ? 'bg-white/3 border-white/8 hover:border-white/15' : 'bg-white border-neutral-200/80 hover:border-neutral-300/80'}`;
  const inputCls = `w-full rounded-xl border px-3 py-2 text-xs outline-none transition-all ${darkMode ? 'bg-white/5 border-white/10 text-white placeholder-white/30 focus:border-indigo-400' : 'bg-neutral-50 border-neutral-200 focus:border-indigo-400 text-slate-800'}`;

  function EmptyState({ label }: { label: string }) {
    return (
      <div className={`rounded-2xl border border-dashed p-10 flex flex-col items-center text-center gap-2 ${darkMode ? 'border-white/10' : 'border-neutral-200'}`}>
        <span className="text-3xl opacity-30">📭</span>
        <p className="text-xs font-semibold opacity-40">No {label} yet</p>
        <p className="text-[10px] opacity-30">Use the <strong>+ Create</strong> button in the header to add one</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-black uppercase tracking-wide">My Content</h1>
        <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Everything you've created — manage, edit, or delete from one place
        </p>
      </div>

      <div className={`flex gap-1 p-1 rounded-2xl border ${darkMode ? 'bg-white/3 border-white/8' : 'bg-neutral-100/80 border-neutral-200/60'}`}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border-0 ${
              activeTab === t.key
                ? 'bg-indigo-500 text-white shadow-sm'
                : darkMode ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-800 hover:bg-white'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
            {counts[t.key] > 0 && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${activeTab === t.key ? 'bg-white/20 text-white' : 'bg-indigo-500/15 text-indigo-500'}`}>
                {counts[t.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
      )}

      {!loading && activeTab === 'posts' && (
        <div className="space-y-3">
          {myPosts.length === 0 ? <EmptyState label="posts" /> : myPosts.map(p => (
            <div key={p.id} className={card}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center overflow-hidden">
                    <Avatar avatar={currentUser.avatar} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold leading-none">{currentUser.fullName}</p>
                    <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{timeAgo(p.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {confirmId === p.id ? (
                    <ConfirmDelete
                      onConfirm={() => handleDeletePost(p.id)}
                      onCancel={() => setConfirmId(null)}
                    />
                  ) : (
                    <button
                      onClick={() => setConfirmId(p.id)}
                      disabled={deletingId === p.id}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer border-0 bg-transparent"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>

              <p className={`mt-3 text-xs leading-relaxed line-clamp-3 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>{p.content}</p>

              {(p.academicTag || p.projectTitle || p.feeling) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {p.academicTag && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[9px] font-semibold">
                      <Tag size={8} />{p.academicTag}
                    </span>
                  )}
                  {p.projectTitle && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500 text-[9px] font-semibold">
                      <Rocket size={8} />{p.projectTitle}
                    </span>
                  )}
                  {p.feeling && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-semibold">
                      feeling {p.feeling}
                    </span>
                  )}
                </div>
              )}

              <div className={`mt-3 pt-3 border-t flex items-center gap-4 text-[10px] ${darkMode ? 'border-white/8 text-slate-500' : 'border-neutral-100 text-slate-400'}`}>
                <span className="flex items-center gap-1"><Heart size={10} /> {p.likes.length} likes</span>
                <span className="flex items-center gap-1"><MessageCircle size={10} /> {p.comments?.length ?? 0} comments</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'events' && (
        <div className="space-y-3">
          {myEvents.length === 0 ? <EmptyState label="events" /> : myEvents.map(ev => (
            <div key={ev.id} className={card}>
              {editingEvent?.id === ev.id ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Edit Event</p>
                  <input className={inputCls} value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value})} placeholder="Title" />
                  <textarea className={`${inputCls} resize-none`} rows={2} value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} placeholder="Description" />
                  <div className="grid grid-cols-2 gap-2">
                    <input className={inputCls} type="date" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} />
                    <input className={inputCls} type="time" value={editingEvent.time} onChange={e => setEditingEvent({...editingEvent, time: e.target.value})} />
                  </div>
                  <input className={inputCls} value={editingEvent.venue} onChange={e => setEditingEvent({...editingEvent, venue: e.target.value})} placeholder="Venue" />
                  <input className={inputCls} type="number" value={editingEvent.maxSeats ?? ''} onChange={e => setEditingEvent({...editingEvent, maxSeats: Number(e.target.value) || null})} placeholder="Max seats (optional)" />
                  <div className="flex gap-2">
                    <button onClick={saveEvent} className="flex-1 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-bold cursor-pointer border-0 flex items-center justify-center gap-1"><Check size={11} />Save</button>
                    <button onClick={() => setEditingEvent(null)} className="flex-1 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 text-xs font-bold cursor-pointer border-0"><X size={11} className="inline mr-1" />Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate">{ev.title}</p>
                      <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{ev.category} • {ev.college}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingEvent(ev)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer border-0 bg-transparent"><Pencil size={11} /></button>
                      {confirmId === ev.id ? (
                        <ConfirmDelete onConfirm={() => handleDeleteEvent(ev.id)} onCancel={() => setConfirmId(null)} />
                      ) : (
                        <button onClick={() => setConfirmId(ev.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer border-0 bg-transparent"><Trash2 size={11} /></button>
                      )}
                    </div>
                  </div>
                  <p className={`mt-2 text-[10px] leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{ev.description}</p>
                  <div className={`mt-3 pt-3 border-t flex flex-wrap gap-x-4 gap-y-1 text-[10px] ${darkMode ? 'border-white/8 text-slate-500' : 'border-neutral-100 text-slate-400'}`}>
                    <span className="flex items-center gap-1"><Clock size={9} />{ev.date}{ev.time ? ` at ${ev.time}` : ''}</span>
                    {ev.venue && <span className="flex items-center gap-1"><MapPin size={9} />{ev.venue}</span>}
                    <span className="flex items-center gap-1"><UserPlus size={9} />{ev.registeredIds.length}{ev.maxSeats ? `/${ev.maxSeats}` : ''} registered</span>
                    {ev.isOnline && <span className="flex items-center gap-1 text-emerald-500"><Globe size={9} />Online</span>}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'projects' && (
        <div className="space-y-3">
          {myProjects.length === 0 ? <EmptyState label="projects" /> : myProjects.map(pr => (
            <div key={pr.id} className={card}>
              {editingProject?.id === pr.id ? (
                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">Edit Project</p>
                  <input className={inputCls} value={editingProject.title} onChange={e => setEditingProject({...editingProject, title: e.target.value})} placeholder="Title" />
                  <textarea className={`${inputCls} resize-none`} rows={2} value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} placeholder="Description" />
                  <select className={inputCls} value={editingProject.stage} onChange={e => setEditingProject({...editingProject, stage: e.target.value as Project['stage']})}>
                    {(['Idea','Building','MVP','Launched'] as const).map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <div className="flex gap-2">
                    <button onClick={saveProject} className="flex-1 py-1.5 rounded-xl bg-indigo-500 text-white text-xs font-bold cursor-pointer border-0 flex items-center justify-center gap-1"><Check size={11} />Save</button>
                    <button onClick={() => setEditingProject(null)} className="flex-1 py-1.5 rounded-xl bg-neutral-200 dark:bg-white/10 text-xs font-bold cursor-pointer border-0"><X size={11} className="inline mr-1" />Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold truncate">{pr.title}</p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold ${STAGE_COLORS[pr.stage]}`}>
                          {STAGE_ICONS[pr.stage]}{pr.stage}
                        </span>
                      </div>
                      <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>{pr.memberIds.length} member{pr.memberIds.length !== 1 ? 's' : ''} • {timeAgo(pr.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => setEditingProject(pr)} className="p-1.5 rounded-lg text-indigo-400 hover:bg-indigo-500/10 transition-all cursor-pointer border-0 bg-transparent"><Pencil size={11} /></button>
                      {confirmId === pr.id ? (
                        <ConfirmDelete onConfirm={() => handleDeleteProject(pr.id)} onCancel={() => setConfirmId(null)} />
                      ) : (
                        <button onClick={() => setConfirmId(pr.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer border-0 bg-transparent"><Trash2 size={11} /></button>
                      )}
                    </div>
                  </div>
                  <p className={`mt-2 text-[10px] leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{pr.description}</p>
                  {pr.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {pr.tags.map(t => (
                        <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${darkMode ? 'bg-white/8 text-slate-300' : 'bg-neutral-100 text-slate-600'}`}>{t}</span>
                      ))}
                    </div>
                  )}
                  {pr.lookingFor.length > 0 && (
                    <div className={`mt-3 pt-3 border-t text-[10px] ${darkMode ? 'border-white/8 text-slate-500' : 'border-neutral-100 text-slate-400'}`}>
                      <span className="font-semibold">Looking for: </span>{pr.lookingFor.join(', ')}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'communities' && (
        <div className="space-y-3">
          {myCommunities.length === 0 ? <EmptyState label="communities" /> : myCommunities.map(c => (
            <div key={c.id} className={card}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-lg shrink-0">
                    {c.icon?.length <= 2 ? c.icon : '🌐'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{c.name}</p>
                    <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {c.category} • {c.memberIds.length} member{c.memberIds.length !== 1 ? 's' : ''}
                      {c.college ? ` • ${c.college}` : ' • Campus-wide'}
                    </p>
                  </div>
                </div>
                {confirmId === c.id ? (
                  <ConfirmDelete onConfirm={() => handleDeleteCommunity(c.id)} onCancel={() => setConfirmId(null)} />
                ) : (
                  <button onClick={() => setConfirmId(c.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer border-0 bg-transparent shrink-0"><Trash2 size={11} /></button>
                )}
              </div>
              <p className={`mt-2 text-[10px] leading-relaxed line-clamp-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{c.description}</p>
              {c.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map(t => (
                    <span key={t} className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${darkMode ? 'bg-white/8 text-slate-300' : 'bg-neutral-100 text-slate-600'}`}>{t}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && activeTab === 'groups' && (
        <div className="space-y-3">
          {myGroups.length === 0 ? <EmptyState label="groups" /> : myGroups.map(g => (
            <div key={g.id} className={card}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <MessageSquare size={15} className="text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold truncate">{g.name}</p>
                      <Crown size={10} className="text-amber-500 shrink-0" title="You created this" />
                    </div>
                    <p className={`text-[9px] mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                      {g.type} • {g.college} • {g.memberIds.length} member{g.memberIds.length !== 1 ? 's' : ''}
                      {g.pendingIds.length > 0 ? ` • ${g.pendingIds.length} pending` : ''}
                    </p>
                  </div>
                </div>
                {confirmId === g.id ? (
                  <ConfirmDelete onConfirm={() => handleDeleteGroup(g.id)} onCancel={() => setConfirmId(null)} />
                ) : (
                  <button onClick={() => setConfirmId(g.id)} className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer border-0 bg-transparent shrink-0"><Trash2 size={11} /></button>
                )}
              </div>
              {g.branch && (
                <p className={`mt-2 text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Branch: {g.branch}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
