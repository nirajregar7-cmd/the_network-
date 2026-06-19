import React, { useState, useMemo } from 'react';
import { UserProfile, UserReport, Post, Community } from '../types';
import {
  ShieldCheck, Users, AlertTriangle, Trash2,
  ShieldAlert, X, Search, GraduationCap,
  TrendingUp, UserX, FileText, ChevronDown, ChevronUp,
  Calendar, Mail, BookOpen, KeyRound, Eye, EyeOff
} from 'lucide-react';
import Avatar from './Avatar';
import { api } from '../api';

interface AdminSectionProps {
  currentUser: UserProfile;
  allUsers: UserProfile[];
  reports: UserReport[];
  posts: Post[];
  communities: Community[];
  onToggleUserSuspension: (userId: string) => void;
  onResolveReport: (reportId: string, status: 'suspended' | 'dismissed') => void;
  onDeletePost: (postId: string) => void;
  darkMode: boolean;
}

type AdminTab = 'users' | 'reports' | 'posts';

export default function AdminSection({
  currentUser,
  allUsers,
  reports,
  posts,
  communities,
  onToggleUserSuspension,
  onResolveReport,
  onDeletePost,
  darkMode
}: AdminSectionProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'college'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState('');
  const [resetShowPw, setResetShowPw] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);

  const handleResetPassword = async (userId: string) => {
    if (!resetPassword.trim() || resetPassword.length < 4) return;
    setResetLoading(true);
    try {
      await api.users.resetPassword(userId, resetPassword);
      setResetSuccess(userId);
      setResetUserId(null);
      setResetPassword('');
      setTimeout(() => setResetSuccess(null), 3000);
    } catch (err: any) {
      alert('Failed to reset password: ' + err.message);
    } finally {
      setResetLoading(false);
    }
  };

  if (currentUser.role !== 'admin') {
    return (
      <div className={`p-8 rounded-2xl border border-neutral-200 dark:border-white/10 text-center ${darkMode ? 'bg-[#121217]' : 'bg-neutral-50/50'}`}>
        <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
        <h3 className="font-bold uppercase tracking-wider text-xs mb-1">Administrative Access Denied</h3>
        <p className="text-xs max-w-md mx-auto opacity-75">
          This view is restricted to verified campus coordinators and administrative investigators.
        </p>
      </div>
    );
  }

  const activeUsers = allUsers.filter(u => !u.isSuspended);
  const suspendedUsers = allUsers.filter(u => u.isSuspended);
  const pendingReports = reports.filter(r => r.status === 'pending');

  const stats = [
    { label: 'Total Users', value: allUsers.length, icon: Users, color: 'indigo' },
    { label: 'Active', value: activeUsers.length, icon: TrendingUp, color: 'emerald' },
    { label: 'Suspended', value: suspendedUsers.length, icon: UserX, color: 'rose' },
    { label: 'Pending Reports', value: pendingReports.length, icon: AlertTriangle, color: 'amber' },
    { label: 'Total Posts', value: posts.length, icon: FileText, color: 'purple' },
    { label: 'Communities', value: communities.length, icon: BookOpen, color: 'sky' },
  ];

  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    sky: 'bg-sky-500/10 text-sky-500 border-sky-500/20',
  };

  const filteredUsers = useMemo(() => {
    let list = [...allUsers];

    if (userFilter === 'active') list = list.filter(u => !u.isSuspended);
    if (userFilter === 'suspended') list = list.filter(u => u.isSuspended);

    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter(u =>
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.college?.toLowerCase().includes(q) ||
        u.branch?.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') cmp = a.fullName.localeCompare(b.fullName);
      if (sortBy === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'college') cmp = (a.college || '').localeCompare(b.college || '');
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [allUsers, userSearch, userFilter, sortBy, sortDir]);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <ChevronDown size={11} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={11} /> : <ChevronDown size={11} />;
  };

  const tabs: { id: AdminTab; label: string; count?: number }[] = [
    { id: 'users', label: 'All Users', count: allUsers.length },
    { id: 'reports', label: 'Reports', count: pendingReports.length },
    { id: 'posts', label: 'Post Moderation', count: posts.length },
  ];

  return (
    <div className="space-y-6">

      {/* Header banner */}
      <div className={`p-5 rounded-2xl border border-rose-500/20 ${darkMode ? 'bg-rose-950/10' : 'bg-rose-500/[0.03]'}`}>
        <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1 text-rose-500">
          <ShieldAlert size={14} /> Admin Control Center
        </h2>
        <p className="text-xs opacity-75">
          Full database access — manage users, moderate content, and resolve incident reports.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map(s => (
          <div
            key={s.label}
            className={`p-4 rounded-2xl border ${colorMap[s.color]} flex flex-col gap-2`}
          >
            <s.icon size={16} />
            <p className="text-xl font-black leading-none">{s.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className={`rounded-2xl border border-neutral-200 dark:border-white/10 overflow-hidden ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
        <div className={`flex border-b border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#09090C]' : 'bg-neutral-50'}`}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-500'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                  activeTab === tab.id ? 'bg-indigo-500 text-white' : 'bg-neutral-200 dark:bg-white/10 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="p-4 space-y-4">
            {/* Filters bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className={`flex items-center gap-2 flex-1 px-3 py-2 rounded-xl border text-xs ${darkMode ? 'bg-[#09090C] border-white/10' : 'bg-neutral-50 border-neutral-200'}`}>
                <Search size={13} className="opacity-40 shrink-0" />
                <input
                  type="text"
                  placeholder="Search by name, email, college, branch..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="bg-transparent outline-none w-full placeholder:text-slate-400 text-xs"
                />
                {userSearch && (
                  <button onClick={() => setUserSearch('')} className="opacity-40 hover:opacity-80 cursor-pointer">
                    <X size={12} />
                  </button>
                )}
              </div>
              <div className="flex gap-1.5">
                {(['all', 'active', 'suspended'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setUserFilter(f)}
                    className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                      userFilter === f
                        ? f === 'suspended' ? 'bg-rose-500 text-white border-transparent' : 'bg-indigo-500 text-white border-transparent'
                        : 'border-neutral-200 dark:border-white/10 text-slate-500 hover:border-indigo-400 hover:text-indigo-500'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[10px] font-mono text-slate-400">
              Showing {filteredUsers.length} of {allUsers.length} users
            </p>

            {/* Users table */}
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-white/10">
              <table className="w-full text-left border-collapse text-xs min-w-[640px]">
                <thead>
                  <tr className={`border-b border-neutral-200 dark:border-white/10 text-[9px] font-bold uppercase tracking-widest ${darkMode ? 'bg-[#09090C] text-slate-500' : 'bg-neutral-50 text-slate-400'}`}>
                    <th className="p-3">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        User <SortIcon col="name" />
                      </button>
                    </th>
                    <th className="p-3">
                      <button onClick={() => toggleSort('college')} className="flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        College / Branch <SortIcon col="college" />
                      </button>
                    </th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Year</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">
                      <button onClick={() => toggleSort('date')} className="flex items-center gap-1 cursor-pointer hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        Joined <SortIcon col="date" />
                      </button>
                    </th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y divide-neutral-100 dark:divide-white/5`}>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-xs text-slate-400 font-mono">
                        No users match your search.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr
                        key={user.id}
                        className={`transition-colors ${user.isSuspended
                          ? darkMode ? 'bg-rose-500/[0.03]' : 'bg-rose-50/50'
                          : darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-neutral-50/70'
                        } ${user.id === currentUser.id ? 'opacity-50' : ''}`}
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border ${darkMode ? 'bg-zinc-900 text-white border-white/10' : 'bg-slate-100 text-slate-800 border-neutral-200'}`}>
                              <Avatar avatar={user.avatar} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                                {user.fullName}
                                {user.id === currentUser.id && (
                                  <span className="text-[8px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded-full font-bold uppercase">You</span>
                                )}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <p className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">{user.college || '—'}</p>
                          <p className="text-[10px] text-slate-400">{user.branch || '—'}</p>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                            <Mail size={10} className="opacity-50" /> {user.email}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-[11px] text-slate-500">
                            {user.year ? `Year ${user.year}` : '—'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-[9px] font-bold uppercase border ${
                            user.role === 'admin'
                              ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                              : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                          }`}>
                            {user.role === 'admin' ? <ShieldCheck size={9} /> : <GraduationCap size={9} />}
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                            <Calendar size={10} className="opacity-50" />
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                          </span>
                        </td>
                        <td className="p-3">
                          {user.isSuspended ? (
                            <span className="inline-block py-0.5 px-2 rounded-full border border-rose-500/20 text-[9px] font-bold uppercase text-rose-500 bg-rose-500/5">
                              Suspended
                            </span>
                          ) : (
                            <span className="inline-block py-0.5 px-2 rounded-full border border-emerald-500/20 text-[9px] font-bold uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-1.5 items-end">
                            {resetSuccess === user.id && (
                              <span className="text-[9px] font-bold text-emerald-500 uppercase">✓ Password Updated</span>
                            )}

                            {resetUserId === user.id ? (
                              <div className={`flex items-center gap-1.5 p-2 rounded-xl border ${darkMode ? 'bg-[#09090C] border-white/10' : 'bg-neutral-50 border-neutral-200'}`}>
                                <div className="relative">
                                  <input
                                    type={resetShowPw ? 'text' : 'password'}
                                    placeholder="New password"
                                    value={resetPassword}
                                    onChange={e => setResetPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleResetPassword(user.id)}
                                    className="bg-transparent outline-none text-xs w-28 pr-5"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => setResetShowPw(p => !p)}
                                    className="absolute right-0 top-0 opacity-40 hover:opacity-80 cursor-pointer"
                                  >
                                    {resetShowPw ? <EyeOff size={11} /> : <Eye size={11} />}
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleResetPassword(user.id)}
                                  disabled={resetLoading || resetPassword.length < 4}
                                  className="py-1 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[9px] font-bold uppercase cursor-pointer disabled:opacity-40 transition-colors"
                                >
                                  {resetLoading ? '...' : 'Set'}
                                </button>
                                <button
                                  onClick={() => { setResetUserId(null); setResetPassword(''); }}
                                  className="opacity-40 hover:opacity-80 cursor-pointer"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => { setResetUserId(user.id); setResetPassword(''); setResetShowPw(false); }}
                                  className="py-1 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10 transition-all cursor-pointer flex items-center gap-1"
                                  title="Reset Password"
                                >
                                  <KeyRound size={10} /> Reset PW
                                </button>
                                {user.id !== currentUser.id && user.role !== 'admin' && (
                                  <button
                                    onClick={() => onToggleUserSuspension(user.id)}
                                    className={`py-1 px-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                                      user.isSuspended
                                        ? 'bg-emerald-600 border-transparent text-white hover:bg-emerald-700'
                                        : 'bg-transparent border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                                    }`}
                                  >
                                    {user.isSuspended ? 'Restore' : 'Suspend'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="p-4 space-y-4">
            {reports.length === 0 ? (
              <div className="p-10 text-center text-xs font-mono text-slate-400">
                <ShieldCheck size={28} className="mx-auto mb-3 text-emerald-500 opacity-60" />
                No incident reports filed.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reports.map(report => {
                  const reporter = allUsers.find(u => u.id === report.reporterId);
                  const reported = allUsers.find(u => u.id === report.reportedUserId);
                  if (!reported) return null;
                  return (
                    <div
                      key={report.id}
                      className={`p-5 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-3 text-xs ${darkMode ? 'bg-[#09090C]' : 'bg-neutral-50/50'}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="py-0.5 px-2 rounded-full font-bold text-[8.5px] uppercase tracking-wide border border-rose-500/20 text-rose-500 bg-rose-500/5">
                          {report.reason}
                        </span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          report.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                          report.status === 'suspended' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-neutral-200 dark:bg-white/10 text-slate-400'
                        }`}>
                          {report.status}
                        </span>
                      </div>

                      <p className={`text-[11px] leading-snug p-3 rounded-xl border italic ${darkMode ? 'bg-[#121217] border-white/5 text-zinc-300' : 'bg-white border-neutral-100 text-neutral-700'}`}>
                        "{report.description}"
                      </p>

                      <div className="space-y-1 text-[10px] text-slate-400">
                        <p>Filed by: <strong className="text-slate-700 dark:text-slate-300">{reporter?.fullName || 'Unknown'}</strong></p>
                        <p>Against: <strong className="text-rose-500">{reported.fullName}</strong> — {reported.college}</p>
                        <p className="font-mono">{new Date(report.createdAt).toLocaleString()}</p>
                      </div>

                      {report.status === 'pending' && (
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => onResolveReport(report.id, 'dismissed')}
                            className="flex-1 py-1.5 px-3 rounded-xl border border-neutral-200 dark:border-white/10 font-bold text-[10px] uppercase cursor-pointer hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors"
                          >
                            Dismiss
                          </button>
                          <button
                            onClick={() => { onToggleUserSuspension(reported.id); onResolveReport(report.id, 'suspended'); }}
                            className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase cursor-pointer transition-colors"
                          >
                            Suspend User
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* POSTS TAB */}
        {activeTab === 'posts' && (
          <div className="p-4 space-y-4">
            {posts.length === 0 ? (
              <div className="p-10 text-center text-xs font-mono text-slate-400">
                No posts to moderate.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map(post => {
                  const author = allUsers.find(u => u.id === post.authorId);
                  if (!author) return null;
                  return (
                    <div
                      key={post.id}
                      className={`p-4 rounded-2xl border border-neutral-200 dark:border-white/10 flex flex-col justify-between gap-3 text-xs ${darkMode ? 'bg-[#09090C]' : 'bg-neutral-50/50'}`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed border-neutral-200 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold overflow-hidden shrink-0 ${darkMode ? 'bg-zinc-800 text-white' : 'bg-slate-100 text-slate-800'}`}>
                              <Avatar avatar={author.avatar} />
                            </div>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{author.fullName}</span>
                          </div>
                          <span className="font-mono text-[9px] text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className={`italic text-[11px] leading-relaxed line-clamp-3 ${darkMode ? 'text-zinc-300' : 'text-neutral-650'}`}>
                          "{post.content}"
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-dashed border-neutral-200 dark:border-white/5 pt-2.5">
                        <span className="font-mono text-[9px] text-indigo-500 font-bold uppercase">{post.academicTag}</span>
                        <button
                          onClick={() => onDeletePost(post.id)}
                          className="py-1 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 size={10} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
