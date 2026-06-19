import React, { useState } from 'react';
import { UserProfile, Community, Post } from '../types';
import {
  Rocket, Cpu, Code, Briefcase, Palette, Users, ArrowRight, ShieldCheck, Sparkles,
  MessageSquare, Plus, Search, Globe, Shield, Database, Zap, Github, Package,
  DollarSign, Megaphone, Cloud, ShoppingBag, GraduationCap, BookOpen, FileText,
  Activity, Heart, Award, TrendingUp, Sliders, Bookmark, Train, Scale, Layers,
  Image, Video, Camera, Tv, Hash, Home, Map, Play, Book, Laptop, MessageCircle, Check, Send, Sparkle, Link as LinkIcon
} from 'lucide-react';
import FeedSection from './FeedSection';
import Avatar from './Avatar';

interface CommunitiesSectionProps {
  currentUser: UserProfile;
  communities: Community[];
  posts: Post[];
  allUsers: UserProfile[];
  onJoinCommunity: (communityId: string) => void;
  onLeaveCommunity: (communityId: string) => void;
  onAddPost: (
    content: string,
    academicTag: string,
    communityId?: string,
    projectTitle?: string,
    postImage?: string,
    feeling?: string
  ) => void;
  onLikePost: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeletePost?: (postId: string) => void;
  darkMode: boolean;
  onViewUserProfile?: (userId: string) => void;
  onAddResource?: (communityId: string, title: string, link: string, description: string) => void;
  onAddThread?: (communityId: string, title: string, content: string) => void;
  onAddThreadReply?: (communityId: string, threadId: string, content: string) => void;
}

export default function CommunitiesSection({
  currentUser,
  communities,
  posts,
  allUsers,
  onJoinCommunity,
  onLeaveCommunity,
  onAddPost,
  onLikePost,
  onAddComment,
  onDeletePost,
  darkMode,
  onViewUserProfile,
  onAddResource,
  onAddThread,
  onAddThreadReply
}: CommunitiesSectionProps) {
  // Option to view a specific community's details
  const [activeCommunityId, setActiveCommunityId] = useState<string | null>(null);
  
  // Specific community workspace tabs: 'feed' | 'resources' | 'threads'
  const [activeTab, setActiveTab] = useState<'feed' | 'resources' | 'threads'>('feed');

  // Search, filter, category state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Expanded discussion thread state
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);

  // New resource form state
  const [showAddResourceForm, setShowAddResourceForm] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resLink, setResLink] = useState('');
  const [resDesc, setResDesc] = useState('');

  // New thread form state
  const [showAddThreadForm, setShowAddThreadForm] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadContent, setThreadContent] = useState('');

  // Reply input state
  const [replyText, setReplyText] = useState('');

  // Map icon strings to Lucide components
  const renderIcon = (iconName: string) => {
    const props = { size: 18, className: "text-indigo-550 dark:text-indigo-400" };
    switch (iconName) {
      case 'Rocket': return <Rocket {...props} />;
      case 'Cpu': return <Cpu {...props} />;
      case 'Code': return <Code {...props} />;
      case 'Briefcase': return <Briefcase {...props} />;
      case 'Palette': return <Palette {...props} />;
      case 'Globe': return <Globe {...props} />;
      case 'Shield': return <Shield {...props} />;
      case 'Database': return <Database {...props} />;
      case 'Zap': return <Zap {...props} />;
      case 'Github': return <Github {...props} />;
      case 'Package': return <Package {...props} />;
      case 'DollarSign': return <DollarSign {...props} />;
      case 'Megaphone': return <Megaphone {...props} />;
      case 'Cloud': return <Cloud {...props} />;
      case 'ShoppingBag': return <ShoppingBag {...props} />;
      case 'GraduationCap': return <GraduationCap {...props} />;
      case 'BookOpen': return <BookOpen {...props} />;
      case 'FileText': return <FileText {...props} />;
      case 'Activity': return <Activity {...props} />;
      case 'Heart': return <Heart {...props} />;
      case 'Award': return <Award {...props} />;
      case 'TrendingUp': return <TrendingUp {...props} />;
      case 'Sliders': return <Sliders {...props} />;
      case 'Bookmark': return <Bookmark {...props} />;
      case 'Train': return <Train {...props} />;
      case 'Scale': return <Scale {...props} />;
      case 'Layers': return <Layers {...props} />;
      case 'Image': return <Image {...props} />;
      case 'Video': return <Video {...props} />;
      case 'Camera': return <Camera {...props} />;
      case 'Tv': return <Tv {...props} />;
      case 'Hash': return <Hash {...props} />;
      case 'Home': return <Home {...props} />;
      case 'Map': return <Map {...props} />;
      case 'Play': return <Play {...props} />;
      case 'Book': return <Book {...props} />;
      case 'Laptop': return <Laptop {...props} />;
      default: return <Users {...props} />;
    }
  };

  // Get User details helper
  const getUserDetails = (userId: string): { name: string; avatar: string; college: string } => {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
      return {
        name: user.fullName,
        avatar: user.avatar,
        college: user.college
      };
    }
    return {
      name: 'Verified Student',
      avatar: 'VS',
      college: 'The Network'
    };
  };

  // Categories list
  const categoriesList = [
    'All',
    'Engineering & Technology',
    'Startups & Entrepreneurship',
    'Medical & Healthcare',
    'Management & Business',
    'Government Exams',
    'Higher Education & Research',
    'Law & Public Policy',
    'Design & Creativity',
    'Campus Life & Social',
    'Opportunities'
  ];

  // Selected Community
  const selectedComm = communities.find(c => c.id === activeCommunityId);

  // Dynamic search filtering
  const filteredCommunities = communities.filter(comm => {
    const matchesCategory = selectedCategory === 'All' || comm.category === selectedCategory;
    const matchesSearch = 
      comm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTag = !selectedTag || comm.tags.includes(selectedTag);

    return matchesCategory && matchesSearch && matchesTag;
  });

  // Extract all unique interest tags across the communities for filter suggestions
  const popularTags = Array.from(
    new Set(communities.flatMap(c => c.tags))
  ).slice(0, 12);

  const handleJoinLeaveClick = (commId: string) => {
    const comm = communities.find(c => c.id === commId);
    if (!comm) return;
    if (comm.memberIds.includes(currentUser.id)) {
      onLeaveCommunity(commId);
    } else {
      onJoinCommunity(commId);
    }
  };

  // Submissions
  const handleResourceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommunityId || !resTitle || !resLink) return;
    if (onAddResource) {
      onAddResource(activeCommunityId, resTitle, resLink, resDesc);
    }
    setResTitle('');
    setResLink('');
    setResDesc('');
    setShowAddResourceForm(false);
  };

  const handleThreadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCommunityId || !threadTitle || !threadContent) return;
    if (onAddThread) {
      onAddThread(activeCommunityId, threadTitle, threadContent);
    }
    setThreadTitle('');
    setThreadContent('');
    setShowAddThreadForm(false);
  };

  const handleReplySubmit = (e: React.FormEvent, threadId: string) => {
    e.preventDefault();
    if (!activeCommunityId || !replyText) return;
    if (onAddThreadReply) {
      onAddThreadReply(activeCommunityId, threadId, replyText);
    }
    setReplyText('');
  };

  return (
    <div className="space-y-6 text-left">
      {selectedComm ? (
        /* ======================== CHAPTER WORKSPACE VIEW ======================== */
        <div className="space-y-6">
          {/* Back & Title Header */}
          <div className={`p-6 rounded-2xl border border-neutral-200/80 dark:border-white/10 ${darkMode ? 'bg-[#0E0E12]' : 'bg-white'} space-y-4 shadow-sm`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                id="btn-back-to-community-list"
                onClick={() => {
                  setActiveCommunityId(null);
                  setSelectedThreadId(null);
                }}
                className={`py-1.5 px-3.5 rounded-xl border border-neutral-200 dark:border-white/10 text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:scale-98 ${darkMode ? 'bg-zinc-900 hover:bg-zinc-800 text-slate-300' : 'bg-neutral-50 hover:bg-neutral-100 text-slate-700'}`}
              >
                ← Back to Chapters
              </button>

              <div className="flex items-center gap-2">
                <span className={`text-[9.5px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-full ${darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700'}`}>
                  {selectedComm.category}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  {selectedComm.memberIds.length} Members
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4 text-left">
              <div className={`p-3.5 rounded-2xl border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                {renderIcon(selectedComm.icon)}
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-black tracking-tight uppercase text-slate-800 dark:text-slate-100">
                    {selectedComm.name}
                  </h2>
                  {selectedComm.memberIds.includes(currentUser.id) ? (
                    <span className="inline-flex items-center gap-1.5 text-[9px] font-bold tracking-wider uppercase text-emerald-600 bg-emerald-500/5 dark:bg-emerald-500/10 dark:text-emerald-450 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <ShieldCheck size={11} /> Member
                    </span>
                  ) : (
                    <span className="text-[9.5px] font-bold text-slate-450 uppercase tracking-wider">
                      Spectating Hub
                    </span>
                  )}
                </div>
                <p className={`text-xs leading-relaxed max-w-3xl ${darkMode ? 'text-zinc-450' : 'text-slate-650'}`}>
                  {selectedComm.description}
                </p>
                <div className="flex flex-wrap gap-1 pt-1">
                  {selectedComm.tags.map(t => (
                    <span key={t} className={`py-0.5 px-2 rounded-full text-[9px] font-medium font-mono border ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-400' : 'bg-neutral-150 border-neutral-220 text-slate-600'}`}>
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <button
                  id={`btn-join-toggle-workspace-${selectedComm.id}`}
                  onClick={() => handleJoinLeaveClick(selectedComm.id)}
                  className={`py-2 px-5 rounded-xl text-xs uppercase font-extrabold tracking-wider cursor-pointer shadow-sm transition-all hover:scale-98 ${
                    selectedComm.memberIds.includes(currentUser.id)
                      ? 'border border-rose-500/30 text-rose-500 hover:bg-rose-500/10'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {selectedComm.memberIds.includes(currentUser.id) ? 'Leave Chapter' : 'Join Chapter'}
                </button>
              </div>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-t border-neutral-200/80 dark:border-white/5 pt-3 mt-2 gap-3">
              <button
                id="btn-tab-feed"
                onClick={() => {
                  setActiveTab('feed');
                  setSelectedThreadId(null);
                }}
                className={`flex items-center gap-1.5 pb-2.5 px-1.5 text-xs uppercase font-extrabold tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'feed'
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                💬 Community Feed
              </button>
              <button
                id="btn-tab-resources"
                onClick={() => {
                  setActiveTab('resources');
                  setSelectedThreadId(null);
                }}
                className={`flex items-center gap-1.5 pb-2.5 px-1.5 text-xs uppercase font-extrabold tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'resources'
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                📁 Resource Locker ({selectedComm.resources?.length || 0})
              </button>
              <button
                id="btn-tab-threads"
                onClick={() => {
                  setActiveTab('threads');
                  setSelectedThreadId(null);
                }}
                className={`flex items-center gap-1.5 pb-2.5 px-1.5 text-xs uppercase font-extrabold tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'threads'
                    ? 'border-indigo-500 text-indigo-500'
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
              >
                🧵 Discussion Boards ({selectedComm.threads?.length || 0})
              </button>
            </div>
          </div>

          {/* TAB CONTENTS */}
          <div className="space-y-4">
            {activeTab === 'feed' && (
              <div className="space-y-4">
                {!selectedComm.memberIds.includes(currentUser.id) && (
                  <div className={`p-4 rounded-xl border border-amber-500/20 text-left text-xs ${darkMode ? 'bg-amber-950/10 text-amber-400' : 'bg-amber-500/[0.03] text-amber-700'}`}>
                    ⚠️ <strong>Spectator Mode:</strong> You must join this chapter block to participate, post, or leave comment suggestions!
                  </div>
                )}
                <FeedSection
                  currentUser={currentUser}
                  posts={posts}
                  allUsers={allUsers}
                  communities={communities}
                  onAddPost={onAddPost}
                  onLikePost={onLikePost}
                  onAddComment={onAddComment}
                  onDeletePost={onDeletePost}
                  darkMode={darkMode}
                  activeCommunityId={selectedComm.id}
                  stories={[]}
                  onAddStory={() => {}}
                  onViewUserProfile={onViewUserProfile}
                />
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 text-left">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                      Shared College & Study Resources
                    </h3>
                    <p className={`text-[11px] ${darkMode ? 'text-zinc-450' : 'text-slate-500'}`}>
                      Access textbooks, mock exams, code repositories, design templates, and research drafts submitted by peers.
                    </p>
                  </div>
                  {selectedComm.memberIds.includes(currentUser.id) && (
                    <button
                      id="btn-toggle-add-resource"
                      onClick={() => setShowAddResourceForm(!showAddResourceForm)}
                      className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold tracking-wider rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                    >
                      <Plus size={12} /> Share Resource
                    </button>
                  )}
                </div>

                {/* Add Resource Slide Box */}
                {showAddResourceForm && (
                  <form
                    onSubmit={handleResourceSubmit}
                    className={`p-4 rounded-xl border border-neutral-200 dark:border-white/15 ${darkMode ? 'bg-[#121217]' : 'bg-[#FFF]'} space-y-3`}
                  >
                    <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Upload Resource Record
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9.5px] font-bold uppercase text-slate-400 mb-1">Resource Title</label>
                        <input
                          id="res-title-input"
                          type="text"
                          required
                          value={resTitle}
                          onChange={e => setResTitle(e.target.value)}
                          placeholder="e.g. Stanford CS229 Deep Learning Handouts"
                          className={`w-full p-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                        />
                      </div>
                      <div>
                        <label className="block text-[9.5px] font-bold uppercase text-slate-400 mb-1">Resource Link / URL</label>
                        <input
                          id="res-link-input"
                          type="url"
                          required
                          value={resLink}
                          onChange={e => setResLink(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className={`w-full p-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[9.5px] font-bold uppercase text-slate-400 mb-1 font-mono">Short Description / Guidelines</label>
                      <textarea
                        id="res-desc-input"
                        rows={2}
                        value={resDesc}
                        onChange={e => setResDesc(e.target.value)}
                        placeholder="Mention instructions, file version, syllabus references, etc."
                        className={`w-full p-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        id="btn-cancel-resource"
                        onClick={() => setShowAddResourceForm(false)}
                        className={`py-1.5 px-3 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer ${darkMode ? 'bg-zinc-900 border-white/5 text-slate-350' : 'bg-white border-neutral-200 text-slate-600'}`}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        id="btn-confirm-resource"
                        className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Publish Resource
                      </button>
                    </div>
                  </form>
                )}

                {/* List resources */}
                {(!selectedComm.resources || selectedComm.resources.length === 0) ? (
                  <div className={`p-8 rounded-2xl text-center border border-dashed border-neutral-200 dark:border-white/5 ${darkMode ? 'bg-zinc-900/10' : 'bg-neutral-50'}`}>
                    <p className="text-xs text-slate-450 font-medium">No resources shared here yet. Be the first to add one!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedComm.resources.slice().reverse().map((res) => {
                      const author = getUserDetails(res.authorId);
                      return (
                        <div
                          key={res.id}
                          className={`p-4 rounded-xl border border-neutral-200/80 dark:border-white/10 flex flex-col justify-between gap-3 text-left ${darkMode ? 'bg-[#121217]' : 'bg-white'} shadow-xs`}
                        >
                          <div className="space-y shadow-sm">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="text-xs font-black uppercase text-slate-800 dark:text-slate-250 truncate">
                                {res.title}
                              </h4>
                              <a
                                href={res.link}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 px-1.5 rounded bg-indigo-500/10 hover:bg-indigo-505/20 text-indigo-500 cursor-pointer flex items-center justify-center transition-all"
                                title="Open resource link"
                              >
                                <LinkIcon size={12} />
                              </a>
                            </div>
                            <p className="text-[11px] text-slate-400 dark:text-slate-400 line-clamp-2 mt-1 min-h-[32px]">
                              {res.description || 'No guidance remarks available.'}
                            </p>
                          </div>

                          <div className="pt-2.5 border-t border-dashed border-neutral-200 dark:border-white/5 flex items-center justify-between text-[10px] text-slate-450 font-mono">
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-zinc-850 flex items-center justify-center text-[7.5px] font-black text-indigo-500 overflow-hidden">
                                <Avatar avatar={author.avatar} />
                              </div>
                              <span className="font-bold">{author.name}</span>
                            </div>
                            <span>
                              {new Date(res.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'threads' && (
              <div className="space-y-4">
                {selectedThreadId ? (
                  /* --- Thread Details Panel --- */
                  (() => {
                    const threadObj = (selectedComm.threads || []).find(t => t.id === selectedThreadId);
                    if (!threadObj) {
                      setSelectedThreadId(null);
                      return null;
                    }
                    const threadAuthor = getUserDetails(threadObj.authorId);
                    return (
                      <div className="space-y-4 text-left">
                        <button
                          id="btn-exit-thread"
                          onClick={() => setSelectedThreadId(null)}
                          className={`py-1 px-3 rounded-lg border border-neutral-200 dark:border-white/10 text-[9.5px] uppercase font-bold tracking-wider cursor-pointer ${darkMode ? 'bg-zinc-900 text-slate-350' : 'bg-white text-slate-650'}`}
                        >
                          ← Back to Board
                        </button>

                        <div className={`p-5 rounded-2xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#121217]' : 'bg-white'} space-y-4`}>
                          <div className="flex items-center justify-between text-[10px] text-slate-450 font-mono">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center text-[10px] font-black text-indigo-500 overflow-hidden">
                                <Avatar avatar={threadAuthor.avatar} />
                              </div>
                              <div>
                                <span className="font-bold text-slate-700 dark:text-slate-300">{threadAuthor.name}</span>
                                <span className="mx-1.5 text-zinc-650">•</span>
                                <span className="text-[9px]">{threadAuthor.college}</span>
                              </div>
                            </div>
                            <span>{new Date(threadObj.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </div>

                          <div className="space-y-1">
                            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800 dark:text-white">
                              {threadObj.title}
                            </h3>
                            <p className={`text-xs leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-zinc-300' : 'text-slate-705'}`}>
                              {threadObj.content}
                            </p>
                          </div>
                        </div>

                        {/* Thread Replies List */}
                        <div className="space-y-3 pl-4 border-l border-neutral-200 dark:border-white/5 text-left">
                          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-450">
                            Replies ({threadObj.replies.length})
                          </h4>

                          {threadObj.replies.length === 0 ? (
                            <p className="text-[10.5px] text-slate-450 font-medium py-2">No answers posted to this board yet. Post below!</p>
                          ) : (
                            <div className="space-y-3">
                              {threadObj.replies.map((reply) => {
                                const replyAuthor = getUserDetails(reply.authorId);
                                return (
                                  <div
                                    key={reply.id}
                                    className={`p-3.5 rounded-xl border border-neutral-200/80 dark:border-white/10 ${darkMode ? 'bg-zinc-900/30' : 'bg-neutral-50/50'}`}
                                  >
                                    <div className="flex items-center justify-between text-[9px] text-slate-450 font-mono mb-1.5">
                                      <span className="font-bold text-slate-700 dark:text-slate-200">{replyAuthor.name} ({replyAuthor.college})</span>
                                      <span>{new Date(reply.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <p className={`text-xs ${darkMode ? 'text-zinc-305' : 'text-slate-650'}`}>
                                      {reply.content}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Post Reply Form */}
                        {selectedComm.memberIds.includes(currentUser.id) ? (
                          <form
                            onSubmit={(e) => handleReplySubmit(e, threadObj.id)}
                            className="flex items-stretch gap-2"
                          >
                            <input
                              id="reply-input"
                              type="text"
                              required
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Write a supportive response or solution..."
                              className={`flex-1 p-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#121217] text-white' : 'bg-white text-slate-800'}`}
                            />
                            <button
                              type="submit"
                              id="btn-post-reply"
                              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs uppercase font-extrabold tracking-wider rounded-xl cursor-pointer flex items-center justify-center gap-1 transition-colors"
                            >
                              <Send size={12} /> Reply
                            </button>
                          </form>
                        ) : (
                          <div className={`p-3 rounded-lg border border-neutral-200/40 dark:border-white/5 text-[11px] text-slate-450 text-center`}>
                            You must join this chapter block to contribute responses.
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  /* --- List of Threads --- */
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-left">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                          Active Discussion Threads & Q&A
                        </h3>
                        <p className={`text-[11px] ${darkMode ? 'text-zinc-455' : 'text-slate-500'}`}>
                          Participate in collaborative peer discussions, seek mock review guides, and exchange preparation syllabus.
                        </p>
                      </div>
                      {selectedComm.memberIds.includes(currentUser.id) && (
                        <button
                          id="btn-toggle-add-thread"
                          onClick={() => setShowAddThreadForm(!showAddThreadForm)}
                          className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] uppercase font-bold tracking-wider rounded-xl cursor-pointer flex items-center gap-1 transition-all"
                        >
                          <Plus size={12} /> New Topic Thread
                        </button>
                      )}
                    </div>

                    {/* New Thread Slide Form */}
                    {showAddThreadForm && (
                      <form
                        onSubmit={handleThreadSubmit}
                        className={`p-4 rounded-xl border border-neutral-200 dark:border-white/15 ${darkMode ? 'bg-[#121217]' : 'bg-[#FFF]'} space-y-3`}
                      >
                        <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-801 dark:text-slate-201">
                          Initiate Discussion Topic
                        </h4>
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-400 mb-1">Thread Subject</label>
                          <input
                            id="thread-title-input"
                            type="text"
                            required
                            value={threadTitle}
                            onChange={e => setThreadTitle(e.target.value)}
                            placeholder="e.g. Recommended resources for standard preparation"
                            className={`w-full p-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9.5px] font-bold uppercase text-slate-400 mb-1">Detailed Description / Context</label>
                          <textarea
                            id="thread-content-input"
                            rows={3}
                            required
                            value={threadContent}
                            onChange={e => setThreadContent(e.target.value)}
                            placeholder="Detail your question or study plan to get helpful guidelines of student ledger participants."
                            className={`w-full p-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                          />
                        </div>
                        <div className="flex justify-end gap-2 font-mono text-[9.5px]">
                          <button
                            type="button"
                            id="btn-cancel-thread"
                            onClick={() => setShowAddThreadForm(false)}
                            className={`py-1.5 px-3.5 rounded-xl border font-bold uppercase tracking-wider cursor-pointer ${darkMode ? 'bg-zinc-900 border-white/5 text-slate-350' : 'bg-white border-neutral-200 text-slate-650'}`}
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            id="btn-confirm-thread"
                            className="py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            Launch Thread
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Display active threads list */}
                    {(!selectedComm.threads || selectedComm.threads.length === 0) ? (
                      <div className={`p-8 rounded-2xl text-center border border-dashed border-neutral-200 dark:border-white/5 ${darkMode ? 'bg-zinc-900/10' : 'bg-neutral-50'}`}>
                        <p className="text-xs text-slate-450 font-medium">No discussions generated yet. Spark a question or feedback!</p>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        {selectedComm.threads.slice().reverse().map((thread) => {
                          const author = getUserDetails(thread.authorId);
                          return (
                            <div
                              key={thread.id}
                              id={`thread-board-${thread.id}`}
                              onClick={() => setSelectedThreadId(thread.id)}
                              className={`p-4 rounded-xl border border-neutral-200/85 dark:border-white/10 text-left cursor-pointer transition-all hover:border-indigo-500/30 ${
                                darkMode ? 'bg-[#121217] hover:bg-zinc-900/40' : 'bg-white hover:bg-neutral-50/50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold uppercase tracking-wide text-indigo-505 dark:text-indigo-400">
                                    {thread.title}
                                  </h4>
                                  <p className={`text-[11px] line-clamp-2 leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                                    {thread.content}
                                  </p>
                                </div>
                                <div className="py-1 px-3.5 rounded-lg bg-indigo-500/5 border border-indigo-500/10 text-center font-mono">
                                  <span className="block text-xs font-extrabold text-indigo-501 dark:text-indigo-400">
                                    {thread.replies.length}
                                  </span>
                                  <span className="text-[7.5px] uppercase font-bold block text-slate-400">
                                    replies
                                  </span>
                                </div>
                              </div>

                              <div className="pt-3 mt-3 border-t border-dashed border-neutral-200 dark:border-white/5 flex flex-wrap items-center justify-between text-[10px] text-slate-450 font-mono">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-full bg-slate-300 dark:bg-zinc-800 flex items-center justify-center text-[7px] font-black font-sans text-indigo-501 overflow-hidden">
                                    <Avatar avatar={author.avatar} />
                                  </div>
                                  <span>{author.name} ({author.college})</span>
                                </div>
                                <span>{new Date(thread.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ======================== DISCOVER COMMUNITIES DASHBOARD ======================== */
        <div className="space-y-6">
          {/* Top Info Banner */}
          <div className={`p-6 rounded-2xl border border-neutral-200/80 dark:border-white/10 ${darkMode ? 'bg-[#0E0E12]' : 'bg-white'} space-y-3`}>
            <div className="space-y-1">
              <h2 className="text-lg font-black tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                <Sparkles className="text-indigo-550 dark:text-indigo-400" size={20} />
                NATIONWIDE ECOSYSTEM CHAPTERS
              </h2>
              <p className={`text-xs leading-relaxed max-w-4xl text-left ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                Welcome to India’s verified student network. Connect, learn, share blueprints, study, find co-founders, and coordinate opportunities with premier students from <strong>IITs, NITs, IIITs, AIIMS, NLS, NIDs, and leading state & private universities</strong>.
              </p>
            </div>

            {/* QUICK STATS RAIL */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-dashed border-neutral-200 dark:border-white/5">
              <div className="text-left font-mono">
                <span className="block text-sm font-black text-indigo-550 dark:text-indigo-400">10 Streams</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-450">Multi-disciplinary hubs</span>
              </div>
              <div className="text-left font-mono">
                <span className="block text-sm font-black text-pink-500">60 Chapters</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-450">Curated interest circles</span>
              </div>
              <div className="text-left font-mono">
                <span className="block text-sm font-black text-amber-500">Verified India-Wide</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-450">Student-Only access</span>
              </div>
              <div className="text-left font-mono">
                <span className="block text-sm font-black text-emerald-500">Resource Lockers</span>
                <span className="text-[9px] uppercase tracking-wider text-slate-450">Syllabus & QA Share</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Category Filter Desktop Sidebar */}
            <div className={`lg:col-span-1 p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 text-left ${darkMode ? 'bg-[#0E0E12]' : 'bg-white'} space-y-3`}>
              <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-450 mb-1">
                Ecosystem Streams
              </h3>
              <div className="flex lg:flex-col flex-wrap gap-1.5 text-left">
                {categoriesList.map((category) => (
                  <button
                    key={category}
                    id={`btn-category-tab-${category.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => {
                      setSelectedCategory(category);
                      setSelectedTag(null);
                    }}
                    className={`text-[11px] font-bold text-left px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                      selectedCategory === category
                        ? 'bg-indigo-600 text-white font-extrabold shadow-sm'
                        : `hover:bg-neutral-100 dark:hover:bg-zinc-850 ${darkMode ? 'text-slate-350' : 'text-slate-705'}`
                    }`}
                  >
                    {category === 'All' ? '⚡ All Streams' : category}
                  </button>
                ))}
              </div>
            </div>

            {/* Right Communities Feed/Grid */}
            <div className="lg:col-span-3 space-y-5">
              {/* Actions & Filters Header */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Search size={15} />
                  </span>
                  <input
                    id="search-chapters-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search chapters by title, description (e.g., UPSC, NEET, DSA, Figma)..."
                    className={`w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#0E0E12] text-white' : 'bg-white text-slate-800'}`}
                  />
                </div>

                {selectedTag && (
                  <button
                    id="btn-clear-tag"
                    onClick={() => setSelectedTag(null)}
                    className="py-1.5 px-3 rounded-xl border border-dashed border-rose-500/40 text-rose-500 text-[10px] font-bold uppercase tracking-wider hover:bg-rose-550/10 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    Clear Tag: #{selectedTag} ✕
                  </button>
                )}
              </div>

              {/* QUICK INSTANT TAG PICKERS */}
              <div className="space-y-1.5 text-left">
                <span className="block text-[8.5px] font-black uppercase tracking-wider text-slate-450 font-mono">
                  Trending Topic Filters
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTag(selectedTag === tag ? null : tag);
                      }}
                      className={`py-1 px-3 rounded-full text-[9px] font-mono border transition-all cursor-pointer ${
                        selectedTag === tag
                          ? 'bg-indigo-600 border-indigo-600 text-white font-bold'
                          : `hover:bg-neutral-100 dark:hover:bg-zinc-850 ${
                              darkMode ? 'bg-zinc-900 border-white/5 text-slate-400' : 'bg-neutral-50 border-neutral-200 text-slate-600'
                            }`
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Count Banner */}
              <div className="flex items-center justify-between text-[10.5px] font-bold font-mono text-slate-450">
                <span>
                  Showing {filteredCommunities.length} of {communities.length} National Chapters
                </span>
                {selectedCategory !== 'All' && (
                  <span className="uppercase text-indigo-554">Filtered on stream: {selectedCategory}</span>
                )}
              </div>

              {/* CHAPTERS GRID */}
              {filteredCommunities.length === 0 ? (
                <div className={`p-16 border border-dashed border-neutral-200 dark:border-white/5 text-center rounded-2xl ${darkMode ? 'bg-zinc-900/10' : 'bg-neutral-50'}`}>
                  <h3 className="text-sm font-bold uppercase text-slate-800 dark:text-slate-200 mb-1">
                    No matching student chapters found
                  </h3>
                  <p className="text-xs text-slate-450">
                    Try adjusting your search criteria, clearing the tag filter, or picking another stream.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredCommunities.map((comm) => {
                    const hasJoined = comm.memberIds.includes(currentUser.id);
                    const chapterPostsCount = posts.filter(p => p.communityId === comm.id).length;
                    const resourcesCount = comm.resources?.length || 0;
                    const threadsCount = comm.threads?.length || 0;

                    return (
                      <div
                        id={`comm-card-${comm.id}`}
                        key={comm.id}
                        className={`p-5 rounded-2xl border border-neutral-200/80 dark:border-white/10 flex flex-col justify-between gap-4 text-left shadow-xs transition-all hover:border-indigo-550/20 ${darkMode ? 'bg-[#0E0E12] hover:bg-[#121217]' : 'bg-white hover:shadow-md'}`}
                      >
                        <div className="space-y-3.5 text-left">
                          <div className="flex items-start justify-between gap-3">
                            <div className={`p-2 rounded-xl border ${darkMode ? 'bg-zinc-900 border-white/5' : 'bg-[#FFF] border-neutral-200'}`}>
                              {renderIcon(comm.icon)}
                            </div>

                            {hasJoined ? (
                              <span className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full border border-emerald-500/20 text-[8.5px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-450 bg-emerald-500/5">
                                <ShieldCheck size={11} /> ENROLLED
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full border border-neutral-200 dark:border-white/10 text-[8.5px] font-bold uppercase tracking-wider text-slate-450 bg-neutral-100/50 dark:bg-zinc-900/30">
                                JOINABLE
                              </span>
                            )}
                          </div>

                          <div className="text-left space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[8px] tracking-wider uppercase font-semibold text-slate-400 font-mono">
                                {comm.category}
                              </span>
                            </div>
                            <h3 className="text-xs font-black uppercase tracking-wide text-slate-800 dark:text-slate-100">
                              {comm.name}
                            </h3>
                            <p className={`text-[11px] leading-relaxed line-clamp-2 min-h-[32px] ${darkMode ? 'text-zinc-400 font-normal' : 'text-slate-650'}`}>
                              {comm.description}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1 font-mono text-[8.5px]">
                            {comm.tags.map(t => (
                              <span
                                key={t}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(t);
                                }}
                                className={`py-0.5 px-2 rounded-full border cursor-pointer hover:border-indigo-500/40 transition-all ${
                                  selectedTag === t
                                    ? 'bg-indigo-600 text-white'
                                    : darkMode ? 'bg-zinc-90-v10 border-white/5 text-slate-400' : 'bg-neutral-50 border-neutral-200 text-slate-600'
                                }`}
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-dashed border-neutral-200 dark:border-white/5 flex items-center justify-between text-xs font-bold font-mono">
                          <div className="text-[9.5px] text-slate-450 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span>{comm.memberIds.length} users</span>
                            <span>•</span>
                            <span>{resourcesCount} docs</span>
                            <span>•</span>
                            <span>{threadsCount} threads</span>
                          </div>

                          <div className="flex items-center gap-1.5 font-sans">
                            <button
                              id={`btn-join-grid-toggle-${comm.id}`}
                              onClick={() => handleJoinLeaveClick(comm.id)}
                              className={`text-[9.5px] font-bold uppercase tracking-wider py-1.5 px-3 rounded-lg border transition-all cursor-pointer ${
                                hasJoined
                                  ? 'border-rose-500/30 text-rose-505 bg-rose-500/5 hover:bg-rose-500/10'
                                  : 'border-neutral-200 dark:border-white/10 dark:text-slate-350 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-slate-650'
                              }`}
                            >
                              {hasJoined ? 'Leave' : 'Join'}
                            </button>
                            <button
                              id={`btn-enter-chapter-${comm.id}`}
                              onClick={() => {
                                setActiveCommunityId(comm.id);
                                setActiveTab('feed');
                              }}
                              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[9.5px] uppercase font-bold tracking-wider rounded-lg transition-colors flex items-center gap-0.5 shadow-sm"
                            >
                              Enter <ArrowRight size={10} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
