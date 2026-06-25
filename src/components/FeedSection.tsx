import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Post, Comment, Community, Story, Connection, CampusEvent, Project, GroupChat } from '../types';
import {
  Heart,
  MessageCircle,
  Send,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  Image as ImageIcon,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  UserPlus,
  Sparkle,
  MapPin,
  X,
  CheckCircle2,
  ExternalLink,
  Share2,
  Rocket,
  Users,
  MessageSquare,
  Globe,
  Zap,
} from 'lucide-react';
import StoriesBubbleTray from './StoriesBubbleTray';
import Avatar from './Avatar';
import { api } from '../api';

interface FeedSectionProps {
  currentUser: UserProfile;
  posts: Post[];
  allUsers: UserProfile[];
  communities: Community[];
  connections: Connection[];
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
  activeCommunityId?: string;
  stories: Story[];
  onAddStory: (content: string, image?: string) => void;
  registeredEvents?: string[];
  onRegisterEvent?: (eventId: string) => void;
  onViewUserProfile?: (userId: string) => void;
  onReactToStory?: (storyId: string, emoji: string) => void;
  onSendConnectionRequest?: (receiverId: string) => void;
  onNavigate?: (view: string) => void;
}

const POST_PRESETS = [
  { name: '🦾 Hardware Lab', url: 'https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=800&q=80' },
  { name: '💻 MoE Neural Model', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80' },
  { name: '👥 Startup Boardroom', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80' },
  { name: '🎨 Figma Blueprint', url: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=800&q=80' },
  { name: '☕ Cafe Launchpad', url: 'https://images.unsplash.com/photo-1507537297725-24a1c029d3ca?w=800&q=80' }
];

export default function FeedSection({
  currentUser,
  posts,
  allUsers,
  communities,
  connections,
  onAddPost,
  onLikePost,
  onAddComment,
  onDeletePost,
  darkMode,
  activeCommunityId,
  stories,
  onAddStory,
  registeredEvents = [],
  onRegisterEvent,
  onViewUserProfile,
  onReactToStory,
  onSendConnectionRequest,
  onNavigate,
}: FeedSectionProps) {
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedTag, setSelectedTag] = useState('Startup Pitch 🚀');
  const [selectedCommunity, setSelectedCommunity] = useState(activeCommunityId || '');
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [selectedFeeling, setSelectedFeeling] = useState<string>('');

  // Media attachment states
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [projectTitle, setProjectTitle] = useState('');
  const [postImage, setPostImage] = useState('');
  const [imageUploadType, setImageUploadType] = useState<'upload' | 'preset' | 'url'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ACADEMIC_TAGS = [
    'Startup Pitch 🚀',
    'Co-Founder Search 🤝',
    'Study Partner Wanted 📚',
    'Idea Drop 💡',
    'Research Collaborator 🔬',
    'Hackathon Squad 💻',
    'Mentor Match 🎓',
    'Startup Discussion 💬'
  ];

  const FEELING_PRESETS = [
    { emoji: '🚀', label: 'Building' },
    { emoji: '💡', label: 'Ideating' },
    { emoji: '🔥', label: 'Hustling' },
    { emoji: '🧠', label: 'Deep Work' },
    { emoji: '🤝', label: 'Networking' },
    { emoji: '📈', label: 'Grinding' },
    { emoji: '🤯', label: 'Pivoting' },
    { emoji: '🎯', label: 'Focused' },
    { emoji: '💭', label: 'Brainstorming' }
  ];

  const [campusEvents, setCampusEvents] = useState<CampusEvent[]>([]);
  const [eventDetailPopup, setEventDetailPopup] = useState<CampusEvent | null>(null);
  const [feedProjects, setFeedProjects] = useState<Project[]>([]);
  const [feedGroups, setFeedGroups] = useState<GroupChat[]>([]);

  useEffect(() => {
    api.events.getAll().then((data: CampusEvent[]) => setCampusEvents(data)).catch(() => {});
    api.projects.getAll().then((data: Project[]) => setFeedProjects(data)).catch(() => {});
    api.groupChats.getAll().then((data: GroupChat[]) => setFeedGroups(data)).catch(() => {});
  }, []);

  const handleEventRegister = async (ev: CampusEvent) => {
    const isRegistered = ev.registeredIds.includes(currentUser.id);
    try {
      const updated = isRegistered
        ? await api.events.unregister(ev.id, currentUser.id)
        : await api.events.register(ev.id, currentUser.id);
      setCampusEvents(prev => prev.map(e => e.id === ev.id ? updated : e));
      if (eventDetailPopup?.id === ev.id) setEventDetailPopup(updated);
    } catch {}
  };

  // Client-side local file uploader converts custom image to Base64
  const handleLocalImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('File size too large. Please select an image under 8MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    const finalImage = showMediaOptions && postImage ? postImage.trim() : undefined;
    const finalTitle = showMediaOptions && projectTitle.trim() ? projectTitle.trim() : undefined;

    onAddPost(
      newPostContent.trim(),
      selectedTag,
      selectedCommunity || undefined,
      finalTitle,
      finalImage,
      selectedFeeling || undefined
    );

    setNewPostContent('');
    setProjectTitle('');
    setPostImage('');
    setSelectedFeeling('');
    setShowMediaOptions(false);
  };

  const handleCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const txt = commentInputs[postId];
    if (!txt || !txt.trim()) return;
    onAddComment(postId, txt);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleCommentChange = (postId: string, val: string) => {
    setCommentInputs(prev => ({ ...prev, [postId]: val }));
  };

  // Filter posts based on community selection context
  const filteredPosts = posts.filter(p => {
    if (activeCommunityId) {
      return p.communityId === activeCommunityId;
    }
    return true;
  });

  // Smart co-founder matching — score based on shared interests, complementary skills, shared lookingFor
  const connectedUserIds = new Set(
    connections
      .filter(c => (c.senderId === currentUser.id || c.receiverId === currentUser.id))
      .map(c => c.senderId === currentUser.id ? c.receiverId : c.senderId)
  );

  const scoredMatches = allUsers
    .filter(u => u.id !== currentUser.id && !u.isSuspended && !connectedUserIds.has(u.id))
    .map(u => {
      let score = 0;
      const sharedInterests = u.interests.filter(i => currentUser.interests.includes(i)).length;
      const sharedLookingFor = u.lookingFor.filter(l => currentUser.lookingFor.includes(l)).length;
      const complementarySkills = u.skills.filter(s => !currentUser.skills.includes(s) && currentUser.lookingFor.some(l => s.toLowerCase().includes(l.toLowerCase().substring(0, 4)))).length;
      score += sharedInterests * 2;
      score += sharedLookingFor * 2;
      score += complementarySkills;
      if (u.college === currentUser.college) score += 1;
      return { user: u, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(m => m.user);

  // Suggestion cards injected between posts (Instagram-style)
  const dm = darkMode;
  const suggestPeople = allUsers
    .filter(u => u.id !== currentUser.id && !u.isSuspended && !connectedUserIds.has(u.id))
    .map(u => {
      let score = 0;
      score += u.interests.filter(i => currentUser.interests.includes(i)).length * 3;
      score += u.lookingFor.filter(l => currentUser.lookingFor.includes(l)).length * 2;
      if (u.college === currentUser.college) score += 2;
      return { u, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map(x => x.u);

  const suggestCommunities = communities.filter(c => !c.memberIds.includes(currentUser.id)).slice(0, 8);

  const suggestProjects = feedProjects
    .filter(p => p.creatorId !== currentUser.id && !p.memberIds.includes(currentUser.id))
    .slice(0, 6);

  const suggestGroups = feedGroups
    .filter(g => !g.memberIds.includes(currentUser.id) && !g.pendingIds.includes(currentUser.id))
    .slice(0, 6);

  const suggestEvents = campusEvents
    .filter(e => !e.registeredIds.includes(currentUser.id))
    .slice(0, 5);

  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<number>>(new Set());
  const [joinedProjects, setJoinedProjects] = useState<Set<string>>(new Set());
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(new Set());

  const SuggCard = ({ children, typeIndex, accentColor = 'text-indigo-400' }: { children: React.ReactNode; typeIndex: number; accentColor?: string }) => {
    const dismiss = () => setDismissedSuggestions(prev => new Set([...prev, typeIndex]));
    return (
      <div className={`rounded-2xl border overflow-hidden shadow-sm ${dm ? 'bg-[#121217] border-white/10' : 'bg-white border-neutral-200'}`}>
        {children}
        <div className={`px-4 pb-3 pt-0 flex items-center justify-between`}>
          <button onClick={dismiss} className={`text-[10px] ${dm ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'} transition-all cursor-pointer`}>
            Not interested
          </button>
        </div>
      </div>
    );
  };

  const renderSuggestionCard = (typeIndex: number, key: string) => {
    if (dismissedSuggestions.has(typeIndex)) return null;

    // TYPE 0 — People You May Know
    if (typeIndex === 0) {
      return (
        <SuggCard key={key} typeIndex={typeIndex}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center"><UserPlus size={12} className="text-indigo-500" /></div>
              <div>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Suggested for you</p>
                <h3 className={`text-xs font-bold leading-none mt-0.5 ${dm ? 'text-white' : 'text-slate-900'}`}>People You May Know 🤝</h3>
              </div>
            </div>
            <button onClick={() => onNavigate?.('explore')} className="text-[10px] font-semibold text-indigo-500 hover:text-indigo-400 cursor-pointer">See all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
            {suggestPeople.length === 0 ? (
              <p className={`text-xs py-4 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>You're well connected! 🎉</p>
            ) : suggestPeople.map(u => {
              const shared = u.interests.filter(i => currentUser.interests.includes(i)).length + u.lookingFor.filter(l => currentUser.lookingFor.includes(l)).length;
              return (
                <div key={u.id} className={`shrink-0 w-32 rounded-xl border p-3 flex flex-col items-center gap-2 text-center ${dm ? 'border-white/8 bg-white/4' : 'border-neutral-100 bg-slate-50/80'}`}>
                  <div className="relative">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden cursor-pointer" onClick={() => onViewUserProfile?.(u.id)}>
                      <Avatar avatar={u.avatar} />
                    </div>
                    {u.isVerified && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center text-[8px] text-white font-bold">✓</span>}
                  </div>
                  <div className="w-full">
                    <p className={`text-[11px] font-bold truncate cursor-pointer hover:underline ${dm ? 'text-white' : 'text-slate-900'}`} onClick={() => onViewUserProfile?.(u.id)}>{u.fullName.split(' ')[0]}</p>
                    <p className={`text-[9px] truncate mt-0.5 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{u.college?.split(' ').slice(0,2).join(' ') || 'Student'}</p>
                    {shared > 0 && <p className="text-[8px] text-indigo-500 font-semibold mt-0.5">{shared} shared {shared === 1 ? 'interest' : 'interests'}</p>}
                  </div>
                  <button onClick={() => onSendConnectionRequest?.(u.id)} className="w-full py-1.5 rounded-lg bg-indigo-500 text-white text-[10px] font-bold hover:bg-indigo-600 transition-all cursor-pointer">
                    + Connect
                  </button>
                </div>
              );
            })}
          </div>
        </SuggCard>
      );
    }

    // TYPE 1 — Clubs & Communities
    if (typeIndex === 1) {
      return (
        <SuggCard key={key} typeIndex={typeIndex}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center"><Users size={12} className="text-emerald-500" /></div>
              <div>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Join the buzz</p>
                <h3 className={`text-xs font-bold leading-none mt-0.5 ${dm ? 'text-white' : 'text-slate-900'}`}>Clubs & Communities 🏛️</h3>
              </div>
            </div>
            <button onClick={() => onNavigate?.('communities')} className="text-[10px] font-semibold text-emerald-500 hover:text-emerald-400 cursor-pointer">Browse all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
            {suggestCommunities.length === 0 ? (
              <p className={`text-xs py-4 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>You've joined all communities 🎉</p>
            ) : suggestCommunities.map(c => (
              <div key={c.id} className={`shrink-0 w-36 rounded-xl border p-3 flex flex-col items-center gap-2 text-center ${dm ? 'border-white/8 bg-white/4' : 'border-neutral-100 bg-slate-50/80'}`}>
                <div className={`w-11 h-11 rounded-full flex items-center justify-center text-2xl ${dm ? 'bg-white/8' : 'bg-indigo-50'}`}>{c.icon}</div>
                <div className="w-full">
                  <p className={`text-[11px] font-bold truncate ${dm ? 'text-white' : 'text-slate-900'}`}>{c.name}</p>
                  <p className={`text-[9px] mt-0.5 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{c.memberIds.length} members</p>
                  <p className={`text-[8px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{c.category}</p>
                </div>
                <button onClick={() => onNavigate?.('communities')} className="w-full py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition-all cursor-pointer">
                  Join
                </button>
              </div>
            ))}
          </div>
        </SuggCard>
      );
    }

    // TYPE 2 — Open Projects
    if (typeIndex === 2) {
      const STAGE_COLORS: Record<string, string> = {
        Idea: 'bg-amber-500/15 text-amber-500',
        Building: 'bg-blue-500/15 text-blue-500',
        MVP: 'bg-violet-500/15 text-violet-500',
        Launched: 'bg-emerald-500/15 text-emerald-500',
      };
      return (
        <SuggCard key={key} typeIndex={typeIndex}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center"><Rocket size={12} className="text-amber-500" /></div>
              <div>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Collaborate</p>
                <h3 className={`text-xs font-bold leading-none mt-0.5 ${dm ? 'text-white' : 'text-slate-900'}`}>Open Projects 🛠️</h3>
              </div>
            </div>
            <button onClick={() => onNavigate?.('projects')} className="text-[10px] font-semibold text-amber-500 hover:text-amber-400 cursor-pointer">See all</button>
          </div>
          {suggestProjects.length === 0 ? (
            <div className="px-4 pb-4">
              <p className={`text-xs text-center py-3 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>No open projects right now. <button onClick={() => onNavigate?.('projects')} className="text-amber-500 font-semibold cursor-pointer">Start one →</button></p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
              {suggestProjects.map(p => {
                const isJoined = joinedProjects.has(p.id);
                return (
                  <div key={p.id} className={`shrink-0 w-44 rounded-xl border p-3 flex flex-col gap-2 ${dm ? 'border-white/8 bg-white/4' : 'border-neutral-100 bg-slate-50/80'}`}>
                    <div className="flex items-center justify-between">
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${STAGE_COLORS[p.stage] || 'bg-slate-100 text-slate-500'}`}>{p.stage}</span>
                      <span className={`text-[9px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{p.memberIds.length} members</span>
                    </div>
                    <p className={`text-[11px] font-bold leading-snug ${dm ? 'text-white' : 'text-slate-900'}`}>{p.title}</p>
                    <p className={`text-[9px] leading-relaxed line-clamp-2 ${dm ? 'text-slate-400' : 'text-slate-500'}`}>{p.description}</p>
                    {p.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.tags.slice(0,2).map(t => (
                          <span key={t} className={`text-[8px] px-1 py-0.5 rounded ${dm ? 'bg-white/8 text-slate-400' : 'bg-neutral-200 text-slate-500'}`}>{t}</span>
                        ))}
                      </div>
                    )}
                    <button
                      onClick={async () => {
                        if (isJoined) return;
                        try { await api.projects.join(p.id, currentUser.id); setJoinedProjects(prev => new Set([...prev, p.id])); } catch {}
                      }}
                      className={`mt-auto w-full py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${isJoined ? 'bg-emerald-500/15 text-emerald-500' : 'bg-amber-500 text-white hover:bg-amber-600'}`}
                    >
                      {isJoined ? '✓ Joined' : 'Join Project'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </SuggCard>
      );
    }

    // TYPE 3 — Campus Groups
    if (typeIndex === 3) {
      const TYPE_COLORS: Record<string, string> = {
        college: 'bg-blue-500/15 text-blue-500',
        batch: 'bg-violet-500/15 text-violet-500',
        branch: 'bg-pink-500/15 text-pink-500',
        course: 'bg-cyan-500/15 text-cyan-500',
        exam: 'bg-rose-500/15 text-rose-500',
        interest: 'bg-amber-500/15 text-amber-500',
      };
      return (
        <SuggCard key={key} typeIndex={typeIndex}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-violet-500/10 flex items-center justify-center"><MessageSquare size={12} className="text-violet-500" /></div>
              <div>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Campus circles</p>
                <h3 className={`text-xs font-bold leading-none mt-0.5 ${dm ? 'text-white' : 'text-slate-900'}`}>Groups to Join 💬</h3>
              </div>
            </div>
            <button onClick={() => onNavigate?.('messages')} className="text-[10px] font-semibold text-violet-500 hover:text-violet-400 cursor-pointer">See all</button>
          </div>
          {suggestGroups.length === 0 ? (
            <div className="px-4 pb-4">
              <p className={`text-xs text-center py-3 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>You're in all relevant groups! <button onClick={() => onNavigate?.('messages')} className="text-violet-500 font-semibold cursor-pointer">Create one →</button></p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
              {suggestGroups.map(g => {
                const isRequested = joinedGroups.has(g.id);
                return (
                  <div key={g.id} className={`shrink-0 w-40 rounded-xl border p-3 flex flex-col gap-2 ${dm ? 'border-white/8 bg-white/4' : 'border-neutral-100 bg-slate-50/80'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                      <MessageSquare size={16} className="text-white" />
                    </div>
                    <div>
                      <p className={`text-[11px] font-bold leading-snug ${dm ? 'text-white' : 'text-slate-900'}`}>{g.name}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-bold ${TYPE_COLORS[g.type] || 'bg-slate-100 text-slate-500'}`}>{g.type}</span>
                      </div>
                      <p className={`text-[9px] mt-1 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{g.memberIds.length} members · {g.college.split(' ').slice(0,2).join(' ')}</p>
                    </div>
                    <button
                      onClick={() => { setJoinedGroups(prev => new Set([...prev, g.id])); onNavigate?.('messages'); }}
                      className={`mt-auto w-full py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${isRequested ? 'bg-violet-500/15 text-violet-500' : 'bg-violet-500 text-white hover:bg-violet-600'}`}
                    >
                      {isRequested ? '→ Open Chats' : 'Join Group'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </SuggCard>
      );
    }

    // TYPE 4 — Upcoming Events
    if (typeIndex === 4) {
      const catColors: Record<string, string> = {
        Hackathon: 'from-orange-500 to-rose-500',
        'Study Group': 'from-blue-500 to-indigo-500',
        Seminar: 'from-violet-500 to-purple-600',
        Workshop: 'from-cyan-500 to-teal-500',
        Social: 'from-pink-500 to-rose-400',
        Sports: 'from-green-500 to-emerald-500',
      };
      return (
        <SuggCard key={key} typeIndex={typeIndex}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-rose-500/10 flex items-center justify-center"><Calendar size={12} className="text-rose-500" /></div>
              <div>
                <p className={`text-[9px] font-mono uppercase tracking-wider ${dm ? 'text-slate-500' : 'text-slate-400'}`}>Don't miss out</p>
                <h3 className={`text-xs font-bold leading-none mt-0.5 ${dm ? 'text-white' : 'text-slate-900'}`}>Upcoming Events 📅</h3>
              </div>
            </div>
            <button onClick={() => onNavigate?.('events')} className="text-[10px] font-semibold text-rose-500 hover:text-rose-400 cursor-pointer">See all</button>
          </div>
          {suggestEvents.length === 0 ? (
            <div className="px-4 pb-4">
              <p className={`text-xs text-center py-3 ${dm ? 'text-slate-500' : 'text-slate-400'}`}>You're all caught up on events! 🎉</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 no-scrollbar">
              {suggestEvents.map(ev => {
                const grad = catColors[ev.category] || 'from-indigo-500 to-violet-600';
                return (
                  <div key={ev.id} className={`shrink-0 w-44 rounded-xl border overflow-hidden ${dm ? 'border-white/8' : 'border-neutral-100'}`}>
                    <div className={`h-10 bg-gradient-to-r ${grad} flex items-center px-3 gap-2`}>
                      <span className="text-[8px] font-bold text-white/90 uppercase tracking-wide">{ev.category}</span>
                      {ev.isOnline && <Globe size={9} className="text-white/80 ml-auto shrink-0" />}
                    </div>
                    <div className={`p-3 flex flex-col gap-1.5 ${dm ? 'bg-white/4' : 'bg-slate-50/80'}`}>
                      <p className={`text-[11px] font-bold leading-snug ${dm ? 'text-white' : 'text-slate-900'}`}>{ev.title}</p>
                      <p className={`text-[9px] ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{ev.date}{ev.time ? ` · ${ev.time}` : ''}</p>
                      {ev.venue && <p className={`text-[9px] truncate ${dm ? 'text-slate-500' : 'text-slate-400'}`}>{ev.venue}</p>}
                      <p className={`text-[9px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{ev.registeredIds.length}{ev.maxSeats ? `/${ev.maxSeats}` : ''} going</p>
                      <button
                        onClick={() => { handleEventRegister(ev); }}
                        className="mt-1 w-full py-1.5 rounded-lg bg-rose-500 text-white text-[10px] font-bold hover:bg-rose-600 transition-all cursor-pointer"
                      >
                        Register →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SuggCard>
      );
    }

    // TYPE 5 — Explore Campus Banner
    if (typeIndex === 5) {
      return (
        <div key={key} className={`rounded-2xl border overflow-hidden shadow-sm ${dm ? 'bg-[#121217] border-white/10' : 'bg-white border-neutral-200'}`}>
          <div className="relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-5">
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/2" />
            <p className="text-[9px] font-mono text-white/60 uppercase tracking-widest mb-1">Discover The Network</p>
            <h3 className="text-sm font-extrabold text-white">Explore Your Campus 🎓</h3>
            <p className="text-[11px] text-white/70 mt-1 max-w-[260px]">Find students, join communities, discover hackathons, and build your college network</p>
          </div>
          <div className={`grid grid-cols-3 ${dm ? 'divide-x divide-white/5 border-t border-white/5' : 'divide-x divide-neutral-100 border-t border-neutral-100'}`}>
            {[
              { icon: '🔍', label: 'Discover', sub: 'Find people', view: 'explore' },
              { icon: '🏛️', label: 'Communities', sub: 'Join clubs', view: 'communities' },
              { icon: '🏫', label: 'Colleges', sub: 'Browse campus', view: 'colleges' },
            ].map(item => (
              <button key={item.view} onClick={() => onNavigate?.(item.view)} className={`flex flex-col items-center gap-1 py-3.5 px-2 text-center transition-all cursor-pointer ${dm ? 'hover:bg-white/5' : 'hover:bg-neutral-50'}`}>
                <span className="text-lg">{item.icon}</span>
                <span className={`text-[10px] font-bold ${dm ? 'text-slate-300' : 'text-slate-700'}`}>{item.label}</span>
                <span className={`text-[8px] ${dm ? 'text-slate-600' : 'text-slate-400'}`}>{item.sub}</span>
              </button>
            ))}
          </div>
          <div className={`px-4 pb-3 pt-2 flex items-center justify-between border-t ${dm ? 'border-white/5' : 'border-neutral-100'}`}>
            <button onClick={() => setDismissedSuggestions(prev => new Set([...prev, typeIndex]))} className={`text-[10px] ${dm ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-500'} transition-all cursor-pointer`}>
              Not interested
            </button>
            <button onClick={() => onNavigate?.('explore')} className="text-[10px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer flex items-center gap-1">
              Explore all <Zap size={9} />
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* 2-Column Wide Left Segment: Instagram-Style Posts & Creator */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Stories Ring Bubble Tray - Always First */}
        <StoriesBubbleTray
          currentUser={currentUser}
          stories={stories}
          allUsers={allUsers}
          onAddStory={onAddStory}
          darkMode={darkMode}
          onViewUserProfile={onViewUserProfile}
          onReactToStory={onReactToStory}
        />

        {/* Compact Mobile Events Slider — horizontal, scrollbar hidden */}
        {campusEvents.length > 0 && (
          <div className="block lg:hidden rounded-2xl border border-neutral-200/80 dark:border-white/10 p-4 shadow-sm overflow-hidden bg-gradient-to-tr from-indigo-50/10 to-indigo-500/5 dark:from-indigo-950/20 dark:to-transparent">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
                <Calendar size={12} /> Live Campus Events
              </span>
              <span className="text-[9px] font-mono opacity-50">{campusEvents.length} Events</span>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {campusEvents.map((event) => {
                const isJoined = event.registeredIds.includes(currentUser.id);
                return (
                  <div key={event.id} className={`shrink-0 w-52 p-3 rounded-xl border ${darkMode ? 'bg-zinc-950 border-white/5' : 'bg-white border-neutral-250/60'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-1.5 py-0.5 rounded text-[7.5px] font-bold uppercase tracking-tight bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/25">
                        {event.category}
                      </span>
                      <span className="text-[8.5px] opacity-50 font-mono">{event.date}</span>
                    </div>
                    <h4 className="text-[11px] font-bold truncate text-slate-800 dark:text-white mb-1">{event.title}</h4>
                    <p className="text-[9px] text-slate-400 truncate mb-2">{event.venue || event.college}</p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEventDetailPopup(event)}
                        className={`flex-1 text-center py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer ${darkMode ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-neutral-100 text-slate-500 hover:bg-neutral-200'}`}
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleEventRegister(event)}
                        className={`flex-1 text-center py-1.5 text-[9px] font-bold uppercase rounded-lg transition-all cursor-pointer ${isJoined ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-indigo-500 text-white hover:bg-indigo-600'}`}
                      >
                        {isJoined ? '✓ Going' : 'Join'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instagram/LinkedIn-style Compose Card */}
        {!currentUser.isSuspended && (
          <form onSubmit={handlePostSubmit} className={`p-4 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm transition-all ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
            <div className="flex gap-3">
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shrink-0 self-start">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-white dark:border-[#121217] overflow-hidden ${darkMode ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
                  <Avatar avatar={currentUser.avatar} />
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-3">
                <textarea
                  id="feed-post-input"
                  rows={2}
                  required
                  placeholder={`What are you building, ${currentUser.fullName.split(' ')[0]}? Pitch an idea, find a co-founder, or post a study group request...`}
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none transition-all ${darkMode ? 'bg-[#09090C] text-slate-100' : 'bg-neutral-50 text-slate-900'}`}
                />

                {/* Instant Life Vibe / Feeling Picker */}
                <div className="space-y-1.5 pt-0.5 pb-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                      <Sparkle size={10} className="text-pink-500 animate-spin-slow" />
                      <span>Builder status / What mode are you in?</span>
                    </span>
                    {selectedFeeling && (
                      <button
                        type="button"
                        onClick={() => setSelectedFeeling('')}
                        className="text-[8.5px] font-bold text-rose-500 hover:underline uppercase bg-transparent border-0 cursor-pointer"
                      >
                        Clear ×
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {FEELING_PRESETS.map((preset) => {
                      const feelingString = `${preset.emoji} ${preset.label}`;
                      const isSelected = selectedFeeling === feelingString;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setSelectedFeeling(isSelected ? '' : feelingString)}
                          className={`px-2.5 py-1 rounded-xl border text-[11px] transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-500 to-pink-500 border-transparent text-white font-extrabold scale-[1.04] shadow-xs'
                              : darkMode
                              ? 'bg-[#09090C] border-white/5 text-[#F9F7F2] hover:bg-neutral-800'
                              : 'bg-slate-50 border-neutral-250/60 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span>{preset.emoji}</span>
                          <span className="text-[9.5px] font-medium">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Real-time media attachments tray */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowMediaOptions(!showMediaOptions);
                      if(!showMediaOptions && !postImage) {
                        setImageUploadType('upload');
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 hover:text-indigo-500 transition-colors py-1 cursor-pointer bg-transparent border-0 shrink-0"
                  >
                    <ImageIcon size={13} className="text-pink-500" />
                    <span>{showMediaOptions ? 'Hide ↑' : 'Attach Media ↓'}</span>
                  </button>

                  <select
                    id="feed-tag-select"
                    value={selectedTag}
                    onChange={(e) => setSelectedTag(e.target.value)}
                    className={`max-w-[150px] text-[9.5px] font-bold uppercase px-2 py-1 rounded-lg border border-neutral-250 dark:border-white/10 focus:outline-none cursor-pointer shrink-0 ${darkMode ? 'bg-[#09090C] text-slate-300' : 'bg-white text-slate-700'}`}
                  >
                    {ACADEMIC_TAGS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Expandable media attachment area */}
                {showMediaOptions && (
                  <div className={`p-4 border border-dashed rounded-xl space-y-3 ${darkMode ? 'bg-[#09090C] border-zinc-700/50' : 'bg-neutral-50/50 border-neutral-200'}`}>
                    
                    <div className="space-y-1">
                      <label className="block text-[8.5px] font-mono font-bold uppercase tracking-wider opacity-60">Startup / Project Name (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. AeroCrops Autonomous Drone"
                        value={projectTitle}
                        onChange={(e) => setProjectTitle(e.target.value)}
                        className={`w-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-neutral-255 dark:border-white/10 text-xs rounded-xl ${darkMode ? 'bg-[#121217] text-white' : 'bg-white text-black'}`}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center bg-neutral-100/60 dark:bg-white/5 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setImageUploadType('upload')}
                          className={`flex-1 py-1 text-[8.5px] font-bold uppercase tracking-tight rounded-md ${imageUploadType === 'upload' ? 'bg-indigo-500 text-white' : 'opacity-65 text-neutral-400'}`}
                        >
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUploadType('preset')}
                          className={`flex-1 py-1 text-[8.5px] font-bold uppercase tracking-tight rounded-md ${imageUploadType === 'preset' ? 'bg-indigo-500 text-white' : 'opacity-65 text-neutral-400'}`}
                        >
                          Stock Preset
                        </button>
                        <button
                          type="button"
                          onClick={() => setImageUploadType('url')}
                          className={`flex-1 py-1 text-[8.5px] font-bold uppercase tracking-tight rounded-md ${imageUploadType === 'url' ? 'bg-indigo-500 text-white' : 'opacity-65 text-neutral-400'}`}
                        >
                          Paste Link
                        </button>
                      </div>

                      {imageUploadType === 'upload' && (
                        <div className="text-center p-3 border border-dashed border-neutral-300 dark:border-zinc-700 rounded-xl">
                          <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleLocalImageChange}
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10px] font-semibold bg-indigo-500/10 text-indigo-500 px-3 py-1.5 rounded-lg hover:bg-indigo-500 hover:text-white transition-all cursor-pointer"
                          >
                            📷 Choose Local Photo
                          </button>
                          <p className="text-[8px] font-mono opacity-50 mt-1">Accepts PNG, JPG, GIF up to 8MB</p>
                        </div>
                      )}

                      {imageUploadType === 'preset' && (
                        <div className="flex flex-wrap gap-1">
                          {POST_PRESETS.map((preset) => (
                            <button
                              key={preset.name}
                              type="button"
                              onClick={() => setPostImage(preset.url)}
                              className={`px-2 py-1 text-[8.5px] border font-bold uppercase cursor-pointer rounded-lg tracking-tight transition-all ${postImage === preset.url ? 'bg-indigo-500 text-white border-transparent' : 'border-neutral-200 dark:border-white/10 bg-transparent text-neutral-500 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              {preset.name}
                            </button>
                          ))}
                        </div>
                      )}

                      {imageUploadType === 'url' && (
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/photo-..."
                          value={postImage}
                          onChange={(e) => setPostImage(e.target.value)}
                          className={`w-full px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-neutral-200 dark:border-white/10 text-xs rounded-xl ${darkMode ? 'bg-[#121217] text-white' : 'bg-white text-black'}`}
                        />
                      )}

                      {postImage && (
                        <div className="relative pt-1">
                          <img
                            src={postImage}
                            alt="Preview Showcase"
                            className="h-32 w-full object-cover rounded-xl border border-neutral-300 dark:border-zinc-700/60"
                          />
                          <button
                            type="button"
                            onClick={() => setPostImage('')}
                            className="absolute bottom-2 right-2 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-mono uppercase text-[8px] font-bold rounded-lg shadow-sm cursor-pointer border-0"
                          >
                            Remove Photo ×
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-white/5">
                  <span className="text-[9px] text-slate-400 font-mono truncate min-w-0">
                    Posting to {selectedCommunity ? communities.find(c => c.id === selectedCommunity)?.name : 'General Campus Desk'}
                  </span>
                  
                  <button
                    id="btn-submit-post"
                    type="submit"
                    className="shrink-0 py-1.5 px-4 rounded-xl bg-indigo-550 hover:bg-indigo-600 text-white font-bold uppercase text-[10px] tracking-wider flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <Plus size={13} />
                    <span>Launch Post</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {/* Dynamic Feed Posts Stack */}
        <div className="space-y-5">
          {filteredPosts.length === 0 ? (
            <div className={`p-8 rounded-2xl border border-neutral-200 dark:border-white/10 text-center shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
              <Clock className="mx-auto text-neutral-400 mb-2 animate-spin-slow" size={24} />
              <h3 className="text-xs font-bold uppercase tracking-widest mb-1.5 text-slate-800 dark:text-slate-200">No Postings Uploaded</h3>
              <p className={`text-xs max-w-sm mx-auto ${darkMode ? 'text-zinc-500' : 'text-neutral-550'}`}>
                Be the first to share a live startup photo or collaborative query onto this board.
              </p>
            </div>
          ) : (
            filteredPosts.flatMap((post, postIndex) => {
              const author = allUsers.find(u => u.id === post.authorId);
              const isLiked = post.likes.includes(currentUser.id);
              const dateStr = new Date(post.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              if (!author || author.isSuspended) return [];

              const postCard = (
                <div
                  id={`feed-post-card-${post.id}`}
                  key={post.id}
                  className={`rounded-2xl border border-neutral-200/90 dark:border-white/10 overflow-hidden shadow-sm transition-all hover:border-neutral-300 dark:hover:border-white/20 ${darkMode ? 'bg-[#121217] text-slate-100' : 'bg-white text-slate-900'}`}
                >
                  {/* Card Header (Profile & Startup Association) */}
                  <div className="p-4 flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-white/5">
                    <div 
                      onClick={() => onViewUserProfile && onViewUserProfile(author.id)}
                      className={`flex items-center gap-2.5 ${onViewUserProfile ? 'cursor-pointer hover:opacity-85 transition-all' : ''}`}
                      title="View Student Profile"
                    >
                      <div className="p-[2px] rounded-full bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white dark:border-[#121217] overflow-hidden ${darkMode ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
                          <Avatar avatar={author.avatar} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold flex flex-wrap items-center gap-1.5 text-slate-850 dark:text-white">
                          <span className="hover:underline">{author.fullName}</span>
                          {author.isVerified && (
                            <span className="py-0.2 px-1 rounded bg-indigo-500/10 text-indigo-500 dark:bg-indigo-500/25 text-[8px] font-mono font-bold uppercase">
                              VERIFIED
                            </span>
                          )}
                          {post.feeling && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500/10 to-pink-500/10 text-indigo-600 dark:text-pink-300 text-[9.5px] font-bold">
                              is feeling {post.feeling}
                            </span>
                          )}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[240px]">
                          {author.college} • {author.branch} • Year {author.year}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono opacity-50 bg-[#09090c]/5 dark:bg-white/5 px-2 py-0.5 rounded">
                        {dateStr}
                      </span>
                      {onDeletePost && currentUser.role === 'admin' && (
                        <button
                          id={`btn-delete-post-${post.id}`}
                          onClick={() => onDeletePost(post.id)}
                          className="p-1 rounded-full hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer border-0 bg-transparent"
                          title="Delete Post"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Optional Project Showcase Ribbon */}
                  {post.projectTitle && (
                    <div className="bg-gradient-to-r from-indigo-50 to-pink-50/30 dark:from-indigo-950/20 dark:to-transparent px-4 py-2 flex items-center justify-between border-b border-neutral-100 dark:border-white/5">
                      <div className="flex items-center gap-1.5">
                        <Sparkles size={11} className="text-indigo-500 shrink-0" />
                        <span className="text-[10px] uppercase font-mono font-extrabold text-indigo-600 dark:text-indigo-400 tracking-wider">
                          Startup Showcase: {post.projectTitle}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Image Body (Full Width Just like Instagram) */}
                  {post.postImage && (
                    <div className="relative bg-neutral-900 border-b border-neutral-150 dark:border-white/5">
                      <img
                        src={post.postImage}
                        alt="Startup showcase"
                        className="w-full h-auto max-h-[380px] object-cover mx-auto"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}

                  {/* Content & Description Caption Area */}
                  <div className="p-4 space-y-3">
                    <p className={`text-xs leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-zinc-200' : 'text-neutral-750'}`}>
                      <span className="font-bold mr-1.5 text-slate-900 dark:text-white">{author.fullName.split(' ')[0]}</span>
                      {post.content}
                    </p>

                    {/* Meta Hashtags and Categories */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.academicTag && (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 text-[9px] font-bold uppercase tracking-wider">
                          #{post.academicTag.replace(/\s+/g, '')}
                        </span>
                      )}
                      {post.communityId && (
                        <span className="inline-flex items-center py-0.5 px-1.5 rounded bg-pink-500/10 text-pink-500 dark:bg-pink-500/20 text-[9px] font-bold uppercase tracking-wider">
                          #{communities.find(c => c.id === post.communityId)?.name.split(' ')[0]}
                        </span>
                      )}
                    </div>

                    {/* Instagram micro-interactions row */}
                    <div className="flex items-center gap-4 pt-1 py-2 border-t border-b border-neutral-100 dark:border-white/5 text-xs">
                      <button
                        id={`btn-like-${post.id}`}
                        onClick={() => onLikePost(post.id)}
                        className={`flex items-center gap-1.5 transition-colors cursor-pointer border-0 bg-transparent ${isLiked ? 'text-rose-500 font-bold' : 'text-[#8E8E8F] hover:text-slate-900 dark:hover:text-white'}`}
                      >
                        <Heart size={15} fill={isLiked ? 'currentColor' : 'none'} />
                        <span className="text-[10px] font-bold font-mono tracking-tighter">{post.likes.length} Likes</span>
                      </button>

                      <div className="flex items-center gap-1 text-[#8E8E8F]">
                        <MessageCircle size={15} />
                        <span className="text-[10px] font-bold font-mono tracking-tighter">{post.comments.length} Comments</span>
                      </div>

                      <button
                        onClick={async () => {
                          const shareData = {
                            title: `Post by ${post.author?.fullName ?? 'someone'} on The Network`,
                            text: post.content.length > 100 ? post.content.substring(0, 100) + '…' : post.content,
                            url: window.location.href,
                          };
                          if (navigator.share) {
                            try { await navigator.share(shareData); } catch (_) {}
                          } else {
                            await navigator.clipboard.writeText(window.location.href);
                            alert('Link copied!');
                          }
                        }}
                        className="flex items-center gap-1.5 text-[#8E8E8F] hover:text-indigo-500 transition-colors cursor-pointer border-0 bg-transparent ml-auto"
                      >
                        <Share2 size={14} />
                        <span className="text-[10px] font-bold font-mono tracking-tighter">Share</span>
                      </button>
                    </div>

                    {/* Comment Feed list */}
                    <div className="space-y-2.5 mt-2 max-h-48 overflow-y-auto no-scrollbar pr-1">
                      {post.comments.map((comment) => {
                        const commAuthor = allUsers.find(u => u.id === comment.authorId);
                        if (!commAuthor || commAuthor.isSuspended) return null;

                        return (
                          <div key={comment.id} className="text-[11px] leading-relaxed flex items-start gap-1.5 min-w-0 overflow-hidden">
                            <span 
                              onClick={() => onViewUserProfile && onViewUserProfile(commAuthor.id)}
                              className={`font-extrabold shrink-0 transition-all ${
                                onViewUserProfile ? 'cursor-pointer hover:underline text-indigo-500 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-100'
                              }`}
                              title={`View ${commAuthor.fullName}'s Profile`}
                            >
                              {commAuthor.fullName.split(' ')[0]}:
                            </span>
                            <span className={`break-words min-w-0 overflow-hidden ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              {comment.content}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Direct Comment Submission Form */}
                    {!currentUser.isSuspended && (
                      <form onSubmit={(e) => handleCommentSubmit(post.id, e)} className="flex gap-2 pt-2 border-t border-neutral-100 dark:border-white/5">
                        <input
                          id={`input-comment-${post.id}`}
                          type="text"
                          required
                          placeholder="Type constructive peer feedback..."
                          value={commentInputs[post.id] || ''}
                          onChange={(e) => handleCommentChange(post.id, e.target.value)}
                          className={`flex-1 px-3 py-1.5 text-[11px] rounded-lg border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-neutral-50 text-slate-900'}`}
                        />
                        <button
                          id={`btn-comment-${post.id}`}
                          type="submit"
                          className="p-1.5 px-3 rounded-lg bg-indigo-550 hover:bg-indigo-600 text-white font-bold flex items-center justify-center cursor-pointer transition-colors border-0"
                        >
                          <Send size={11} />
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              );

              const shouldInject = (postIndex + 1) % 3 === 0;
              const suggTypeIndex = (Math.floor((postIndex + 1) / 3) - 1) % 6;
              const suggCard = shouldInject ? renderSuggestionCard(suggTypeIndex, `sugg-${postIndex}`) : null;
              return [postCard, ...(suggCard ? [suggCard] : [])];
            })
          )}
        </div>
      </div>

      {/* 1-Column Segment: Instantly Loaded Desktop Campus Events & Top suggestions */}
      <div className="hidden lg:block space-y-6">
        
        {/* User Mini Card Dashboard */}
        <div className={`p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 text-left ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-gradient-to-tr from-pink-500 to-amber-500 text-white shrink-0 overflow-hidden`}>
              <Avatar avatar={currentUser.avatar} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-xs uppercase text-slate-800 dark:text-white leading-none">{currentUser.fullName}</h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">{currentUser.college}</p>
              <div className="mt-1 pb-0.5">
                <span className="text-[8px] bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-mono py-0.5 px-1.5 rounded uppercase font-bold">
                  {currentUser.role} Account
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Campus Events Sidebar Hub - Always prominent on the upper side */}
        <div className={`p-5 rounded-2xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-white/5 pb-2">
            <h3 className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400 flex items-center gap-1.5">
              <Calendar size={13} className="text-rose-500" />
              <span>Live Campus events</span>
            </h3>
            <span className="text-[9px] font-mono opacity-50">Happening now</span>
          </div>

          {campusEvents.length === 0 ? (
            <p className="text-[10px] text-slate-400 text-center py-4">No events posted yet. Go to Events to post one!</p>
          ) : (
            <div className="space-y-4">
              {campusEvents.slice(0, 4).map((event) => {
                const isRegistered = event.registeredIds.includes(currentUser.id);
                const spotsLeft = event.maxSeats ? event.maxSeats - event.registeredIds.length : null;
                const isFull = spotsLeft !== null && spotsLeft <= 0 && !isRegistered;
                return (
                  <div key={event.id} className="text-xs group">
                    <div className="flex items-center justify-between mb-1">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 dark:bg-indigo-550/30 dark:text-indigo-400">
                        {event.category}
                      </span>
                      <span className="text-[9px] font-mono opacity-50">{event.date}{event.time ? ` · ${event.time}` : ''}</span>
                    </div>
                    <button
                      onClick={() => setEventDetailPopup(event)}
                      className="block w-full text-left cursor-pointer"
                    >
                      <h4 className="font-bold text-slate-850 dark:text-slate-100 transition-colors group-hover:text-indigo-500">{event.title}</h4>
                      <p className="text-[10px] text-slate-400/90 leading-relaxed mt-1 text-left line-clamp-2">{event.description}</p>
                    </button>
                    
                    <div className="mt-2.5 flex items-center justify-between text-[9px] font-mono">
                      <span className="opacity-60 text-slate-400">by {event.organizer}</span>
                      <button
                        onClick={() => handleEventRegister(event)}
                        disabled={isFull}
                        className={`px-2 py-1 text-[8.5px] uppercase font-bold rounded cursor-pointer transition-all ${isRegistered ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : isFull ? 'bg-neutral-100 dark:bg-white/5 text-slate-400 cursor-not-allowed' : 'bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500 hover:text-white'}`}
                      >
                        {isRegistered ? '✓ Reserved' : isFull ? 'Full' : 'Register Seat'}
                      </button>
                    </div>
                    <div className="mt-3.5 border-b border-dashed border-neutral-150 dark:border-white/5" />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Smart Co-Founder Matching */}
        <div className={`p-5 rounded-2xl border border-neutral-200 dark:border-white/10 ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <div className="flex items-center justify-between mb-4 border-b border-neutral-100 dark:border-white/5 pb-2">
            <h3 className="text-[10px] font-sans font-extrabold uppercase tracking-wider text-slate-400 dark:text-zinc-400 flex items-center gap-1.5">
              <Sparkle size={13} className="text-amber-500" />
              <span>People You Should Meet</span>
            </h3>
            <span className="text-[9px] font-mono text-indigo-400 opacity-70">AI Match</span>
          </div>

          {scoredMatches.length === 0 ? (
            <p className="text-[11px] text-slate-400 text-center py-4">You're connected with everyone! 🎉</p>
          ) : (
            <div className="space-y-3">
              {scoredMatches.map((user) => {
                const sharedCount = user.interests.filter(i => currentUser.interests.includes(i)).length
                  + user.lookingFor.filter(l => currentUser.lookingFor.includes(l)).length;
                return (
                  <div key={user.id} className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => onViewUserProfile?.(user.id)}
                      className={`flex items-center gap-2 min-w-0 flex-1 p-1.5 rounded-xl transition-all text-left ${onViewUserProfile ? 'cursor-pointer hover:bg-neutral-500/5' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                        <Avatar avatar={user.avatar} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-[11px] text-slate-800 dark:text-white leading-none truncate">{user.fullName}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5 truncate">{user.branch} • Yr {user.year}</p>
                        {sharedCount > 0 && (
                          <p className="text-[8px] text-indigo-500 mt-0.5 font-semibold">{sharedCount} shared interest{sharedCount > 1 ? 's' : ''}</p>
                        )}
                      </div>
                    </button>
                    <button
                      onClick={() => onSendConnectionRequest?.(user.id)}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white text-[9px] font-bold transition-all cursor-pointer"
                    >
                      <UserPlus size={10} />
                      Connect
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>

    {eventDetailPopup && <EventDetailModal ev={eventDetailPopup} darkMode={darkMode} currentUser={currentUser} onClose={() => setEventDetailPopup(null)} onRegister={handleEventRegister} />}
    </>
  );
}

function EventDetailModal({ ev, darkMode, currentUser, onClose, onRegister }: {
  ev: CampusEvent;
  darkMode: boolean;
  currentUser: UserProfile;
  onClose: () => void;
  onRegister: (ev: CampusEvent) => void;
}) {
  const isRegistered = ev.registeredIds.includes(currentUser.id);
  const spotsLeft = ev.maxSeats ? ev.maxSeats - ev.registeredIds.length : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0 && !isRegistered;
  const bannerColor = ev.category === 'Hackathon' ? 'from-orange-500 to-rose-500'
    : ev.category === 'Study Group' ? 'from-blue-500 to-indigo-500'
    : ev.category === 'Seminar' ? 'from-violet-500 to-purple-600'
    : ev.category === 'Workshop' ? 'from-cyan-500 to-teal-500'
    : 'from-indigo-500 to-purple-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className={`relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${darkMode ? 'bg-[#121217] border-white/10' : 'bg-white border-neutral-200'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className={`h-16 bg-gradient-to-r ${bannerColor} flex items-center px-5 gap-3`}>
          <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-bold">{ev.category}</span>
          {ev.isOnline && <span className="text-[10px] font-bold text-white/80">🌐 Online</span>}
          <button onClick={onClose} className="ml-auto text-white/80 hover:text-white cursor-pointer"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-3">
          <h3 className={`font-bold text-sm leading-snug ${darkMode ? 'text-white' : 'text-slate-900'}`}>{ev.title}</h3>

          <div className="grid grid-cols-2 gap-2">
            <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <Calendar size={11} className="text-indigo-500 shrink-0" />{ev.date}
            </div>
            {ev.time && (
              <div className={`flex items-center gap-1.5 text-xs ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <Clock size={11} className="text-indigo-500 shrink-0" />{ev.time}
              </div>
            )}
            {ev.venue && (
              <div className={`flex items-center gap-1.5 text-xs col-span-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                <MapPin size={11} className="text-rose-500 shrink-0" />{ev.venue}
              </div>
            )}
          </div>

          <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{ev.description}</p>

          <div className="flex items-center justify-between text-[10px]">
            <span className={`font-mono ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              {ev.registeredIds.length}{ev.maxSeats ? `/${ev.maxSeats}` : ''} going
              {isFull && <span className="ml-1 text-rose-500 font-bold">· FULL</span>}
            </span>
            <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>by {ev.organizer}</span>
          </div>

          <div className="flex gap-2 pt-1">
            {ev.link && (
              <a
                href={ev.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer ${darkMode ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-neutral-200 text-slate-500 hover:bg-neutral-50'}`}
              >
                <ExternalLink size={11} />Link
              </a>
            )}
            <button
              onClick={() => onRegister(ev)}
              disabled={isFull}
              className={`flex-1 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all ${isRegistered ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 border border-rose-500/20' : isFull ? 'bg-neutral-100 dark:bg-white/5 text-slate-400 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white'}`}
            >
              {isRegistered ? '✓ Registered — Click to cancel' : isFull ? 'Event Full' : '🎟 Register for this Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
