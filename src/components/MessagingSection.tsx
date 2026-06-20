import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Connection, DirectMessage, GroupChat, GroupMessage, CircleType } from '../types';
import {
  Send, Search, Users, ShieldCheck, MessageSquare, CheckCheck,
  ArrowLeft, Plus, X, Hash, BookOpen, Smile, Check, GraduationCap,
  Cpu, FileText, Lightbulb, Building2, ChevronDown
} from 'lucide-react';
import Avatar from './Avatar';
import { api } from '../api';

interface MessagingSectionProps {
  currentUser: UserProfile;
  connections: Connection[];
  allUsers: UserProfile[];
  messages: DirectMessage[];
  onSendMessage: (receiverId: string, content: string) => void;
  darkMode: boolean;
  preSelectedUserId?: string;
  onViewUserProfile?: (userId: string) => void;
  onMessagesRefresh?: () => void;
}

type ChatTab = 'dms' | 'circles';

const CIRCLE_TYPES: { type: CircleType; label: string; icon: React.ReactNode; color: string; hint: string }[] = [
  { type: 'college',  label: 'College Circle',  icon: <Building2 size={14} />,    color: 'text-indigo-500',  hint: 'e.g. NIT Trichy General' },
  { type: 'batch',    label: 'Batch Circle',     icon: <GraduationCap size={14} />, color: 'text-violet-500',  hint: 'e.g. NIT Trichy 2028' },
  { type: 'branch',   label: 'Branch Circle',    icon: <Cpu size={14} />,           color: 'text-sky-500',     hint: 'e.g. NIT Trichy EEE' },
  { type: 'course',   label: 'Course Circle',    icon: <BookOpen size={14} />,      color: 'text-emerald-500', hint: 'e.g. Signals & Systems' },
  { type: 'exam',     label: 'Exam Circle',      icon: <FileText size={14} />,      color: 'text-amber-500',   hint: 'e.g. GATE EEE 2027' },
  { type: 'interest', label: 'Interest Circle',  icon: <Lightbulb size={14} />,     color: 'text-rose-500',    hint: 'e.g. Startup Founders' },
];

function CircleIcon({ type, size = 16 }: { type: CircleType; size?: number }) {
  const map: Record<CircleType, React.ReactNode> = {
    college:  <Building2 size={size} />,
    batch:    <GraduationCap size={size} />,
    branch:   <Cpu size={size} />,
    course:   <BookOpen size={size} />,
    exam:     <FileText size={size} />,
    interest: <Lightbulb size={size} />,
  };
  return <>{map[type] || <Hash size={size} />}</>;
}

function circleColor(type: CircleType) {
  const map: Record<CircleType, string> = {
    college:  'bg-indigo-500/10 text-indigo-500',
    batch:    'bg-violet-500/10 text-violet-500',
    branch:   'bg-sky-500/10 text-sky-500',
    course:   'bg-emerald-500/10 text-emerald-500',
    exam:     'bg-amber-500/10 text-amber-500',
    interest: 'bg-rose-500/10 text-rose-500',
  };
  return map[type] || 'bg-indigo-500/10 text-indigo-500';
}

export default function MessagingSection({
  currentUser,
  connections,
  allUsers,
  messages,
  onSendMessage,
  darkMode,
  preSelectedUserId,
  onViewUserProfile,
  onMessagesRefresh,
}: MessagingSectionProps) {
  const [tab, setTab] = useState<ChatTab>('dms');
  const [showMobileChat, setShowMobileChat] = useState(false);

  // ── DM state ──────────────────────────────────────────────────────────────
  const acceptedConns = connections.filter(
    c => (c.senderId === currentUser.id || c.receiverId === currentUser.id) && c.status === 'accepted'
  );
  const matchedUserIds = acceptedConns.map(c =>
    c.senderId === currentUser.id ? c.receiverId : c.senderId
  );
  const inboxUsers = allUsers.filter(u =>
    (matchedUserIds.includes(u.id) || u.id === preSelectedUserId) && !u.isSuspended && u.id !== currentUser.id
  );

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(() => {
    if (preSelectedUserId) return allUsers.find(u => u.id === preSelectedUserId) || inboxUsers[0] || null;
    return inboxUsers[0] || null;
  });
  const [chatSearch, setChatSearch] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  const dmBottomRef = useRef<HTMLDivElement>(null);

  // ── Circle state ──────────────────────────────────────────────────────────
  const [circles, setCircles] = useState<GroupChat[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<GroupChat | null>(null);
  const [circleMessages, setCircleMessages] = useState<GroupMessage[]>([]);
  const [circleTyped, setCircleTyped] = useState('');
  const circleBottomRef = useRef<HTMLDivElement>(null);
  const [circleSearch, setCircleSearch] = useState('');

  // ── Create circle modal ───────────────────────────────────────────────────
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleType, setNewCircleType] = useState<CircleType>('interest');
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteSelected, setInviteSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);

  const dmPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const circlePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load circles ──────────────────────────────────────────────────────────
  const loadCircles = useCallback(async () => {
    try {
      const all: GroupChat[] = await api.groupChats.getAll();
      const mine = all.filter(g =>
        (g.memberIds as string[]).includes(currentUser.id) ||
        (g.pendingIds as string[]).includes(currentUser.id)
      );
      setCircles(mine);
      if (selectedCircle) {
        const updated = mine.find(g => g.id === selectedCircle.id);
        if (updated) setSelectedCircle(updated);
      }
    } catch {}
  }, [currentUser.id]);

  useEffect(() => { loadCircles(); }, [loadCircles]);

  // ── Poll DMs every 4s ─────────────────────────────────────────────────────
  useEffect(() => {
    if (tab !== 'dms') { if (dmPollRef.current) clearInterval(dmPollRef.current); return; }
    dmPollRef.current = setInterval(() => { onMessagesRefresh?.(); }, 4000);
    return () => { if (dmPollRef.current) clearInterval(dmPollRef.current); };
  }, [tab, onMessagesRefresh]);

  // ── Poll circle messages every 4s ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedCircle || tab !== 'circles') {
      if (circlePollRef.current) clearInterval(circlePollRef.current);
      return;
    }
    const fetchMsgs = async () => {
      try {
        const msgs: GroupMessage[] = await api.groupChats.getMessages(selectedCircle.id);
        setCircleMessages(msgs);
      } catch {}
    };
    fetchMsgs();
    circlePollRef.current = setInterval(fetchMsgs, 4000);
    return () => { if (circlePollRef.current) clearInterval(circlePollRef.current); };
  }, [selectedCircle?.id, tab]);

  useEffect(() => { dmBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, selectedUser]);
  useEffect(() => { circleBottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [circleMessages, selectedCircle]);

  useEffect(() => {
    if (preSelectedUserId) {
      const matched = allUsers.find(u => u.id === preSelectedUserId);
      if (matched) { setSelectedUser(matched); setShowMobileChat(true); }
    }
  }, [preSelectedUserId, allUsers]);

  // ── DM helpers ────────────────────────────────────────────────────────────
  const unreadCount = (partnerId: string) =>
    messages.filter(m => m.senderId === partnerId && m.receiverId === currentUser.id && !m.isRead).length;

  const handleDMSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !typedMessage.trim() || currentUser.isSuspended) return;
    onSendMessage(selectedUser.id, typedMessage);
    setTypedMessage('');
  };

  const activeChatMessages = selectedUser
    ? messages
        .filter(m =>
          (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
          (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // ── Circle helpers ────────────────────────────────────────────────────────
  const handleCircleMsgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircle || !circleTyped.trim() || currentUser.isSuspended) return;
    const txt = circleTyped;
    setCircleTyped('');
    try {
      const msg: GroupMessage = await api.groupChats.sendMessage(selectedCircle.id, currentUser.id, txt);
      setCircleMessages(prev => [...prev, msg]);
    } catch {}
  };

  const handleAcceptCircle = async (id: string) => {
    try {
      const updated: GroupChat = await api.groupChats.accept(id, currentUser.id);
      setCircles(prev => prev.map(g => g.id === id ? updated : g));
    } catch {}
  };

  const handleDeclineCircle = async (id: string) => {
    try {
      await api.groupChats.decline(id, currentUser.id);
      setCircles(prev => prev.filter(g => g.id !== id));
    } catch {}
  };

  // ── Create circle ─────────────────────────────────────────────────────────
  const sameCollegeUsers = allUsers.filter(u =>
    u.id !== currentUser.id && !u.isSuspended
  );
  const inviteSearchResults = sameCollegeUsers.filter(u =>
    u.fullName.toLowerCase().includes(inviteSearch.toLowerCase()) ||
    u.college.toLowerCase().includes(inviteSearch.toLowerCase()) ||
    u.branch.toLowerCase().includes(inviteSearch.toLowerCase())
  ).slice(0, 8);

  const handleCreateCircle = async () => {
    if (!newCircleName.trim() || creating) return;
    setCreating(true);
    try {
      const created: GroupChat = await api.groupChats.create({
        name: newCircleName.trim(),
        type: newCircleType,
        creatorId: currentUser.id,
        college: currentUser.college,
        branch: currentUser.branch,
        inviteUserIds: inviteSelected,
      });
      setCircles(prev => [created, ...prev]);
      setShowCreateCircle(false);
      setNewCircleName('');
      setNewCircleType('interest');
      setInviteSelected([]);
      setInviteSearch('');
      setSelectedCircle(created);
      setShowMobileChat(true);
    } catch {}
    setCreating(false);
  };

  const pendingCircles = circles.filter(g => (g.pendingIds as string[]).includes(currentUser.id));
  const memberCircles  = circles.filter(g => (g.memberIds as string[]).includes(currentUser.id));

  const filteredInbox = inboxUsers.filter(u =>
    u.fullName.toLowerCase().includes(chatSearch.toLowerCase()) ||
    u.college.toLowerCase().includes(chatSearch.toLowerCase())
  );

  // Group member circles by type for the structured sidebar
  const circlesByType: Partial<Record<CircleType, GroupChat[]>> = {};
  for (const c of memberCircles) {
    if (!circlesByType[c.type]) circlesByType[c.type] = [];
    circlesByType[c.type]!.push(c);
  }

  const filteredMemberCircles = memberCircles.filter(g =>
    g.name.toLowerCase().includes(circleSearch.toLowerCase())
  );

  const selectedCTDef = CIRCLE_TYPES.find(t => t.type === newCircleType)!;
  const dm = darkMode;

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Create Circle Modal ───────────────────────────────────────────── */}
      {showCreateCircle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 dark:border-white/10 p-5 space-y-4 ${dm ? 'bg-[#121217] text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm uppercase tracking-wider">Create a Circle</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Structured group for your campus or interests</p>
              </div>
              <button onClick={() => setShowCreateCircle(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"><X size={15} /></button>
            </div>

            {/* Circle type picker */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Circle Type</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTypeDropdown(v => !v)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${dm ? 'bg-[#09090C] border-white/10' : 'bg-neutral-50 border-neutral-200'}`}
                >
                  <span className={`flex items-center gap-2 ${selectedCTDef.color}`}>
                    {selectedCTDef.icon}
                    {selectedCTDef.label}
                  </span>
                  <ChevronDown size={13} className="text-slate-400" />
                </button>
                {showTypeDropdown && (
                  <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-lg z-10 overflow-hidden ${dm ? 'bg-[#1c1c24] border-white/10' : 'bg-white border-neutral-200'}`}>
                    {CIRCLE_TYPES.map(ct => (
                      <button
                        key={ct.type}
                        type="button"
                        onClick={() => { setNewCircleType(ct.type); setShowTypeDropdown(false); }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold cursor-pointer transition-all text-left ${newCircleType === ct.type ? (dm ? 'bg-white/5' : 'bg-neutral-50') : ''} ${dm ? 'hover:bg-white/5' : 'hover:bg-neutral-50'}`}
                      >
                        <span className={ct.color}>{ct.icon}</span>
                        <div className="min-w-0">
                          <span className="block">{ct.label}</span>
                          <span className="text-[9px] text-slate-400 font-normal">{ct.hint}</span>
                        </div>
                        {newCircleType === ct.type && <Check size={12} className="ml-auto text-indigo-500 shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Circle Name</label>
              <input
                type="text"
                placeholder={selectedCTDef.hint}
                value={newCircleName}
                onChange={e => setNewCircleName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#09090C] text-white' : 'bg-neutral-50 text-slate-900'}`}
              />
            </div>

            {/* Invite */}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Invite Members (optional)</label>
              <input
                type="text"
                placeholder="Search by name, college, or branch..."
                value={inviteSearch}
                onChange={e => setInviteSearch(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2 ${dm ? 'bg-[#09090C] text-white' : 'bg-neutral-50 text-slate-900'}`}
              />
              {inviteSelected.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {inviteSelected.map(uid => {
                    const u = allUsers.find(x => x.id === uid);
                    return u ? (
                      <span key={uid} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500 text-[10px] font-bold">
                        {u.fullName.split(' ')[0]}
                        <button onClick={() => setInviteSelected(p => p.filter(x => x !== uid))} className="cursor-pointer"><X size={9} /></button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
              <div className="max-h-28 overflow-y-auto space-y-0.5">
                {inviteSearchResults.map(u => (
                  <div
                    key={u.id}
                    onClick={() => setInviteSelected(p => p.includes(u.id) ? p.filter(x => x !== u.id) : [...p, u.id])}
                    className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${inviteSelected.includes(u.id) ? 'bg-indigo-500/10' : (dm ? 'hover:bg-white/5' : 'hover:bg-neutral-100')}`}
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden shrink-0">
                      <Avatar avatar={u.avatar} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{u.fullName}</p>
                      <p className="text-[9px] text-slate-400 truncate">{u.college} · {u.branch}</p>
                    </div>
                    {inviteSelected.includes(u.id) && <Check size={12} className="text-indigo-500 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowCreateCircle(false)} className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${dm ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-neutral-200 text-slate-600 hover:bg-neutral-100'}`}>Cancel</button>
              <button
                onClick={handleCreateCircle}
                disabled={!newCircleName.trim() || creating}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 cursor-pointer transition-all"
              >
                {creating ? 'Creating…' : `Create${inviteSelected.length > 0 ? ` & Invite ${inviteSelected.length}` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Container ────────────────────────────────────────────────── */}
      <div
        className={`flex-1 rounded-2xl border border-neutral-200 dark:border-white/10 flex overflow-hidden shadow-sm min-h-0 ${dm ? 'bg-[#121217]' : 'bg-white text-slate-800'}`}
        style={{ height: 'clamp(420px, 70vh, 640px)' }}
      >
        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-neutral-200 dark:border-white/5 flex-col shrink-0 ${dm ? 'bg-[#09090C]' : 'bg-neutral-50/50'}`}>

          {/* Tabs */}
          <div className={`flex border-b border-neutral-200 dark:border-white/5 shrink-0`}>
            <button
              onClick={() => setTab('dms')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 ${tab === 'dms' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <MessageSquare size={11} /> Direct
            </button>
            <button
              onClick={() => setTab('circles')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1 relative ${tab === 'circles' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <Hash size={11} /> Circles
              {pendingCircles.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold leading-none">{pendingCircles.length}</span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* ── DM LIST ── */}
            {tab === 'dms' && (
              <div className="p-3 space-y-2.5">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={12} /></span>
                  <input type="text" placeholder="Search chats…" value={chatSearch} onChange={e => setChatSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#121217] text-white' : 'bg-white'}`} />
                </div>

                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 px-1">Connections Inbox</p>

                {filteredInbox.length === 0 ? (
                  <div className="text-center p-6 space-y-2">
                    <Users size={20} className="mx-auto text-neutral-400" />
                    <p className="text-[10px] text-slate-400">No connections yet. Connect with people in Discovery!</p>
                  </div>
                ) : filteredInbox.map(user => {
                  const unread = unreadCount(user.id);
                  const paired = messages.filter(m =>
                    (m.senderId === currentUser.id && m.receiverId === user.id) ||
                    (m.senderId === user.id && m.receiverId === currentUser.id)
                  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                  const lastMsg = paired[0];
                  const isSel = selectedUser?.id === user.id;

                  return (
                    <div
                      key={user.id}
                      onClick={() => { setSelectedUser(user); setShowMobileChat(true); }}
                      className={`p-3 rounded-xl flex items-start gap-2.5 cursor-pointer transition-all border ${isSel ? (dm ? 'bg-[#1c1c24] border-indigo-500/20' : 'bg-indigo-500/[0.04] border-indigo-100') : 'hover:bg-neutral-500/5 border-transparent'}`}
                    >
                      <div className="relative shrink-0">
                        <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600">
                          <div className={`w-9 h-9 rounded-full border-2 border-white dark:border-[#09090C] flex items-center justify-center font-bold text-xs overflow-hidden ${dm ? 'bg-[#121217]' : 'bg-white'}`}>
                            <Avatar avatar={user.avatar} />
                          </div>
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#09090C]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-bold tracking-tight truncate">{user.fullName}</h4>
                          {unread > 0 && <span className="py-0.5 px-1.5 rounded-full text-[8px] font-bold bg-indigo-500 text-white animate-pulse shrink-0">{unread}</span>}
                        </div>
                        <p className="text-[10px] truncate text-slate-400">{user.college}</p>
                        {lastMsg && <p className="text-[9.5px] truncate italic mt-0.5 opacity-60">{lastMsg.senderId === currentUser.id ? 'You: ' : ''}{lastMsg.content}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── CIRCLE LIST ── */}
            {tab === 'circles' && (
              <div className="p-3 space-y-3">
                <button
                  onClick={() => setShowCreateCircle(true)}
                  className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-dashed border-indigo-400/40 text-indigo-400 hover:bg-indigo-500/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={11} /> New Circle
                </button>

                {/* Search circles */}
                {memberCircles.length > 2 && (
                  <div className="relative">
                    <Search size={11} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="text" placeholder="Search circles…" value={circleSearch} onChange={e => setCircleSearch(e.target.value)}
                      className={`w-full pl-7 pr-3 py-1.5 rounded-xl text-xs border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#121217] text-white' : 'bg-white'}`} />
                  </div>
                )}

                {/* Pending invites */}
                {pendingCircles.length > 0 && (
                  <>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-amber-500 px-1">Pending Invites</p>
                    {pendingCircles.map(g => (
                      <div key={g.id} className={`p-3 rounded-xl border ${dm ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-2 mb-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${circleColor(g.type as CircleType)}`}>
                            <CircleIcon type={g.type as CircleType} size={14} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{g.name}</p>
                            <p className="text-[9px] text-slate-400">{CIRCLE_TYPES.find(t => t.type === g.type)?.label}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAcceptCircle(g.id)} className="flex-1 py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold cursor-pointer hover:bg-indigo-600 flex items-center justify-center gap-1"><Check size={11} /> Join</button>
                          <button onClick={() => handleDeclineCircle(g.id)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 ${dm ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-neutral-100 text-slate-500 hover:bg-neutral-200'}`}><X size={11} /> Decline</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Circles grouped by type */}
                {Object.entries(circlesByType).length > 0 && (
                  <>
                    {(Object.entries(circlesByType) as [CircleType, GroupChat[]][])
                      .filter(([, gs]) => circleSearch === '' || gs.some(g => g.name.toLowerCase().includes(circleSearch.toLowerCase())))
                      .map(([type, gs]) => {
                        const def = CIRCLE_TYPES.find(t => t.type === type)!;
                        const filtered = circleSearch ? gs.filter(g => g.name.toLowerCase().includes(circleSearch.toLowerCase())) : gs;
                        if (!filtered.length) return null;
                        return (
                          <div key={type}>
                            <div className={`flex items-center gap-1.5 mb-1.5 px-1 ${def.color}`}>
                              <span className="flex-shrink-0">{def.icon}</span>
                              <p className="text-[9px] uppercase font-bold tracking-widest">{def.label}s</p>
                            </div>
                            <div className="space-y-0.5">
                              {filtered.map(g => {
                                const isSel = selectedCircle?.id === g.id;
                                return (
                                  <div
                                    key={g.id}
                                    onClick={() => { setSelectedCircle(g); setShowMobileChat(true); }}
                                    className={`px-3 py-2.5 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all border ${isSel ? (dm ? 'bg-[#1c1c24] border-indigo-500/20' : 'bg-indigo-500/[0.04] border-indigo-100') : 'hover:bg-neutral-500/5 border-transparent'}`}
                                  >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${circleColor(g.type as CircleType)}`}>
                                      <CircleIcon type={g.type as CircleType} size={14} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold truncate">{g.name}</p>
                                      <p className="text-[9px] text-slate-400">{(g.memberIds as string[]).length} members</p>
                                    </div>
                                    <Hash size={10} className="text-slate-400 shrink-0" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                  </>
                )}

                {memberCircles.length === 0 && pendingCircles.length === 0 && (
                  <div className="text-center p-6 space-y-2">
                    <Hash size={20} className="mx-auto text-neutral-400" />
                    <p className="text-[10px] text-slate-400 leading-relaxed">No circles yet.<br />Create one to start a structured group with your college mates!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className={`p-3 border-t border-neutral-200 dark:border-white/5 text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1.5 opacity-60 shrink-0 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
            <span>Campus Restrict · Match Active</span>
          </div>
        </div>

        {/* ── RIGHT PANEL (chat) ─────────────────────────────────────────── */}
        <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col min-w-0 ${dm ? 'bg-[#121217]' : 'bg-white'}`}>

          {/* ── DM PANE ── */}
          {tab === 'dms' && (
            selectedUser ? (
              <>
                <div className={`px-3 py-3 border-b border-neutral-200 dark:border-white/5 flex items-center gap-2 shrink-0 ${dm ? 'bg-[#1c1c24]/50' : 'bg-neutral-50/50'}`}>
                  <button className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer shrink-0" onClick={() => setShowMobileChat(false)}>
                    <ArrowLeft size={15} />
                  </button>
                  <div onClick={() => onViewUserProfile?.(selectedUser.id)} className={`flex gap-2.5 items-center flex-1 min-w-0 ${onViewUserProfile ? 'cursor-pointer hover:opacity-85' : ''}`}>
                    <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-zinc-900 text-white overflow-hidden">
                        <Avatar avatar={selectedUser.avatar} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-wide truncate">{selectedUser.fullName}</h3>
                      <p className="text-[10px] text-slate-400 truncate">{selectedUser.college} · {selectedUser.branch}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-mono text-slate-400 hidden sm:inline">Online</span>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                  {activeChatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-8">
                      <MessageSquare className="text-indigo-400 mb-2" size={28} />
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-1">Start the conversation</p>
                      <p className="text-[10px] text-slate-400">Say hi to {selectedUser.fullName.split(' ')[0]}!</p>
                    </div>
                  ) : activeChatMessages.map(msg => {
                    const self = msg.senderId === currentUser.id;
                    return (
                      <div key={msg.id} className={`flex ${self ? 'justify-end' : 'justify-start'}`}>
                        <div className="max-w-[78%] space-y-0.5">
                          <div className={`px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${self ? 'bg-indigo-500 text-white rounded-2xl rounded-tr-sm' : (dm ? 'bg-[#1c1c24] text-slate-100 rounded-2xl rounded-tl-sm' : 'bg-neutral-100 text-slate-800 rounded-2xl rounded-tl-sm')}`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 text-[9px] font-mono opacity-50 ${self ? 'justify-end' : 'justify-start'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {self && <CheckCheck size={10} className="text-indigo-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={dmBottomRef} />
                </div>

                <form onSubmit={handleDMSubmit} className={`px-3 py-2.5 border-t border-neutral-200 dark:border-white/5 flex gap-2 items-center shrink-0 ${dm ? 'bg-[#09090C]' : 'bg-white'}`}>
                  <input type="text" required disabled={currentUser.isSuspended}
                    placeholder={currentUser.isSuspended ? 'Account suspended' : `Message ${selectedUser.fullName.split(' ')[0]}…`}
                    value={typedMessage} onChange={e => setTypedMessage(e.target.value)}
                    className={`flex-1 px-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#121217] text-white' : 'bg-neutral-50'}`} />
                  <button type="submit" disabled={currentUser.isSuspended} className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0">
                    <Send size={14} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                <MessageSquare className="text-neutral-400 mb-2" size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Select a conversation</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Pick a connection from the left to start chatting.</p>
              </div>
            )
          )}

          {/* ── CIRCLE PANE ── */}
          {tab === 'circles' && (
            selectedCircle && (selectedCircle.memberIds as string[]).includes(currentUser.id) ? (
              <>
                <div className={`px-3 py-3 border-b border-neutral-200 dark:border-white/5 flex items-center gap-2 shrink-0 ${dm ? 'bg-[#1c1c24]/50' : 'bg-neutral-50/50'}`}>
                  <button className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer shrink-0" onClick={() => setShowMobileChat(false)}>
                    <ArrowLeft size={15} />
                  </button>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${circleColor(selectedCircle.type as CircleType)}`}>
                    <CircleIcon type={selectedCircle.type as CircleType} size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wide truncate">{selectedCircle.name}</h3>
                    <p className="text-[10px] text-slate-400 truncate">
                      {CIRCLE_TYPES.find(t => t.type === selectedCircle.type)?.label} · {(selectedCircle.memberIds as string[]).length} members
                    </p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                  {circleMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-60 py-8">
                      <Hash className="text-indigo-400 mb-2" size={28} />
                      <p className="text-[9px] font-bold uppercase tracking-widest mb-1">{selectedCircle.name}</p>
                      <p className="text-[10px] text-slate-400">Be the first to post here!</p>
                    </div>
                  ) : circleMessages.map(msg => {
                    const self = msg.senderId === currentUser.id;
                    const sender = allUsers.find(u => u.id === msg.senderId);
                    return (
                      <div key={msg.id} className={`flex gap-2 ${self ? 'justify-end' : 'justify-start'}`}>
                        {!self && (
                          <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden shrink-0 mt-1">
                            <Avatar avatar={sender?.avatar || '?'} />
                          </div>
                        )}
                        <div className="max-w-[72%] space-y-0.5">
                          {!self && sender && (
                            <p className="text-[9px] font-bold text-slate-400 px-1">{sender.fullName.split(' ')[0]}</p>
                          )}
                          <div className={`px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${self ? 'bg-indigo-500 text-white rounded-2xl rounded-tr-sm' : (dm ? 'bg-[#1c1c24] text-slate-100 rounded-2xl rounded-tl-sm' : 'bg-neutral-100 text-slate-800 rounded-2xl rounded-tl-sm')}`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1 text-[9px] font-mono opacity-50 ${self ? 'justify-end' : 'justify-start'}`}>
                            <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={circleBottomRef} />
                </div>

                <form onSubmit={handleCircleMsgSubmit} className={`px-3 py-2.5 border-t border-neutral-200 dark:border-white/5 flex gap-2 items-center shrink-0 ${dm ? 'bg-[#09090C]' : 'bg-white'}`}>
                  <input type="text" required disabled={currentUser.isSuspended}
                    placeholder={currentUser.isSuspended ? 'Account suspended' : `Message ${selectedCircle.name}…`}
                    value={circleTyped} onChange={e => setCircleTyped(e.target.value)}
                    className={`flex-1 px-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#121217] text-white' : 'bg-neutral-50'}`} />
                  <button type="submit" disabled={currentUser.isSuspended} className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0">
                    <Send size={14} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                <Hash className="text-neutral-400 mb-2" size={32} />
                <p className="text-[10px] font-bold uppercase tracking-widest">Select a Circle</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">Pick a circle from the left, or create a new one.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
