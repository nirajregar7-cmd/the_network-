import React from 'react';
import { UserProfile, UserReport, Post, Community } from '../types';
import { ShieldCheck, Users, AlertTriangle, MessageSquare, Trash2, ShieldAlert, Check, X, RefreshCw } from 'lucide-react';
import Avatar from './Avatar';

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
  // Validate that current user is ADMIN
  if (currentUser.role !== 'admin') {
    return (
      <div className={`p-8 rounded-2xl border border-neutral-200 dark:border-white/10 text-center ${darkMode ? 'bg-[#121217]' : 'bg-neutral-50/50'}`}>
        <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
        <h3 className="font-bold uppercase tracking-wider text-xs mb-1">Administrative Access Denied</h3>
        <p className="text-xs max-w-md mx-auto opacity-75">
          This view is restricted to verified campus coordinators and administrative investigators. Relogin as Sarah Lin to administer.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      
      {/* Admin Quick stats banner */}
      <div className={`p-5 rounded-2xl border border-rose-500/20 shadow-xs ${darkMode ? 'bg-rose-950/10 text-rose-350' : 'bg-rose-500/[0.02] text-rose-800'}`}>
        <h2 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1">
          <ShieldAlert size={14} className="text-rose-500" /> Administrative Core Center
        </h2>
        <p className="text-xs leading-relaxed opacity-90">
          Faculty supervisor role active. Authenticate peer requests, investigate safety incident flags, and monitor campus collaboration guidelines.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Reports Investigator Column */}
        <div className="xl:col-span-1 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-rose-500 flex items-center gap-1.5">
            <AlertTriangle size={13} className="animate-pulse" /> Incident Reports ({reports.filter(r => r.status === 'pending').length})
          </h3>

          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className={`p-6 text-center rounded-2xl border ${darkMode ? 'bg-[#121217] border-white/5 text-zinc-500' : 'bg-neutral-50 border-neutral-200 text-neutral-405'} text-xs font-mono`}>
                No pending student complaints filed.
              </div>
            ) : (
              reports.map((report) => {
                const reporter = allUsers.find(u => u.id === report.reporterId);
                const reported = allUsers.find(u => u.id === report.reportedUserId);
                
                if (!reported) return null;

                return (
                  <div
                    id={`report-node-${report.id}`}
                    key={report.id}
                    className={`p-5 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs space-y-3 text-xs ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="py-0.5 px-2 rounded-full font-bold text-[8.5px] uppercase tracking-wide border border-rose-500/20 text-rose-500 bg-rose-500/5">
                        {report.reason}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase font-semibold">
                        {report.status}
                      </span>
                    </div>

                    <p className={`text-[11px] leading-snug p-3 rounded-xl border border-neutral-150 dark:border-white/5 italic ${darkMode ? 'bg-[#09090C] text-zinc-300' : 'bg-[#F9F7F2]/50 text-neutral-700'}`}>
                      "{report.description}"
                    </p>

                    <div className="space-y-1 text-[10px] text-slate-450">
                      <p>Filer: <strong className="font-bold">{reporter?.fullName || 'Academic Guest'}</strong> ({reporter?.college})</p>
                      <p>Target: <span className="text-rose-500 font-extrabold">{reported.fullName}</span> ({reported.college})</p>
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2 justify-end pt-2">
                        <button
                          id={`btn-report-dismiss-${report.id}`}
                          onClick={() => onResolveReport(report.id, 'dismissed')}
                          className="py-1 px-3 rounded-xl border border-neutral-200 dark:border-white/10 font-bold text-[10px] uppercase tracking-wider cursor-pointer bg-transparent hover:bg-neutral-50 dark:hover:bg-zinc-800"
                        >
                          Dismiss
                        </button>
                        <button
                          id={`btn-report-suspend-${report.id}`}
                          onClick={() => {
                            onToggleUserSuspension(reported.id);
                            onResolveReport(report.id, 'suspended');
                          }}
                          className="py-1 px-3.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider cursor-pointer"
                        >
                          Suspend Student
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Users Management Grid Column */}
        <div className="xl:col-span-2 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <Users size={13} className="text-indigo-505" /> Student Directory Registry ({allUsers.length})
          </h3>

          <div className={`border border-neutral-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-xs ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className={`border-b border-neutral-200 dark:border-white/5 uppercase tracking-wider text-[9px] font-bold ${darkMode ? 'bg-[#09090C] text-slate-400' : 'bg-neutral-50 text-slate-550'}`}>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">University Domain</th>
                  <th className="p-3">Safety Status</th>
                  <th className="p-3 text-right">Moderator Sync</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-white/5">
                {allUsers.map((user) => {
                  if (user.id === currentUser.id) return null; // hide self admin

                  return (
                    <tr id={`table-user-row-${user.id}`} key={user.id} className={`${user.isSuspended ? (darkMode ? 'bg-rose-500/[0.02]' : 'bg-rose-500/[0.01]') : ''}`}>
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-full border border-neutral-250 dark:border-white/10 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${darkMode ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                            <Avatar avatar={user.avatar} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 dark:text-slate-100">{user.fullName}</p>
                            <p className="text-[10px] text-slate-400">{user.college} • {user.branch}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-[10.5px] text-slate-450">{user.email}</span>
                      </td>
                      <td className="p-3">
                        {user.isSuspended ? (
                          <span className="inline-block py-0.5 px-2.5 rounded-full border border-rose-500/20 font-mono text-[9px] text-rose-500 uppercase bg-rose-500/5">
                            SUSPENDED
                          </span>
                        ) : (
                          <span className="inline-block py-0.5 px-2.5 rounded-full border border-emerald-505/20 font-mono text-[9px] text-emerald-600 dark:text-emerald-400 uppercase bg-emerald-500/5">
                            ACTIVE SYNC
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          id={`btn-toggle-suspend-${user.id}`}
                          onClick={() => onToggleUserSuspension(user.id)}
                          className={`py-1 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${user.isSuspended ? 'bg-emerald-600 border-transparent text-white hover:bg-emerald-700' : 'bg-transparent border-rose-500/30 text-rose-500 hover:bg-rose-500/10'}`}
                        >
                          {user.isSuspended ? 'Restore' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Spam post deletion center */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wide text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-indigo-500" /> Global Post Moderation Flow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post) => {
            const author = allUsers.find(u => u.id === post.authorId);
            if (!author) return null;

            return (
              <div
                id={`spam-card-${post.id}`}
                key={post.id}
                className={`p-5 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-xs flex flex-col justify-between gap-4 text-xs ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-dashed border-neutral-200 dark:border-white/5">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{author.fullName} • {author.college}</span>
                    <span className="opacity-55 font-mono text-[9px]">{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className={`italic text-[11px] leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-neutral-650'}`}>"{post.content}"</p>
                </div>

                <div className="flex items-center justify-between border-t border-dashed border-neutral-200 dark:border-white/5 pt-2.5 text-[10px]">
                  <span className="font-mono text-slate-450">TAG: <span className="font-bold uppercase text-indigo-500">{post.academicTag}</span></span>
                  <button
                    id={`btn-spam-delete-${post.id}`}
                    onClick={() => onDeletePost(post.id)}
                    className="py-1 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Trash2 size={11} /> Delete Post
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
