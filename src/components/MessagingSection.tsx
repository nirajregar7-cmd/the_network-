import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, Connection, DirectMessage, GroupChat, GroupMessage } from '../types';
import {
  Send, Search, Users, ShieldCheck, MessageSquare, CheckCheck,
  ArrowLeft, Plus, X, Hash, BookOpen, Smile, UserPlus, Check, Trash2
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

type ChatTab = 'dms' | 'groups';

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

  // ── Group state ───────────────────────────────────────────────────────────
  const [groups, setGroups] = useState<GroupChat[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [groupTyped, setGroupTyped] = useState('');
  const groupBottomRef = useRef<HTMLDivElement>(null);

  // ── Create group modal ────────────────────────────────────────────────────
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<'class' | 'fun'>('fun');
  const [newGroupBranch, setNewGroupBranch] = useState('');
  const [inviteSearch, setInviteSearch] = useState('');
  const [inviteSelected, setInviteSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Polling refs
  const dmPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const groupPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load groups ───────────────────────────────────────────────────────────
  const loadGroups = useCallback(async () => {
    try {
      const all: GroupChat[] = await api.groupChats.getAll();
      const mine = all.filter(g =>
        (g.memberIds as string[]).includes(currentUser.id) ||
        (g.pendingIds as string[]).includes(currentUser.id)
      );
      setGroups(mine);
      if (selectedGroup) {
        const updated = mine.find(g => g.id === selectedGroup.id);
        if (updated) setSelectedGroup(updated);
      }
    } catch {}
  }, [currentUser.id]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  // ── Poll DMs every 4s when on DM tab ─────────────────────────────────────
  useEffect(() => {
    if (tab !== 'dms') {
      if (dmPollRef.current) clearInterval(dmPollRef.current);
      return;
    }
    dmPollRef.current = setInterval(() => {
      onMessagesRefresh?.();
    }, 4000);
    return () => { if (dmPollRef.current) clearInterval(dmPollRef.current); };
  }, [tab, onMessagesRefresh]);

  // ── Poll group messages every 4s when group is selected ──────────────────
  useEffect(() => {
    if (!selectedGroup || tab !== 'groups') {
      if (groupPollRef.current) clearInterval(groupPollRef.current);
      return;
    }
    const fetchGroupMsgs = async () => {
      try {
        const msgs: GroupMessage[] = await api.groupChats.getMessages(selectedGroup.id);
        setGroupMessages(msgs);
      } catch {}
    };
    fetchGroupMsgs();
    groupPollRef.current = setInterval(fetchGroupMsgs, 4000);
    return () => { if (groupPollRef.current) clearInterval(groupPollRef.current); };
  }, [selectedGroup?.id, tab]);

  // ── Auto scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    dmBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  useEffect(() => {
    groupBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, selectedGroup]);

  // ── Pre-selected user ─────────────────────────────────────────────────────
  useEffect(() => {
    if (preSelectedUserId) {
      const matched = allUsers.find(u => u.id === preSelectedUserId);
      if (matched) { setSelectedUser(matched); setShowMobileChat(true); }
    }
  }, [preSelectedUserId, allUsers]);

  // ── DM helpers ────────────────────────────────────────────────────────────
  const unreadCount = (partnerId: string) =>
    messages.filter(m => m.senderId === partnerId && m.receiverId === currentUser.id && !m.isRead).length;

  const handleDMSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !typedMessage.trim() || currentUser.isSuspended) return;
    const txt = typedMessage;
    setTypedMessage('');
    onSendMessage(selectedUser.id, txt);
  };

  const activeChatMessages = selectedUser
    ? messages
        .filter(m =>
          (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
          (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  // ── Group helpers ─────────────────────────────────────────────────────────
  const handleGroupMsgSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !groupTyped.trim() || currentUser.isSuspended) return;
    const txt = groupTyped;
    setGroupTyped('');
    try {
      const msg: GroupMessage = await api.groupChats.sendMessage(selectedGroup.id, currentUser.id, txt);
      setGroupMessages(prev => [...prev, msg]);
    } catch {}
  };

  const handleAcceptGroup = async (groupId: string) => {
    try {
      const updated: GroupChat = await api.groupChats.accept(groupId, currentUser.id);
      setGroups(prev => prev.map(g => g.id === groupId ? updated : g));
    } catch {}
  };

  const handleDeclineGroup = async (groupId: string) => {
    try {
      await api.groupChats.decline(groupId, currentUser.id);
      setGroups(prev => prev.filter(g => g.id !== groupId));
    } catch {}
  };

  // ── Create group ──────────────────────────────────────────────────────────
  const sameCollegeUsers = allUsers.filter(u =>
    u.id !== currentUser.id && u.college === currentUser.college && !u.isSuspended
  );
  const inviteSearchResults = sameCollegeUsers.filter(u =>
    u.fullName.toLowerCase().includes(inviteSearch.toLowerCase()) ||
    u.branch.toLowerCase().includes(inviteSearch.toLowerCase())
  ).slice(0, 10);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || creating) return;
    setCreating(true);
    try {
      const created: GroupChat = await api.groupChats.create({
        name: newGroupName.trim(),
        type: newGroupType,
        creatorId: currentUser.id,
        college: currentUser.college,
        branch: newGroupType === 'class' ? (newGroupBranch || currentUser.branch) : null,
        inviteUserIds: inviteSelected,
      });
      setGroups(prev => [created, ...prev]);
      setShowCreateGroup(false);
      setNewGroupName('');
      setNewGroupType('fun');
      setNewGroupBranch('');
      setInviteSelected([]);
      setInviteSearch('');
      setSelectedGroup(created);
      setShowMobileChat(true);
    } catch {}
    setCreating(false);
  };

  // ── Pending group invites for current user ────────────────────────────────
  const pendingGroups = groups.filter(g => (g.pendingIds as string[]).includes(currentUser.id));
  const memberGroups = groups.filter(g => (g.memberIds as string[]).includes(currentUser.id));

  const filteredInbox = inboxUsers.filter(u =>
    u.fullName.toLowerCase().includes(chatSearch.toLowerCase()) ||
    u.college.toLowerCase().includes(chatSearch.toLowerCase())
  );

  const dm = darkMode;

  // ── Layout shared classes ─────────────────────────────────────────────────
  const listPanelCls = `w-full md:w-80 border-r border-neutral-200 dark:border-white/5 flex flex-col shrink-0 ${dm ? 'bg-[#09090C]' : 'bg-neutral-50/50'}`;
  const chatPanelCls = `flex-1 flex flex-col ${dm ? 'bg-[#121217]' : 'bg-white'}`;

  return (
    <div className={`flex flex-col h-full min-h-0`}>
      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl shadow-xl border border-neutral-200 dark:border-white/10 p-5 space-y-4 ${dm ? 'bg-[#121217] text-white' : 'bg-white text-slate-900'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm uppercase tracking-wider">Create Group</h3>
              <button onClick={() => setShowCreateGroup(false)} className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer"><X size={16} /></button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Group Name</label>
                <input
                  type="text"
                  placeholder="e.g. CSE 3rd Year Batch, Fun Crew..."
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#09090C] text-white' : 'bg-neutral-50 text-slate-900'}`}
                />
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewGroupType('class')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${newGroupType === 'class' ? 'bg-indigo-500 text-white border-transparent' : (dm ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-neutral-200 text-slate-600 hover:bg-neutral-100')}`}
                  >
                    <BookOpen size={13} /> Class Group
                  </button>
                  <button
                    onClick={() => setNewGroupType('fun')}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${newGroupType === 'fun' ? 'bg-indigo-500 text-white border-transparent' : (dm ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-neutral-200 text-slate-600 hover:bg-neutral-100')}`}
                  >
                    <Smile size={13} /> Fun Group
                  </button>
                </div>
              </div>

              {newGroupType === 'class' && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Branch (optional)</label>
                  <input
                    type="text"
                    placeholder={currentUser.branch}
                    value={newGroupBranch}
                    onChange={e => setNewGroupBranch(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#09090C] text-white' : 'bg-neutral-50 text-slate-900'}`}
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Invite from {currentUser.college}
                </label>
                <input
                  type="text"
                  placeholder="Search by name or branch..."
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
                          <button onClick={() => setInviteSelected(prev => prev.filter(x => x !== uid))} className="cursor-pointer"><X size={10} /></button>
                        </span>
                      ) : null;
                    })}
                  </div>
                )}
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {inviteSearchResults.map(u => (
                    <div
                      key={u.id}
                      onClick={() => setInviteSelected(prev =>
                        prev.includes(u.id) ? prev.filter(x => x !== u.id) : [...prev, u.id]
                      )}
                      className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-all ${inviteSelected.includes(u.id) ? 'bg-indigo-500/10 border border-indigo-500/20' : (dm ? 'hover:bg-white/5' : 'hover:bg-neutral-100')}`}
                    >
                      <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden shrink-0">
                        <Avatar avatar={u.avatar} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{u.fullName}</p>
                        <p className="text-[9px] text-slate-400 truncate">{u.branch} • Year {u.year}</p>
                      </div>
                      {inviteSelected.includes(u.id) && <Check size={13} className="text-indigo-500 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowCreateGroup(false)}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${dm ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-neutral-200 text-slate-600 hover:bg-neutral-100'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || creating}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 cursor-pointer transition-all"
              >
                {creating ? 'Creating...' : `Create${inviteSelected.length > 0 ? ` & Invite ${inviteSelected.length}` : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Container */}
      <div className={`flex-1 rounded-2xl border border-neutral-200 dark:border-white/10 flex overflow-hidden shadow-sm min-h-0 ${dm ? 'bg-[#121217]' : 'bg-white text-slate-800'}`}
        style={{ height: 'clamp(420px, 70vh, 640px)' }}>

        {/* LEFT PANEL (list) — hidden on mobile when chat is open */}
        <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} ${listPanelCls} flex-col`}>
          {/* Tabs */}
          <div className={`flex border-b border-neutral-200 dark:border-white/5 ${dm ? 'bg-[#09090C]' : 'bg-neutral-50/50'}`}>
            <button
              onClick={() => setTab('dms')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${tab === 'dms' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
            >
              <MessageSquare size={12} className="inline mr-1" />Direct
            </button>
            <button
              onClick={() => setTab('groups')}
              className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${tab === 'groups' ? 'border-indigo-500 text-indigo-500' : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'} relative`}
            >
              <Users size={12} className="inline mr-1" />Groups
              {pendingGroups.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[8px] font-bold">{pendingGroups.length}</span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* ── DM LIST ── */}
            {tab === 'dms' && (
              <div className="p-3 space-y-3">
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400"><Search size={12} /></span>
                  <input
                    type="text"
                    placeholder="Search chats..."
                    value={chatSearch}
                    onChange={e => setChatSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#121217] text-white' : 'bg-white text-[#1A1A1A]'}`}
                  />
                </div>

                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">Connections Inbox</p>

                {filteredInbox.length === 0 ? (
                  <div className="text-center p-6 space-y-2">
                    <Users size={20} className="mx-auto text-neutral-400" />
                    <p className="text-[10px] text-slate-400">No chats yet. Connect with people in Discovery!</p>
                  </div>
                ) : (
                  filteredInbox.map(user => {
                    const unread = unreadCount(user.id);
                    const pairedMsgs = messages.filter(
                      m => (m.senderId === currentUser.id && m.receiverId === user.id) ||
                           (m.senderId === user.id && m.receiverId === currentUser.id)
                    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                    const lastMsg = pairedMsgs[0];
                    const isSelected = selectedUser?.id === user.id;

                    return (
                      <div
                        key={user.id}
                        onClick={() => { setSelectedUser(user); setShowMobileChat(true); }}
                        className={`p-3 rounded-xl flex items-start gap-2.5 cursor-pointer transition-all border ${isSelected ? (dm ? 'bg-[#1c1c24] border-indigo-500/20' : 'bg-indigo-500/[0.04] border-indigo-100') : 'hover:bg-neutral-500/5 border-transparent'}`}
                      >
                        <div className="relative shrink-0">
                          <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600">
                            <div className={`w-9 h-9 rounded-full border border-white dark:border-[#09090C] flex items-center justify-center font-bold text-xs overflow-hidden ${dm ? 'bg-[#121217]' : 'bg-white'}`}>
                              <Avatar avatar={user.avatar} />
                            </div>
                          </div>
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#09090C]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className="text-xs font-bold tracking-tight truncate">{user.fullName}</h4>
                            {unread > 0 && (
                              <span className="py-0.5 px-2 rounded-full text-[8px] font-mono font-bold bg-indigo-500 text-white animate-pulse shrink-0">{unread}</span>
                            )}
                          </div>
                          <p className="text-[10px] truncate text-slate-400">{user.college}</p>
                          {lastMsg && (
                            <p className="text-[9.5px] truncate italic mt-0.5 opacity-70">
                              {lastMsg.senderId === currentUser.id ? 'You: ' : ''}{lastMsg.content}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── GROUP LIST ── */}
            {tab === 'groups' && (
              <div className="p-3 space-y-3">
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-dashed border-indigo-400/40 text-indigo-400 hover:bg-indigo-500/5 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus size={12} /> Create Group
                </button>

                {pendingGroups.length > 0 && (
                  <>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-amber-500">Pending Invites</p>
                    {pendingGroups.map(g => (
                      <div key={g.id} className={`p-3 rounded-xl border ${dm ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            {g.type === 'class' ? <BookOpen size={14} /> : <Smile size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{g.name}</p>
                            <p className="text-[9px] text-slate-400">{g.college}</p>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleAcceptGroup(g.id)} className="flex-1 py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold cursor-pointer hover:bg-indigo-600 flex items-center justify-center gap-1"><Check size={11} /> Accept</button>
                          <button onClick={() => handleDeclineGroup(g.id)} className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold cursor-pointer flex items-center justify-center gap-1 ${dm ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-neutral-100 text-slate-500 hover:bg-neutral-200'}`}><X size={11} /> Decline</button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {memberGroups.length > 0 && (
                  <>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400">My Groups</p>
                    {memberGroups.map(g => {
                      const isSelected = selectedGroup?.id === g.id;
                      return (
                        <div
                          key={g.id}
                          onClick={() => { setSelectedGroup(g); setShowMobileChat(true); }}
                          className={`p-3 rounded-xl flex items-center gap-2.5 cursor-pointer transition-all border ${isSelected ? (dm ? 'bg-[#1c1c24] border-indigo-500/20' : 'bg-indigo-500/[0.04] border-indigo-100') : 'hover:bg-neutral-500/5 border-transparent'}`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                            {g.type === 'class' ? <BookOpen size={16} /> : <Smile size={16} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate">{g.name}</p>
                            <p className="text-[9px] text-slate-400">{(g.memberIds as string[]).length} members • {g.type}</p>
                          </div>
                          <Hash size={12} className="text-slate-400 shrink-0" />
                        </div>
                      );
                    })}
                  </>
                )}

                {memberGroups.length === 0 && pendingGroups.length === 0 && (
                  <div className="text-center p-6 space-y-2">
                    <Users size={20} className="mx-auto text-neutral-400" />
                    <p className="text-[10px] text-slate-400">No groups yet. Create one to chat with your college mates!</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Status bar */}
          <div className={`p-3 border-t border-neutral-200 dark:border-white/5 text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1.5 opacity-70 ${dm ? 'text-zinc-400' : 'text-slate-500'}`}>
            <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
            <span>Campus Restrict: Match active</span>
          </div>
        </div>

        {/* RIGHT PANEL (chat) — full screen on mobile when open */}
        <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} ${chatPanelCls} flex-col min-w-0`}>

          {/* ── DM CHAT PANE ── */}
          {tab === 'dms' && (
            selectedUser ? (
              <>
                {/* Header */}
                <div className={`p-3 md:p-4 border-b border-neutral-200 dark:border-white/5 flex items-center gap-2 ${dm ? 'bg-[#1c1c24]/50' : 'bg-neutral-50/50'}`}>
                  <button className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer shrink-0" onClick={() => setShowMobileChat(false)}>
                    <ArrowLeft size={16} />
                  </button>
                  <div
                    onClick={() => onViewUserProfile && onViewUserProfile(selectedUser.id)}
                    className={`flex gap-2.5 items-center flex-1 min-w-0 ${onViewUserProfile ? 'cursor-pointer hover:opacity-85 transition-all' : ''}`}
                  >
                    <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-[#1A1A1A] text-white overflow-hidden">
                        <Avatar avatar={selectedUser.avatar} />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold uppercase tracking-wide truncate">{selectedUser.fullName}</h3>
                      <p className="text-[10px] text-slate-400 truncate">{selectedUser.college} • {selectedUser.branch}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-mono uppercase font-semibold shrink-0">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="opacity-70 text-slate-400 hidden sm:inline">Online</span>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                  {activeChatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-65 text-xs py-8">
                      <MessageSquare className="text-indigo-400 mb-1" size={24} />
                      <p className="font-bold uppercase tracking-widest text-[9px] mb-1">Start the conversation</p>
                      <p className="text-[10px] max-w-xs text-slate-400">Say hi to {selectedUser.fullName}!</p>
                    </div>
                  ) : (
                    activeChatMessages.map(msg => {
                      const selfMsg = msg.senderId === currentUser.id;
                      return (
                        <div key={msg.id} className={`flex ${selfMsg ? 'justify-end' : 'justify-start'}`}>
                          <div className="max-w-[75%] space-y-0.5">
                            <div className={`px-3 py-2 text-xs leading-normal whitespace-pre-wrap border ${selfMsg ? 'bg-indigo-500 text-white border-transparent rounded-2xl rounded-tr-sm' : (dm ? 'bg-[#1c1c24] text-slate-100 border-white/5 rounded-2xl rounded-tl-sm' : 'bg-neutral-100 text-slate-800 border-neutral-150 rounded-2xl rounded-tl-sm')}`}>
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] font-mono opacity-50 ${selfMsg ? 'justify-end' : 'justify-start'}`}>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {selfMsg && <CheckCheck size={10} className="text-indigo-400" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={dmBottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleDMSubmit} className={`p-2.5 md:p-3 border-t border-neutral-200 dark:border-white/5 flex gap-2 items-center ${dm ? 'bg-[#09090C]' : 'bg-white'}`}>
                  <input
                    type="text"
                    required
                    disabled={currentUser.isSuspended}
                    placeholder={currentUser.isSuspended ? 'Account suspended' : `Message ${selectedUser.fullName.split(' ')[0]}...`}
                    value={typedMessage}
                    onChange={e => setTypedMessage(e.target.value)}
                    className={`flex-1 px-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#121217] text-white' : 'bg-neutral-50 text-slate-800'}`}
                  />
                  <button
                    type="submit"
                    disabled={currentUser.isSuspended}
                    className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-65 text-xs">
                <MessageSquare className="text-neutral-400 mb-2" size={32} />
                <h4 className="font-bold uppercase tracking-widest text-[10px]">Select a conversation</h4>
                <p className="max-w-xs mx-auto mt-1 text-slate-400">Pick someone from the left to start chatting.</p>
              </div>
            )
          )}

          {/* ── GROUP CHAT PANE ── */}
          {tab === 'groups' && (
            selectedGroup && (g => (g.memberIds as string[]).includes(currentUser.id))(selectedGroup) ? (
              <>
                {/* Header */}
                <div className={`p-3 md:p-4 border-b border-neutral-200 dark:border-white/5 flex items-center gap-2 ${dm ? 'bg-[#1c1c24]/50' : 'bg-neutral-50/50'}`}>
                  <button className="md:hidden p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer shrink-0" onClick={() => setShowMobileChat(false)}>
                    <ArrowLeft size={16} />
                  </button>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
                    {selectedGroup.type === 'class' ? <BookOpen size={16} /> : <Smile size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-wide truncate">{selectedGroup.name}</h3>
                    <p className="text-[10px] text-slate-400">{(selectedGroup.memberIds as string[]).length} members • {selectedGroup.college}</p>
                  </div>
                  {selectedGroup.creatorId === currentUser.id && (
                    <button
                      onClick={() => {
                        setInviteSearch('');
                        setInviteSelected([]);
                        setShowCreateGroup(false);
                      }}
                      className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer text-slate-400 shrink-0"
                      title="Invite members"
                    >
                      <UserPlus size={14} />
                    </button>
                  )}
                </div>

                {/* Group Messages */}
                <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3">
                  {groupMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-65 text-xs py-8">
                      <Hash className="text-indigo-400 mb-1" size={24} />
                      <p className="font-bold uppercase tracking-widest text-[9px] mb-1">Group Chat</p>
                      <p className="text-[10px] max-w-xs text-slate-400">Be the first to say something in {selectedGroup.name}!</p>
                    </div>
                  ) : (
                    groupMessages.map(msg => {
                      const selfMsg = msg.senderId === currentUser.id;
                      const sender = allUsers.find(u => u.id === msg.senderId);
                      return (
                        <div key={msg.id} className={`flex ${selfMsg ? 'justify-end' : 'justify-start'} gap-2`}>
                          {!selfMsg && (
                            <div className="w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-300 overflow-hidden shrink-0 mt-1">
                              <Avatar avatar={sender?.avatar || '?'} />
                            </div>
                          )}
                          <div className="max-w-[72%] space-y-0.5">
                            {!selfMsg && sender && (
                              <p className="text-[9px] font-bold text-slate-400 px-1">{sender.fullName.split(' ')[0]}</p>
                            )}
                            <div className={`px-3 py-2 text-xs leading-normal whitespace-pre-wrap border ${selfMsg ? 'bg-indigo-500 text-white border-transparent rounded-2xl rounded-tr-sm' : (dm ? 'bg-[#1c1c24] text-slate-100 border-white/5 rounded-2xl rounded-tl-sm' : 'bg-neutral-100 text-slate-800 border-neutral-150 rounded-2xl rounded-tl-sm')}`}>
                              {msg.content}
                            </div>
                            <div className={`flex items-center gap-1 text-[9px] font-mono opacity-50 ${selfMsg ? 'justify-end' : 'justify-start'}`}>
                              <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={groupBottomRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleGroupMsgSubmit} className={`p-2.5 md:p-3 border-t border-neutral-200 dark:border-white/5 flex gap-2 items-center ${dm ? 'bg-[#09090C]' : 'bg-white'}`}>
                  <input
                    type="text"
                    required
                    disabled={currentUser.isSuspended}
                    placeholder={currentUser.isSuspended ? 'Account suspended' : `Message ${selectedGroup.name}...`}
                    value={groupTyped}
                    onChange={e => setGroupTyped(e.target.value)}
                    className={`flex-1 px-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${dm ? 'bg-[#121217] text-white' : 'bg-neutral-50 text-slate-800'}`}
                  />
                  <button
                    type="submit"
                    disabled={currentUser.isSuspended}
                    className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-40 cursor-pointer flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Send size={14} />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-65 text-xs">
                <Users className="text-neutral-400 mb-2" size={32} />
                <h4 className="font-bold uppercase tracking-widest text-[10px]">Select a group</h4>
                <p className="max-w-xs mx-auto mt-1 text-slate-400">Pick a group from the left, or create a new one.</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
