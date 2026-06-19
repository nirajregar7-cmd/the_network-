import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Connection, DirectMessage } from '../types';
import { Send, Search, Users, ShieldCheck, Clock, MessageSquare, Sparkles, CheckCheck } from 'lucide-react';
import { getSimulatedReply } from '../data/mockData';
import Avatar from './Avatar';

interface MessagingSectionProps {
  currentUser: UserProfile;
  connections: Connection[];
  allUsers: UserProfile[];
  messages: DirectMessage[];
  onSendMessage: (receiverId: string, content: string) => void;
  onSimulateReply: (partnerId: string, content: string) => void;
  darkMode: boolean;
  preSelectedUserId?: string;
  onViewUserProfile?: (userId: string) => void;
}

export default function MessagingSection({
  currentUser,
  connections,
  allUsers,
  messages,
  onSendMessage,
  onSimulateReply,
  darkMode,
  preSelectedUserId,
  onViewUserProfile
}: MessagingSectionProps) {
  // Find which users we are connected with (status === 'accepted')
  const acceptedConns = connections.filter(
    c => (c.senderId === currentUser.id || c.receiverId === currentUser.id) && c.status === 'accepted'
  );

  const matchedUserIds = acceptedConns.map(c => 
    c.senderId === currentUser.id ? c.receiverId : c.senderId
  );

  const inboxUsers = allUsers.filter(u => 
    (matchedUserIds.includes(u.id) || u.id === preSelectedUserId) && !u.isSuspended && u.id !== currentUser.id
  );

  // Active Selected Conversation Partner
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(() => {
    if (preSelectedUserId) {
      const matched = allUsers.find(u => u.id === preSelectedUserId);
      if (matched) return matched;
    }
    return inboxUsers[0] || null;
  });
  const [chatSearch, setChatSearch] = useState('');
  const [typedMessage, setTypedMessage] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (preSelectedUserId) {
      const matched = allUsers.find(u => u.id === preSelectedUserId);
      if (matched) {
        setSelectedUser(matched);
      }
    }
  }, [preSelectedUserId, allUsers]);

  // Auto Scroll Chat Panel
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedUser]);

  // Read message handler
  const unreadCount = (partnerId: string) => {
    return messages.filter(
      m => m.senderId === partnerId && m.receiverId === currentUser.id && !m.isRead
    ).length;
  };

  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !typedMessage.trim() || currentUser.isSuspended) return;

    const userText = typedMessage;
    // Dispatch User Message
    onSendMessage(selectedUser.id, userText);
    setTypedMessage('');

    // Trigger instant mock WebSocket automated college student reply!
    const partnerId = selectedUser.id;
    setTimeout(() => {
      const simulatedResponse = getSimulatedReply(partnerId, userText);
      onSimulateReply(partnerId, simulatedResponse);
    }, 1200);
  };

  // Filter inbox contacts based on simple query
  const filteredInbox = inboxUsers.filter(u => 
    u.fullName.toLowerCase().includes(chatSearch.toLowerCase()) || 
    u.college.toLowerCase().includes(chatSearch.toLowerCase())
  );

  // Active chat log messages between currentUser and selectedUser
  const activeChatMessages = selectedUser 
    ? messages.filter(
        m => (m.senderId === currentUser.id && m.receiverId === selectedUser.id) ||
             (m.senderId === selectedUser.id && m.receiverId === currentUser.id)
      ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : [];

  return (
    <div className={`h-[580px] rounded-2xl border border-neutral-200 dark:border-white/10 flex overflow-hidden shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white text-slate-800'}`}>
      
      {/* Contact panel sidebar */}
      <div className={`w-80 border-r border-neutral-200 dark:border-white/5 flex flex-col justify-between shrink-0 ${darkMode ? 'bg-[#09090C]' : 'bg-neutral-50/50'}`}>
        <div className="p-4 space-y-4 flex-1 overflow-y-auto">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search size={13} />
            </span>
            <input
              id="message-search-input"
              type="text"
              placeholder="Search active chats..."
              value={chatSearch}
              onChange={(e) => setChatSearch(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#121217] text-white' : 'bg-white text-[#1A1A1A]'}`}
            />
          </div>

          <div className="space-y-2">
            <span className="text-[9px] uppercase font-bold tracking-widest block text-slate-400 dark:text-slate-500 mb-1">
              Connections Inbox
            </span>

            {filteredInbox.length === 0 ? (
              <div className="text-center p-6 space-y-2">
                <Users size={20} className="mx-auto text-neutral-400" />
                <p className="text-[10px] uppercase tracking-wider font-bold leading-normal text-slate-400">
                  No active peer chats yet. Explore matches from the explore catalog!
                </p>
              </div>
            ) : (
              filteredInbox.map((user) => {
                const unread = unreadCount(user.id);
                // Last message summary
                const pairedMsgs = messages.filter(
                  m => (m.senderId === currentUser.id && m.receiverId === user.id) ||
                       (m.senderId === user.id && m.receiverId === currentUser.id)
                ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                
                const lastMsg = pairedMsgs[0];
                const isSelected = selectedUser?.id === user.id;

                return (
                  <div
                    id={`chat-contact-${user.id}`}
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 rounded-xl flex items-start gap-2.5 cursor-pointer text-left transition-all border ${isSelected ? (darkMode ? 'bg-[#1c1c24] border-indigo-500/20 text-white shadow-xs' : 'bg-indigo-500/[0.04] border-indigo-100 text-slate-900') : 'hover:bg-neutral-500/5 border-transparent'}`}
                  >
                    <div className="relative shrink-0">
                      <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shrink-0 overflow-hidden">
                        <div className={`w-9 h-9 rounded-full border border-white dark:border-[#09090C] flex items-center justify-center font-bold text-xs overflow-hidden ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
                          <Avatar avatar={user.avatar} />
                        </div>
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#09090C]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold tracking-tight truncate">
                          {user.fullName}
                        </h4>
                        {unread > 0 && (
                          <span className="py-0.5 px-2 rounded-full text-[8px] font-mono font-bold bg-indigo-500 text-white animate-pulse">
                            {unread}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-[10px] truncate text-slate-400 dark:text-slate-500">
                        {user.college}
                      </p>
                      
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
        </div>
        
        {/* Connection system status check */}
        <div className={`p-4 border-t border-neutral-200 dark:border-white/5 text-[9px] uppercase tracking-wider font-semibold flex items-center gap-1.5 opacity-70 ${darkMode ? 'text-zinc-400' : 'text-slate-650'}`}>
          <ShieldCheck size={12} className="text-emerald-500 shrink-0" />
          <span>Campus Restrict: Match active</span>
        </div>
      </div>

      {/* Chat pane panel */}
      {selectedUser ? (
        <div className="flex-1 flex flex-col justify-between bg-white dark:bg-[#121217]">
          
          {/* Active Partner Header */}
          <div className={`p-4 border-b border-neutral-200 dark:border-white/5 flex items-center justify-between ${darkMode ? 'bg-[#1c1c24]/50' : 'bg-neutral-50/50'}`}>
            <div 
              onClick={() => onViewUserProfile && onViewUserProfile(selectedUser.id)}
              className={`flex gap-2.5 items-center text-left ${onViewUserProfile ? 'cursor-pointer hover:opacity-85 transition-all' : ''}`}
              title="View Peer Student Card"
            >
              <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shrink-0">
                <div className={`w-9 h-9 rounded-full border border-white dark:border-[#121217] flex items-center justify-center font-bold text-xs bg-[#1A1A1A] text-white dark:bg-[#121217] overflow-hidden`}>
                  <Avatar avatar={selectedUser.avatar} />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-100 hover:underline">{selectedUser.fullName}</h3>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">
                  {selectedUser.college} • {selectedUser.branch}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase font-semibold">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-555 animate-ping absolute" />
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="opacity-70 text-slate-400">Match Verified</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeChatMessages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-65 text-xs py-8">
                <MessageSquare className="text-indigo-400 mb-1" size={24} />
                <p className="font-bold uppercase tracking-widest text-[9px] mb-1">Begin Dialogue</p>
                <p className="text-[10px] max-w-xs text-slate-400">Introduce yourself to {selectedUser.fullName}! Campus match logs are stored securely.</p>
              </div>
            ) : (
              activeChatMessages.map((msg) => {
                const selfMsg = msg.senderId === currentUser.id;
                
                return (
                  <div
                    id={`msg-bubble-${msg.id}`}
                    key={msg.id}
                    className={`flex ${selfMsg ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[70%] space-y-0.5">
                      <div className={`p-3 text-xs text-left leading-normal whitespace-pre-wrap border ${selfMsg ? 'bg-indigo-500 text-white border-transparent rounded-2xl rounded-tr-xs shadow-xs' : (darkMode ? 'bg-[#1c1c24] text-slate-100 border-white/5 rounded-2xl rounded-tl-xs' : 'bg-neutral-100 text-slate-800 border-neutral-150 rounded-2xl rounded-tl-xs')}`}>
                        {msg.content}
                      </div>
                      
                      <div className={`flex items-center gap-1 text-[9px] font-mono opacity-50 ${selfMsg ? 'justify-end' : 'justify-start'}`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {selfMsg && <CheckCheck size={10} className="text-indigo-400" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Form write input */}
          <form onSubmit={handleMessageSubmit} className={`p-3 border-t border-neutral-200 dark:border-white/5 flex gap-2 items-center ${darkMode ? 'bg-[#09090C]' : 'bg-[#FFF]'}`}>
            <input
              id="message-send-input"
              type="text"
              required
              disabled={currentUser.isSuspended}
              placeholder={currentUser.isSuspended ? "Account suspended by Admin" : `Message ${selectedUser.fullName}...`}
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className={`flex-1 px-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#121217] text-white' : 'bg-neutral-50 text-slate-800'}`}
            />
            <button
              id="btn-send-message"
              type="submit"
              disabled={currentUser.isSuspended}
              className="p-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-zinc-800 font-bold uppercase cursor-pointer flex items-center justify-center shrink-0 shadow-sm transition-colors"
            >
              <Send size={13} />
            </button>
          </form>

        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-65 text-xs">
          <MessageSquare className="text-neutral-400 mb-2" size={32} />
          <h4 className="font-bold uppercase tracking-widest text-[10px]">Secure Conversation Locker</h4>
          <p className="max-w-xs mx-auto mt-1">
            Pick a verified connection on the left column to engage. To expand your list of chats, send collaboration invites on the Explore page.
          </p>
        </div>
      )}

    </div>
  );
}
