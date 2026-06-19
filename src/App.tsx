import React, { useState, useEffect } from 'react';
import { UserProfile, Post, Community, Connection, DirectMessage, UserReport, Comment, Story } from './types';
import {
  INITIAL_COMMUNITIES,
  INITIAL_USERS,
  INITIAL_POSTS,
  INITIAL_CONNECTIONS,
  INITIAL_MESSAGES,
  MOCK_REPORTS,
  INITIAL_STORIES
} from './data/mockData';
import { ALL_PREDEFINED_CHAPTERS } from './data/chaptersData';

// Modular layouts
import AuthSection from './components/AuthSection';
import DashboardSection from './components/DashboardSection';
import DiscoverySection from './components/DiscoverySection';
import FeedSection from './components/FeedSection';
import MessagingSection from './components/MessagingSection';
import CommunitiesSection from './components/CommunitiesSection';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';
import Avatar from './components/Avatar';

// Lucide icons
import {
  GraduationCap,
  LayoutDashboard,
  Search,
  BookOpen,
  MessageSquare,
  Users,
  Settings,
  ShieldAlert,
  LogOut,
  Palette,
  Sparkles,
  RefreshCw,
  Eye,
  Plus,
  X,
  Image as ImageIcon,
  Send,
  Sparkle,
  ShieldCheck,
  Heart,
  Check
} from 'lucide-react';

type ThemeName = 'light' | 'dark' | 'ocean' | 'forest' | 'sunset' | 'midnight';

const THEMES: Record<ThemeName, { label: string; swatch: string; ring: string; isDark: boolean }> = {
  light:    { label: 'Light',    swatch: '#E8E8EC', ring: '#94a3b8', isDark: false },
  dark:     { label: 'Dark',     swatch: '#09090C', ring: '#475569', isDark: true  },
  ocean:    { label: 'Ocean',    swatch: '#06172A', ring: '#38BDF8', isDark: true  },
  forest:   { label: 'Forest',   swatch: '#061A0B', ring: '#34D399', isDark: true  },
  sunset:   { label: 'Sunset',   swatch: '#FDF6EE', ring: '#F97316', isDark: false },
  midnight: { label: 'Midnight', swatch: '#0E0720', ring: '#A855F7', isDark: true  },
};

const STOCK_PRESETS = [
  { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', label: 'Collab 🤝' },
  { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', label: 'Tech Space 💻' },
  { url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=400&q=80', label: 'Coffee Vibe ☕' },
  { url: 'https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=400&q=80', label: 'Relax / Chill 🌿' }
];

const ACTIVE_ACADEMIC_TAGS = [
  'Startup Pitch 🚀',
  'Co-Founder Search 🤝',
  'Study Partner Wanted 📚',
  'Idea Drop 💡',
  'Research Collaborator 🔬',
  'Hackathon Squad 💻',
  'Mentor Match 🎓',
  'Startup Discussion 💬'
];

const ACTIVE_FEELING_PRESETS = [
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

export default function App() {
  // App states with LocalStorage persistence wrapper for durable testing
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('network_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('network_all_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [posts, setPosts] = useState<Post[]>(() => {
    const saved = localStorage.getItem('network_posts');
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  });

  const [connections, setConnections] = useState<Connection[]>(() => {
    const saved = localStorage.getItem('network_connections');
    return saved ? JSON.parse(saved) : INITIAL_CONNECTIONS;
  });

  const [messages, setMessages] = useState<DirectMessage[]>(() => {
    const saved = localStorage.getItem('network_messages');
    return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
  });

  const [communities, setCommunities] = useState<Community[]>(() => {
    const saved = localStorage.getItem('network_communities_v3');
    return saved ? JSON.parse(saved) : ALL_PREDEFINED_CHAPTERS;
  });

  const [reports, setReports] = useState<UserReport[]>(() => {
    const saved = localStorage.getItem('network_reports');
    return saved ? JSON.parse(saved) : MOCK_REPORTS;
  });

  const [stories, setStories] = useState<Story[]>(() => {
    const saved = localStorage.getItem('network_stories');
    return saved ? JSON.parse(saved) : INITIAL_STORIES;
  });

  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('network_theme') as ThemeName;
    if (saved && THEMES[saved]) return saved;
    const oldDark = localStorage.getItem('network_dark_mode');
    return oldDark === 'true' ? 'dark' : 'light';
  });
  const darkMode = THEMES[theme].isDark;

  const [activeView, setActiveView] = useState<string>('feed');
  const [showDemoPortal, setShowDemoPortal] = useState<boolean>(false);
  const [showNewPostModal, setShowNewPostModal] = useState<boolean>(false);
  const [viewingUserProfileId, setViewingUserProfileId] = useState<string | null>(null);
  const [preSelectedMsgUserId, setPreSelectedMsgUserId] = useState<string | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'card' | 'shares'>('card');
  const [profileInterestsExpanded, setProfileInterestsExpanded] = useState<boolean>(false);
  const [profileLookingForExpanded, setProfileLookingForExpanded] = useState<boolean>(false);

  useEffect(() => {
    setProfileInterestsExpanded(false);
    setProfileLookingForExpanded(false);
  }, [viewingUserProfileId]);

  // New Post Modal Fields State
  const [modalPostContent, setModalPostContent] = useState('');
  const [modalSelectedTag, setModalSelectedTag] = useState('Startup Pitch 🚀');
  const [modalSelectedFeeling, setModalSelectedFeeling] = useState('');
  const [modalSelectedCommunity, setModalSelectedCommunity] = useState('');
  const [modalProjectTitle, setModalProjectTitle] = useState('');
  const [modalPostImage, setModalPostImage] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState<string[]>(() => {
    const saved = localStorage.getItem('network_registered_events');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('network_registered_events', JSON.stringify(registeredEvents));
  }, [registeredEvents]);

  const handleRegisterEvent = (eventId: string) => {
    if (!registeredEvents.includes(eventId)) {
      setRegisteredEvents(prev => [...prev, eventId]);
    }
  };

  // Sync to state storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('network_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('network_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('network_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('network_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('network_connections', JSON.stringify(connections));
  }, [connections]);

  useEffect(() => {
    localStorage.setItem('network_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('network_communities_v3', JSON.stringify(communities));
  }, [communities]);

  useEffect(() => {
    localStorage.setItem('network_reports', JSON.stringify(reports));
  }, [reports]);

  useEffect(() => {
    localStorage.setItem('network_stories', JSON.stringify(stories));
  }, [stories]);

  useEffect(() => {
    localStorage.setItem('network_theme', theme);
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-midnight', 'dark');
    html.classList.add(`theme-${theme}`);
    if (THEMES[theme].isDark) html.classList.add('dark');
  }, [theme]);

  // Auth Operations
  const handleLogin = (user: UserProfile) => {
    // If the logging student is suspended, reject entry
    if (user.isSuspended) {
      alert('Your student credentials have been suspended for violating academic policies. Please contact faculty council.');
      return;
    }
    setCurrentUser(user);
    setActiveView('feed');
    const updatedUsers = allUsers.map(u => u.id === user.id ? { ...u, isVerified: true } : u);
    // Add user to general pool if missing
    if (!allUsers.some(u => u.id === user.id)) {
      setAllUsers([...updatedUsers, user]);
    } else {
      setAllUsers(updatedUsers);
    }
  };

  const handleRegister = (newUser: UserProfile) => {
    setAllUsers(prev => {
      if (prev.some(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        return prev;
      }
      return [...prev, newUser];
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveView('dashboard');
  };

  // Switch Profiles auxiliary helper for quick evaluator demonstration
  const handleSwapAccount = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target && !target.isSuspended) {
      setCurrentUser(target);
      setActiveView('feed');
    }
  };

  // User Profile configuration
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
    setCurrentUser(updatedProfile);
    setAllUsers(prev => prev.map(u => u.id === updatedProfile.id ? updatedProfile : u));
  };

  // Connection System operations
  const handleSendConnectionRequest = (
    receiverId: string,
    type: 'Startup Discussion' | 'Friendship' | 'Study Partner' | 'Hackathon Team',
    message: string
  ) => {
    if (!currentUser) return;
    const newRequest: Connection = {
      id: `conn-${Date.now()}`,
      senderId: currentUser.id,
      receiverId,
      type,
      message,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setConnections(prev => [...prev, newRequest]);
  };

  const handleAcceptConnection = (requestId: string) => {
    setConnections(prev => prev.map(c => c.id === requestId ? { ...c, status: 'accepted' } : c));
  };

  const handleRejectConnection = (requestId: string) => {
    setConnections(prev => prev.map(c => c.id === requestId ? { ...c, status: 'rejected' } : c));
  };

  // Group hubs association
  const handleJoinCommunity = (communityId: string) => {
    if (!currentUser) return;
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId && !c.memberIds.includes(currentUser.id)) {
        return { ...c, memberIds: [...c.memberIds, currentUser.id] };
      }
      return c;
    }));
  };

  const handleLeaveCommunity = (communityId: string) => {
    if (!currentUser) return;
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        return { ...c, memberIds: c.memberIds.filter(id => id !== currentUser.id) };
      }
      return c;
    }));
  };

  const handleCreateCommunity = (community: { name: string; description: string; icon: string; tags: string[]; category: string }) => {
    if (!currentUser) return;
    const newCommunity = {
      ...community,
      id: `custom-${Date.now()}`,
      memberIds: [currentUser.id],
      threads: [],
      resources: [],
    };
    setCommunities(prev => [newCommunity, ...prev]);
  };

  const handleAddCommunityResource = (communityId: string, title: string, link: string, description: string) => {
    if (!currentUser) return;
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const newResource = {
          id: `res-${Date.now()}`,
          title,
          link,
          description,
          authorId: currentUser.id,
          createdAt: new Date().toISOString()
        };
        return {
          ...c,
          resources: [...(c.resources || []), newResource]
        };
      }
      return c;
    }));
  };

  const handleAddCommunityThread = (communityId: string, title: string, content: string) => {
    if (!currentUser) return;
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        const newThread = {
          id: `thread-${Date.now()}`,
          title,
          content,
          authorId: currentUser.id,
          createdAt: new Date().toISOString(),
          replies: []
        };
        return {
          ...c,
          threads: [...(c.threads || []), newThread]
        };
      }
      return c;
    }));
  };

  const handleAddThreadReply = (communityId: string, threadId: string, content: string) => {
    if (!currentUser) return;
    setCommunities(prev => prev.map(c => {
      if (c.id === communityId) {
        return {
          ...c,
          threads: (c.threads || []).map(t => {
            if (t.id === threadId) {
              const newReply = {
                id: `rep-${Date.now()}`,
                authorId: currentUser.id,
                content,
                createdAt: new Date().toISOString()
              };
              return {
                ...t,
                replies: [...t.replies, newReply]
              };
            }
            return t;
          })
        };
      }
      return c;
    }));
  };

  // Post Activity interactions
  const handleAddPost = (
    content: string,
    academicTag: string,
    communityId?: string,
    projectTitle?: string,
    postImage?: string,
    feeling?: string
  ) => {
    if (!currentUser) return;
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id,
      content,
      likes: [],
      comments: [],
      communityId,
      academicTag,
      projectTitle,
      postImage,
      feeling,
      createdAt: new Date().toISOString()
    };
    setPosts(prev => [newPost, ...prev]);
  };

  const handleModalPostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!modalPostContent.trim()) return;

    handleAddPost(
      modalPostContent,
      modalSelectedTag,
      modalSelectedCommunity || undefined,
      modalProjectTitle || undefined,
      modalPostImage || undefined,
      modalSelectedFeeling || undefined
    );

    // Reset standard states
    setModalPostContent('');
    setModalSelectedTag('Startup Pitch 🚀');
    setModalSelectedFeeling('');
    setModalSelectedCommunity('');
    setModalProjectTitle('');
    setModalPostImage('');
    setShowNewPostModal(false);
  };

  const handleModalImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStory = (content: string, image?: string) => {
    if (!currentUser) return;
    const newStory: Story = {
      id: `story-${Date.now()}`,
      authorId: currentUser.id,
      image,
      content,
      createdAt: new Date().toISOString(),
      viewedBy: []
    };
    setStories(prev => [newStory, ...prev]);
  };

  const handleReactToStory = (storyId: string, emoji: string) => {
    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        const currentReactions = s.reactions || {};
        return {
          ...s,
          reactions: {
            ...currentReactions,
            [emoji]: (currentReactions[emoji] || 0) + 1
          }
        };
      }
      return s;
    }));
  };

  const handleLikePost = (postId: string) => {
    if (!currentUser) return;
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const hasLiked = p.likes.includes(currentUser.id);
        const updatedLikes = hasLiked
          ? p.likes.filter(id => id !== currentUser.id)
          : [...p.likes, currentUser.id];
        return { ...p, likes: updatedLikes };
      }
      return p;
    }));
  };

  const handleAddComment = (postId: string, content: string) => {
    if (!currentUser) return;
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      postId,
      authorId: currentUser.id,
      content,
      createdAt: new Date().toISOString()
    };
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, comments: [...p.comments, newComment] };
      }
      return p;
    }));
  };

  // Direct conversations
  const handleSendMessage = (receiverId: string, content: string) => {
    if (!currentUser) return;
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId,
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Real-time reply simulation wrapper triggered from Messaging component
  const handleSimulateReply = (partnerId: string, content: string) => {
    if (!currentUser) return;
    const newMsg: DirectMessage = {
      id: `msg-${Date.now()}`,
      senderId: partnerId,
      receiverId: currentUser.id,
      content,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Safety & Admin operations
  const handleReportUser = (reportedUserId: string, reason: string, description: string) => {
    if (!currentUser) return;
    const newReport: UserReport = {
      id: `rep-${Date.now()}`,
      reporterId: currentUser.id,
      reportedUserId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    setReports(prev => [newReport, ...prev]);
  };

  const handleToggleUserSuspension = (userId: string) => {
    setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: !u.isSuspended } : u));
    // If we suspend the user we are currently acting as, log out
    if (currentUser?.id === userId) {
      alert('This profile is under suspension. Logging you out...');
      handleLogout();
    }
  };

  const handleResolveReport = (reportId: string, status: 'suspended' | 'dismissed') => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  const handleDeletePost = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const clearSandboxStorage = () => {
    localStorage.clear();
    setAllUsers(INITIAL_USERS);
    setPosts(INITIAL_POSTS);
    setConnections(INITIAL_CONNECTIONS);
    setMessages(INITIAL_MESSAGES);
    setCommunities(ALL_PREDEFINED_CHAPTERS);
    setStories(INITIAL_STORIES);
    setReports(MOCK_REPORTS);
    alert('Academic ledger reset successfully to campus seed defaults!');
  };

  // Auth interceptor helper
  if (!currentUser) {
    return (
      <AuthSection
        onLogin={handleLogin}
        onRegister={handleRegister}
        allUsers={allUsers}
        darkMode={darkMode}
      />
    );
  }

  // Active Direct message unread count for sidebar indicator badge
  const totalUnreadMessages = messages.filter(
    m => m.receiverId === currentUser.id && !m.isRead
  ).length;

  return (
    <div className={`min-h-screen w-full overflow-x-hidden flex flex-col font-sans transition-all duration-300 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`} style={{ backgroundColor: 'var(--t-bg)' }}>
      
      {/* Main Top Header Block of Editorial Mockup */}
      <header className="border-b border-neutral-200 dark:border-white/10 px-6 lg:px-8 py-3.5 flex items-center justify-between transition-all sticky top-0 z-30 backdrop-blur-md" style={{ backgroundColor: 'var(--t-header)' }}>
        <div className="flex items-center space-x-4 lg:space-x-8">
          <h1 className="text-xl lg:text-2xl font-serif italic font-black tracking-tight uppercase select-none bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            The Network
          </h1>
          <div className="hidden lg:flex items-center gap-1.5 text-[10px] font-mono tracking-widest opacity-50 uppercase">
            <span>// Campus Co-founder Hub</span>
            <span>•</span>
            <span>Est. 2026</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Quick theme & logout actions displayed inside header on mobile/tablet viewports */}
          <button
            onClick={() => {
              const keys = Object.keys(THEMES) as ThemeName[];
              setTheme(keys[(keys.indexOf(theme) + 1) % keys.length]);
            }}
            className="md:hidden p-2 rounded-full border border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/5 transition-all cursor-pointer text-slate-800 dark:text-slate-100"
            title={`Theme: ${THEMES[theme].label}`}
          >
            <Palette size={14} />
          </button>
          
          <button
            onClick={handleLogout}
            className="md:hidden p-2 rounded-full border border-rose-500/10 text-rose-500 hover:bg-rose-500/10 transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>

          <div className="hidden sm:flex bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 text-[11px] font-mono items-center font-bold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
            Verified Accs Only
          </div>

          {/* Persistent Premium Header Post Creator Button */}
          {!currentUser.isSuspended && (
            <button
              id="header-post-trigger"
              onClick={() => setShowNewPostModal(true)}
              className="relative overflow-hidden group py-1.5 px-3 sm:px-4 rounded-full bg-gradient-to-r from-indigo-505 via-indigo-600 to-pink-500 hover:from-pink-500 hover:to-indigo-600 font-extrabold text-[11px] uppercase tracking-wider text-white shadow-sm hover:shadow-indigo-500/15 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border-0"
              title="Share an update, dispatch, or vibe"
            >
              <Plus size={13} strokeWidth={2.5} />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}
          
          <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-white dark:border-[#09090C] overflow-hidden ${darkMode ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
              <Avatar avatar={currentUser.avatar} />
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-5xl w-full mx-auto flex flex-col md:flex-row gap-6 p-4">
        
        {/* Navigation Sidebar Panel */}
        <aside className="w-full md:w-60 shrink-0 space-y-4">
          <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm transition-all" style={{ backgroundColor: 'var(--t-card)' }}>
            <div className="hidden md:flex items-center gap-2 mb-4 pb-2 border-b border-neutral-100 dark:border-white/10">
              <span className="p-1 text-white bg-indigo-500 rounded-lg">
                <GraduationCap size={14} />
              </span>
              <span className="font-sans font-bold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Sections
              </span>
            </div>

            <nav className="flex md:flex-col gap-1 md:space-y-0.5 overflow-x-auto md:overflow-visible no-scrollbar pb-1 md:pb-0 text-xs">
              <button
                id="view-feed-tab"
                onClick={() => setActiveView('feed')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'feed' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <BookOpen size={14} />
                <span>Home Feed</span>
              </button>

              <button
                id="view-dashboard-tab"
                onClick={() => setActiveView('dashboard')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'dashboard' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </button>

              <button
                id="view-explore-tab"
                onClick={() => setActiveView('explore')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'explore' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <Search size={14} />
                <span>Discovery</span>
              </button>

              <button
                id="view-messages-tab"
                onClick={() => setActiveView('messages')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center justify-between font-semibold transition-all cursor-pointer border ${activeView === 'messages' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare size={14} />
                  <span>College Chats</span>
                </div>
                {totalUnreadMessages > 0 && (
                  <span className="py-0.5 px-2 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                    {totalUnreadMessages}
                  </span>
                )}
              </button>

              <button
                id="view-communities-tab"
                onClick={() => setActiveView('communities')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'communities' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <Users size={14} />
                <span>Chapters</span>
              </button>

              <button
                id="view-profile-tab"
                onClick={() => setActiveView('profile')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'profile' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <Settings size={14} />
                <span>My Profile</span>
              </button>

              {currentUser.role === 'admin' && (
                <button
                  id="view-admin-tab"
                  onClick={() => setActiveView('admin')}
                  className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'admin' ? 'bg-rose-600 text-white border-transparent shadow-sm' : 'text-rose-600 border-transparent hover:bg-rose-500/10'}`}
                >
                  <ShieldAlert size={14} />
                  <span>Admin Center</span>
                </button>
              )}
            </nav>

            <div className="hidden md:block mt-6 pt-4 border-t border-neutral-150 dark:border-white/10 space-y-3">
              {/* Theme Picker */}
              <div className="px-1">
                <div className="flex items-center gap-2 mb-2.5">
                  <Palette size={12} className="text-slate-400" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Theme</span>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {(Object.entries(THEMES) as [ThemeName, typeof THEMES[ThemeName]][]).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => setTheme(key)}
                      title={t.label}
                      className="relative w-7 h-7 rounded-full transition-all cursor-pointer border-2 hover:scale-110 active:scale-95"
                      style={{
                        backgroundColor: t.swatch,
                        borderColor: theme === key ? t.ring : 'transparent',
                        boxShadow: theme === key ? `0 0 0 1px ${t.ring}40` : undefined,
                      }}
                    >
                      {theme === key && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.ring }} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[9px] font-mono text-slate-400 dark:text-slate-600 pl-0.5">{THEMES[theme].label}</p>
              </div>

              <button
                id="btn-logout"
                onClick={handleLogout}
                className="w-full py-2 px-3 rounded-xl flex items-center gap-3 text-xs font-semibold cursor-pointer text-rose-500 hover:bg-rose-500/10 transition-all text-left"
              >
                <LogOut size={13} />
                <span>Log Out</span>
              </button>
            </div>
          </div>

          {/* Profile Quick Summary Footer card */}
          <div className="hidden md:flex p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm text-left items-center gap-3" style={{ backgroundColor: 'var(--t-card)' }}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 shrink-0 overflow-hidden`}>
              <Avatar avatar={currentUser.avatar} />
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-extrabold truncate leading-none uppercase tracking-wide">{currentUser.fullName}</p>
              <p className={`text-[10px] truncate mt-1 opacity-70 font-mono`}>{currentUser.college}</p>
            </div>
          </div>
        </aside>

        {/* Dynamic Workspace Container */}
        <main className="flex-1 min-w-0 space-y-6">
          {activeView === 'dashboard' && (
            <DashboardSection
              currentUser={currentUser}
              connections={connections}
              posts={posts}
              communities={communities}
              messages={messages}
              allUsers={allUsers}
              onNavigate={setActiveView}
              darkMode={darkMode}
              stories={stories}
              onAddStory={handleAddStory}
              registeredEvents={registeredEvents}
              onRegisterEvent={handleRegisterEvent}
              onReactToStory={handleReactToStory}
            />
          )}

          {activeView === 'explore' && (
            <DiscoverySection
              currentUser={currentUser}
              allUsers={allUsers}
              connections={connections}
              onSendConnectionRequest={handleSendConnectionRequest}
              onAcceptConnection={handleAcceptConnection}
              onRejectConnection={handleRejectConnection}
              onReportUser={handleReportUser}
              darkMode={darkMode}
            />
          )}

          {activeView === 'feed' && (
            <FeedSection
              currentUser={currentUser}
              posts={posts}
              allUsers={allUsers}
              communities={communities}
              onAddPost={handleAddPost}
              onLikePost={handleLikePost}
              onAddComment={handleAddComment}
              darkMode={darkMode}
              stories={stories}
              onAddStory={handleAddStory}
              registeredEvents={registeredEvents}
              onRegisterEvent={handleRegisterEvent}
              onViewUserProfile={setViewingUserProfileId}
              onReactToStory={handleReactToStory}
            />
          )}

          {activeView === 'messages' && (
            <MessagingSection
              currentUser={currentUser}
              connections={connections}
              allUsers={allUsers}
              messages={messages}
              onSendMessage={handleSendMessage}
              onSimulateReply={handleSimulateReply}
              darkMode={darkMode}
              preSelectedUserId={preSelectedMsgUserId || undefined}
              onViewUserProfile={setViewingUserProfileId}
            />
          )}

          {activeView === 'communities' && (
            <CommunitiesSection
              currentUser={currentUser}
              communities={communities}
              posts={posts}
              allUsers={allUsers}
              onJoinCommunity={handleJoinCommunity}
              onLeaveCommunity={handleLeaveCommunity}
              onAddPost={handleAddPost}
              onLikePost={handleLikePost}
              onAddComment={handleAddComment}
              onDeletePost={handleDeletePost}
              darkMode={darkMode}
              onViewUserProfile={setViewingUserProfileId}
              onAddResource={handleAddCommunityResource}
              onAddThread={handleAddCommunityThread}
              onAddThreadReply={handleAddThreadReply}
              onCreateCommunity={handleCreateCommunity}
            />
          )}

          {activeView === 'profile' && (
            <ProfileSection
              currentUser={currentUser}
              onUpdateProfile={handleUpdateProfile}
              darkMode={darkMode}
            />
          )}

          {activeView === 'admin' && (
            <AdminSection
              currentUser={currentUser}
              allUsers={allUsers}
              reports={reports}
              posts={posts}
              communities={communities}
              onToggleUserSuspension={handleToggleUserSuspension}
              onResolveReport={handleResolveReport}
              onDeletePost={handleDeletePost}
              darkMode={darkMode}
            />
          )}
        </main>

      </div>

      {/* Floating Demo Portal Switcher (Hidden from header, available quietly in bottom-right) */}
      <div className="fixed bottom-5 right-5 z-50 font-sans text-left">
        {showDemoPortal && (
          <div className={`p-4 rounded-xl border mb-3 w-64 shadow-xl transition-all duration-200 text-xs ${darkMode ? 'bg-[#121217] border-white/10 text-[#F9F7F2]' : 'bg-white border-neutral-200 text-[#1A1A1A]'}`}>
            <div className="flex items-center justify-between border-b pb-2 mb-2 border-neutral-200/80 dark:border-white/10">
              <span className="font-extrabold uppercase tracking-wider text-[9px] text-slate-400 flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-400 animate-pulse" /> Sandbox Hub
              </span>
              <span className="text-[8px] font-mono opacity-50">v1.2</span>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wide">Select test account:</p>
              <button
                id="btn-switch-chloe"
                onClick={() => {
                  handleSwapAccount('user-2');
                  setShowDemoPortal(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg text-left font-semibold transition-all flex items-center justify-between ${currentUser.id === 'user-2' ? 'bg-indigo-505 text-indigo-500 bg-indigo-500/10' : 'hover:bg-neutral-100 dark:hover:bg-white/5 opacity-80 hover:opacity-100'}`}
              >
                <span>Chloe (MIT CS)</span>
                {currentUser.id === 'user-2' && <span className="text-[12px] text-indigo-500">●</span>}
              </button>
              <button
                id="btn-switch-aravind"
                onClick={() => {
                  handleSwapAccount('user-1');
                  setShowDemoPortal(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg text-left font-semibold transition-all flex items-center justify-between ${currentUser.id === 'user-1' ? 'bg-indigo-505 text-indigo-500 bg-indigo-500/10' : 'hover:bg-neutral-100 dark:hover:bg-white/5 opacity-80 hover:opacity-100'}`}
              >
                <span>Aravind (IIT CS)</span>
                {currentUser.id === 'user-1' && <span className="text-[12px] text-indigo-500">●</span>}
              </button>
              <button
                id="btn-switch-sarah"
                onClick={() => {
                  handleSwapAccount('admin-1');
                  setShowDemoPortal(false);
                }}
                className={`w-full py-1.5 px-2.5 rounded-lg text-left font-semibold transition-all flex items-center justify-between ${currentUser.id === 'admin-1' ? 'bg-rose-505 text-rose-500 bg-rose-500/10' : 'hover:bg-neutral-100 dark:hover:bg-white/5 text-rose-500 opacity-80 hover:opacity-100'}`}
              >
                <span>Prof. Sarah (Admin)</span>
                {currentUser.id === 'admin-1' && <span className="text-[12px] text-rose-500">●</span>}
              </button>
            </div>
            
            <div className="border-t border-dashed mt-3 pt-2.5 border-neutral-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-[8px] text-slate-400 font-mono">Ledger Database:</span>
              <button
                id="btn-clear-ledger"
                onClick={() => {
                  clearSandboxStorage();
                  setShowDemoPortal(false);
                }}
                className="py-1 px-2.5 rounded bg-neutral-900 text-white dark:bg-white dark:text-zinc-950 font-bold uppercase text-[9px] hover:opacity-90 transition-all font-mono"
              >
                Reset Default
              </button>
            </div>
          </div>
        )}
        <button
          id="btn-toggle-demo-portal"
          onClick={() => setShowDemoPortal(!showDemoPortal)}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-full shadow-lg border text-xs font-bold transition-all hover:scale-[1.03] active:scale-[0.97] cursor-pointer ${showDemoPortal ? 'bg-indigo-500 border-transparent text-white' : (darkMode ? 'bg-[#121217] border-white/10 text-[#F9F7F2] hover:bg-[#1b1b22]' : 'bg-white border-neutral-250 text-[#1A1A1A] hover:bg-[#F4F4F6]')}`}
        >
          <Sparkles size={13} className={showDemoPortal ? 'animate-none' : 'animate-pulse text-indigo-500'} />
          <span>Demo Hub</span>
        </button>
      </div>

      {/* Premium Instagram-Style Share Overlay Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-fade-in font-sans">
          <div className={`relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/90 dark:border-white/10 flex flex-col md:flex-row max-h-[90vh] md:h-[620px] transition-all duration-300 ${darkMode ? 'bg-[#0E0E12] text-[#F9F7F2]' : 'bg-white text-slate-900'}`}>
            
            {/* Left Box: Creative Instagram-Style Live Preview */}
            <div className="w-full md:w-5/12 bg-neutral-950 text-white flex flex-col justify-between p-5 relative border-b md:border-b-0 md:border-r border-neutral-200/10 shrink-0">
              <div className="absolute inset-0 bg-radial-gradient opacity-15 pointer-events-none"></div>
              
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b border-white/10 mb-4">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-400 flex items-center gap-1.5">
                    <Sparkle size={11} className="animate-spin-slow text-pink-500" />
                    <span>Instant Live Preview</span>
                  </span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  </div>
                </div>

                {/* Profile row */}
                <div className="flex items-center gap-2.5">
                  <div className="p-[1.5px] rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-[#0E0E12] border border-white/10 overflow-hidden animate-none">
                      <Avatar avatar={currentUser.avatar} />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-black tracking-wide flex items-center gap-1">
                      <span className="truncate">{currentUser.fullName}</span>
                      {modalSelectedFeeling && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 text-[8.5px] font-bold shrink-0">
                          is feeling {modalSelectedFeeling}
                        </span>
                      )}
                    </div>
                    <div className="text-[8px] opacity-50 font-mono">
                      {currentUser.college} • {modalSelectedTag}
                    </div>
                  </div>
                </div>

                {/* Optional Project Showcase Ribbon */}
                {modalProjectTitle && (
                  <div className="mt-3 bg-gradient-to-r from-indigo-500/10 via-pink-500/10 to-indigo-500/10 border border-indigo-500/30 rounded-lg p-2">
                    <div className="text-[7.5px] font-mono uppercase text-indigo-400 font-extrabold tracking-widest">🚀 Project showcase</div>
                    <div className="text-[10px] font-extrabold text-white truncate">{modalProjectTitle}</div>
                  </div>
                )}

                {/* Body Content preview */}
                <p className="mt-3.5 text-[11px] font-sans leading-relaxed text-neutral-350 max-h-24 overflow-y-auto no-scrollbar break-words italic">
                  "{modalPostContent || 'Type something beautiful to preview your update in real-time on the campus timeline...'}"
                </p>
              </div>

              {/* Attached Image Frame preview */}
              <div className="mt-4 flex-1 min-h-[120px] md:min-h-0 bg-[#060608] rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center relative">
                {modalPostImage ? (
                  <>
                    <img
                      src={modalPostImage}
                      alt="Preview upload"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <button
                      type="button"
                      onClick={() => setModalPostImage('')}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all border-0 cursor-pointer"
                      title="Remove image"
                    >
                      <X size={10} />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="mx-auto text-neutral-600 mb-2" size={24} strokeWidth={1.5} />
                    <span className="text-[9px] text-neutral-500 block uppercase tracking-wide">No Media Attached</span>
                    <span className="text-[8px] text-neutral-600 block">Unsplash stock presets or uploads appear here</span>
                  </div>
                )}
              </div>

              <div className="pt-3 text-[8.2px] font-mono text-zinc-500 flex items-center justify-between">
                <span>POST PREVIEW — LIVE HUB</span>
                <span>JUST NOW</span>
              </div>
            </div>

            {/* Right Box: Form Section */}
            <form onSubmit={handleModalPostSubmit} className="flex-1 p-6 flex flex-col justify-between overflow-y-auto min-h-0">
              
              {/* Header / Dismiss */}
              <div className="flex items-center justify-between pb-3.5 border-b border-neutral-200/80 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-500 dark:text-indigo-400">
                    <Sparkles size={14} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider">Launch a Pitch / Find a Collaborator</h3>
                    <p className="text-[9.5px] text-slate-400 dark:text-zinc-500">Reach co-founders, study partners & mentors instantly</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewPostModal(false)}
                  className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all text-slate-450 hover:text-slate-605 dark:hover:text-white border-0 cursor-pointer bg-transparent"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Fields */}
              <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar text-xs">
                
                {/* Content Input Box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500">What are you building or looking for? <span className="text-rose-500">*</span></label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Pitch your startup idea, describe the co-founder you need, post a study group request, or share a research opportunity..."
                    value={modalPostContent}
                    onChange={(e) => setModalPostContent(e.target.value)}
                    className={`w-full p-3 rounded-xl border focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none transition-all text-xs ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                  />
                </div>

                {/* Vibe Feeling Ticker Status */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500 block">Current builder status — what mode are you in?</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ACTIVE_FEELING_PRESETS.map((preset) => {
                      const feelingString = `${preset.emoji} ${preset.label}`;
                      const isSelected = modalSelectedFeeling === feelingString;
                      return (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setModalSelectedFeeling(isSelected ? '' : feelingString)}
                          className={`px-2.5 py-1 rounded-xl text-[10.5px] border cursor-pointer transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-500 to-pink-550 border-transparent text-white font-black scale-[1.03] shadow-xs'
                              : darkMode
                              ? 'bg-[#09090C] border-white/5 text-[#F9F7F2] hover:bg-neutral-800'
                              : 'bg-slate-50 border-neutral-200 text-slate-800 hover:bg-slate-100'
                          }`}
                        >
                          <span>{preset.emoji}</span>
                          <span className="text-[9.5px]">{preset.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2-Column Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Category Tag */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500">Academic / Lifestyle Category</label>
                    <select
                      value={modalSelectedTag}
                      onChange={(e) => setModalSelectedTag(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-indigo-500 text-xs focus:outline-none cursor-pointer transition-all ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                    >
                      {ACTIVE_ACADEMIC_TAGS.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>

                  {/* Post to Community Direct Filter */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500">Post directly to Community</label>
                    <select
                      value={modalSelectedCommunity}
                      onChange={(e) => setModalSelectedCommunity(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-indigo-500 text-xs focus:outline-none cursor-pointer transition-all ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                    >
                      <option value="">General Feed Ticker</option>
                      {communities.map(comm => (
                        <option key={comm.id} value={comm.id}>{comm.name} ({comm.type})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Optional Startup Showcase Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500">Startup Showcase / Pitch Project Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. EcoDrone Autonomous Pitch Seed, placement guide kit..."
                    value={modalProjectTitle}
                    onChange={(e) => setModalProjectTitle(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-indigo-500 text-xs focus:outline-none transition-all ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                  />
                </div>

                {/* Media Attachment Row */}
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500 block">Attach Image Story / Startup Blueprint Photo</label>
                  
                  {/* Option A: Unsplash stock presets */}
                  <div className="space-y-1">
                    <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 block">Pick an aesthetic stock theme:</span>
                    <div className="flex gap-2">
                      {STOCK_PRESETS.map((stock) => (
                        <button
                          key={stock.label}
                          type="button"
                          onClick={() => setModalPostImage(stock.url)}
                          className={`relative w-14 h-10 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${modalPostImage === stock.url ? 'border-indigo-500 scale-[1.04]' : 'border-neutral-250 dark:border-zinc-800 opacity-60 hover:opacity-100'}`}
                        >
                          <img src={stock.url} alt={stock.label} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute inset-x-0 bottom-0 bg-black/65 text-[7px] text-white text-center truncate py-0.2 font-mono">{stock.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Option B: Direct URL / File Upload */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div>
                      <input
                        type="text"
                        placeholder="Or paste custom image URL..."
                        value={modalPostImage.startsWith('data:') ? '' : modalPostImage}
                        onChange={(e) => setModalPostImage(e.target.value)}
                        className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-indigo-500 text-xs focus:outline-none transition-all ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                      />
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        id="modal-image-file-input"
                        onChange={handleModalImageUpload}
                        className="hidden"
                      />
                      <label
                        htmlFor="modal-image-file-input"
                        className={`w-full p-2.5 rounded-xl border border-dashed text-center block text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-neutral-150 dark:hover:bg-zinc-850 ${darkMode ? 'border-zinc-800 text-[#F9F7F2]' : 'border-neutral-300 text-slate-700'}`}
                      >
                        Upload Custom Photo
                      </label>
                    </div>
                  </div>
                </div>

              </div>

              {/* Submit / Action button row */}
              <div className="pt-4 border-t border-neutral-200/80 dark:border-white/10 flex items-center justify-end gap-3 pointer-events-auto">
                <button
                  type="button"
                  id="btn-close-composer"
                  onClick={() => setShowNewPostModal(false)}
                  className={`px-4 py-2 rounded-full font-bold uppercase tracking-wider text-[10px] border-0 cursor-pointer transition-all ${darkMode ? 'bg-zinc-900 text-slate-300 hover:bg-zinc-805' : 'bg-neutral-100 text-slate-700 hover:bg-neutral-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-post-publish"
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-pink-500 hover:from-pink-505 hover:to-indigo-600 text-white font-extrabold uppercase tracking-wider text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm flex items-center gap-1.5 border-0 cursor-pointer"
                >
                  <Send size={11} />
                  <span>Share Update</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* CENTRALIZED PEER STUDENT CARD & TIMELINE PROFILE OVERLAY */}
      {viewingUserProfileId && (() => {
        const selectedUser = allUsers.find(u => u.id === viewingUserProfileId);
        if (!selectedUser) return null;

        // Collect all posts authored by this selected user
        const sharedPosts = posts.filter(p => p.authorId === selectedUser.id && !p.isSuspended);

        // Check relationship status: accepted, pending, etc.
        const currentRelations = connections.filter(
          c => (c.senderId === currentUser.id && c.receiverId === selectedUser.id) ||
               (c.senderId === selectedUser.id && c.receiverId === currentUser.id)
        );
        const activeRelation = currentRelations[0];

        // Calculate overlap tags: shared interests or skills
        const sharedInterests = selectedUser.interests.filter(tag => currentUser.interests.includes(tag));
        const sharedSkills = selectedUser.skills.filter(tag => currentUser.skills.includes(tag));
        const overlapCount = sharedInterests.length + sharedSkills.length;

        // Quick connect submit
        const handleQuickConnect = () => {
          handleSendConnectionRequest(selectedUser.id, 'Friendship', `Hi ${selectedUser.fullName}! I saw your card on the timeline and wanted to connect.`);
        };

        // Quick message action
        const handleStartChat = () => {
          setPreSelectedMsgUserId(selectedUser.id);
          setViewingUserProfileId(null); // Close modal
          setActiveView('messages'); // navigate
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs text-left overflow-hidden">
            <div className={`relative w-full max-w-2xl rounded-3xl border border-neutral-200/50 dark:border-white/10 shadow-2xl overflow-hidden transition-all flex flex-col h-[90vh] sm:h-[85vh] max-h-[90vh] min-h-0 ${
              darkMode ? 'bg-[#121217] text-slate-100' : 'bg-white text-slate-900'
            }`}>
              
              {/* Header Cover Bar with visual design */}
              <div className="h-28 shrink-0 bg-gradient-to-r from-indigo-505 via-indigo-600 to-pink-500 relative flex items-end p-4">
                <button
                  onClick={() => setViewingUserProfileId(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all cursor-pointer border-0"
                  title="Close Profile Explorer"
                >
                  <X size={16} />
                </button>
                <div className="absolute -bottom-8 left-6 p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shadow-lg animate-none">
                  <div className={`w-18 h-18 rounded-full border-4 border-white dark:border-[#121217] flex items-center justify-center font-black text-xl bg-[#1A1A1A] text-white overflow-hidden`}>
                    <Avatar avatar={selectedUser.avatar} />
                  </div>
                </div>
              </div>

              {/* Profile Bio Details */}
              <div className="pt-10 px-6 pb-4 shrink-0 border-b border-dashed border-neutral-150 dark:border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5 font-sans">
                      <span>{selectedUser.fullName}</span>
                      {selectedUser.isVerified && (
                        <span className="py-0.5 px-2 rounded bg-indigo-500/15 text-indigo-500 dark:bg-indigo-500/25 text-[9px] font-mono font-bold uppercase tracking-wide">
                          VERIFIED PEER
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-mono text-indigo-550 dark:text-indigo-400 mt-0.5">
                      {selectedUser.college} • {selectedUser.branch}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Academic Sector: Year {selectedUser.year} Student
                    </p>
                  </div>

                  {/* Connect and Quick Chat Action Buttons inside Card */}
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedUser.id !== currentUser.id && (
                      <>
                        {activeRelation ? (
                          <span className={`py-1.5 px-3.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            activeRelation.status === 'accepted' 
                              ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15' 
                              : 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15'
                          }`}>
                            {activeRelation.status === 'accepted' ? 'Match Verified' : 'Connection Pending'}
                          </span>
                        ) : (
                          <button
                            onClick={handleQuickConnect}
                            className="py-1.5 px-4 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase tracking-wider text-[10px] border-0 cursor-pointer transition-colors shadow-xs"
                          >
                            Send Connect Request
                          </button>
                        )}

                        <button
                          onClick={handleStartChat}
                          className="py-1.5 px-4 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold uppercase tracking-wider text-[10px] border-0 cursor-pointer transition-colors shadow-xs"
                        >
                          Message {selectedUser.fullName.split(' ')[0]}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Match overlap info chip */}
                {selectedUser.id !== currentUser.id && overlapCount > 0 && (
                  <div className="mt-3.5 inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-indigo-400/20 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={11} className="text-indigo-500" />
                    <span>Academic Overlap Index: Match on {overlapCount} shared dimension{overlapCount > 1 ? 's' : ''} ({[...sharedInterests, ...sharedSkills].join(', ')})</span>
                  </div>
                )}
              </div>

              {/* TABS BUTTONS BAR */}
              <div className="flex border-b border-neutral-100 dark:border-white/5 bg-slate-50/20 dark:bg-zinc-950/20 shrink-0">
                <button
                  type="button"
                  onClick={() => setProfileActiveTab('card')}
                  className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-0 cursor-pointer border-b-2 transition-all ${
                    profileActiveTab === 'card' 
                      ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Student Card Info 📑
                </button>
                <button
                  type="button"
                  onClick={() => setProfileActiveTab('shares')}
                  className={`flex-1 py-3 text-center text-xs font-bold uppercase tracking-wider border-0 cursor-pointer border-b-2 transition-all ${
                    profileActiveTab === 'shares' 
                      ? 'border-indigo-500 text-indigo-500 dark:text-indigo-400' 
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  What They Shared 📝 ({sharedPosts.length})
                </button>
              </div>

              {/* SCROLLABLE SCENE CONTENT */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 min-h-0">
                {profileActiveTab === 'card' ? (
                  <div className="space-y-5">
                    
                    {/* Bio */}
                    <div className="space-y-1.5">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Institutional Biography</h4>
                      <p className={`text-xs leading-relaxed p-4 rounded-2xl border border-neutral-100 dark:border-white/5 ${
                        darkMode ? 'bg-zinc-950/40 text-slate-300' : 'bg-slate-50/40 text-slate-700'
                      }`}>
                        {selectedUser.aboutMe || "No institutional biography recorded yet."}
                      </p>
                    </div>

                    {/* Interests Chips */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Target Tags & Core Focus</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.interests.length > 0 ? (
                          (profileInterestsExpanded ? selectedUser.interests : selectedUser.interests.slice(0, 3)).map(item => {
                            const isShared = currentUser.interests.includes(item) && selectedUser.id !== currentUser.id;
                            return (
                              <span 
                                key={item} 
                                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                                  isShared 
                                    ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border-indigo-500/30' 
                                    : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/10'
                                }`}
                              >
                                {item} {isShared && <Sparkles size={10} className="text-indigo-505 shrink-0" />}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">No academic interests cataloged.</span>
                        )}
                        {selectedUser.interests.length > 3 && (
                          <button
                            onClick={() => setProfileInterestsExpanded(!profileInterestsExpanded)}
                            className="px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer select-none"
                          >
                            {profileInterestsExpanded ? 'Show Less' : `+ ${selectedUser.interests.length - 3} More`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Skills Chips */}
                    <div className="space-y-2">
                       <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Hard Skills & Focus Fields</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.skills.length > 0 ? (
                          selectedUser.skills.map(item => {
                            const isShared = currentUser.skills.includes(item) && selectedUser.id !== currentUser.id;
                            return (
                              <span 
                                key={item} 
                                className={`px-3 py-1 rounded-lg text-xs font-medium border ${
                                  isShared 
                                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-350 border-rose-500/30 ring-1 ring-rose-500/10 flex items-center gap-1 font-bold' 
                                    : 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/10'
                                }`}
                              >
                                {item} {isShared && <Sparkles size={10} className="text-rose-500 shrink-0" />}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-xs text-slate-400 italic">No hard skills selected yet.</span>
                        )}
                      </div>
                    </div>

                    {/* Seeking Chips */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-400">Seeking Campus Alliances</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUser.lookingFor.length > 0 ? (
                          (profileLookingForExpanded ? selectedUser.lookingFor : selectedUser.lookingFor.slice(0, 3)).map(item => (
                            <span key={item} className="px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-medium border border-emerald-500/10">
                              {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No seeking tags established.</span>
                        )}
                        {selectedUser.lookingFor.length > 3 && (
                          <button
                            onClick={() => setProfileLookingForExpanded(!profileLookingForExpanded)}
                            className="px-3 py-1 rounded-lg text-xs font-bold border border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors cursor-pointer select-none"
                          >
                            {profileLookingForExpanded ? 'Show Less' : `+ ${selectedUser.lookingFor.length - 3} More`}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Privacy restricted item */}
                    {selectedUser.privacySettings.showEmail ? (
                      <div className="p-3.5 rounded-xl border border-dashed border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-455">Registered Student Email Coordinates:</span>
                        <span className="font-extrabold font-mono text-indigo-600 dark:text-indigo-400">{selectedUser.email}</span>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl border border-dashed border-neutral-100 dark:border-white/5 text-center text-[10px] font-mono text-slate-400 italic bg-neutral-50/15">
                        ⚠️ Student card email is set to incognito. Submit a connection request to chat!
                      </div>
                    )}

                  </div>
                ) : (
                  <div className="space-y-4">
                    {sharedPosts.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 space-y-1">
                        <p className="font-bold">No dispatches found.</p>
                        <p>{selectedUser.fullName.split(' ')[0]} has not shared any updates or code projects yet.</p>
                      </div>
                    ) : (
                      sharedPosts.map(post => {
                        const hasLiked = post.likes.includes(currentUser.id);
                        return (
                          <div key={post.id} className={`p-4 rounded-xl border border-neutral-200/60 dark:border-white/5 text-xs text-left space-y-3.5 ${
                            darkMode ? 'bg-zinc-950/40 text-slate-300' : 'bg-slate-50/40 text-slate-800'
                          }`}>
                            
                            {/* Card sub header */}
                            <div className="flex justify-between items-center text-[10px] border-b border-neutral-150/10 dark:border-white/5 pb-2">
                              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold uppercase text-[8px] font-mono">
                                {post.academicTag}
                              </span>
                              <span className="font-mono text-slate-400">
                                {new Date(post.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>

                            {/* Content */}
                            {post.projectTitle && (
                              <h5 className="font-sans font-black tracking-tight text-xs pr-1 border-l-4 border-pink-500 pl-2 text-slate-800 dark:text-slate-100">
                                Project Dispatch: {post.projectTitle}
                              </h5>
                            )}

                            <p className="leading-relaxed whitespace-pre-wrap">{post.content}</p>

                            {post.postImage && (
                              <div className="w-full max-h-56 rounded-lg overflow-hidden border border-neutral-200 dark:border-white/15">
                                <img src={post.postImage} alt="Post dispatch media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              </div>
                            )}

                            {/* Likes comment summary stats and quick triggers */}
                            <div className="flex items-center justify-between border-t border-b border-neutral-150/10 dark:border-white/5 py-2">
                              
                              <button
                                type="button"
                                onClick={() => handleLikePost(post.id)}
                                className={`flex items-center gap-1.5 py-0.5 px-2 bg-transparent border-0 cursor-pointer ${
                                  hasLiked ? 'text-rose-500 font-bold' : 'text-slate-400 hover:text-rose-500'
                                }`}
                              >
                                <Heart size={14} fill={hasLiked ? 'currentColor' : 'none'} />
                                <span className="text-[10px] font-mono font-bold">{post.likes.length} Likes</span>
                              </button>

                              <div className="flex items-center gap-1.5 text-slate-400">
                                <MessageSquare size={14} />
                                <span className="text-[10px] font-mono font-bold">{post.comments.length} Comments</span>
                              </div>

                            </div>

                            {/* Comments Scroller inside model */}
                            {post.comments.length > 0 && (
                              <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar pt-1">
                                {post.comments.map(c => {
                                  const cAuthor = allUsers.find(u => u.id === c.authorId);
                                  if (!cAuthor || cAuthor.isSuspended) return null;
                                  return (
                                    <div key={c.id} className="text-[10.5px] leading-relaxed">
                                      <span className="font-extrabold text-[#7485A5] mr-1 truncate">{cAuthor.fullName.split(' ')[0]}:</span>
                                      <span className="opacity-80">{c.content}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Quick Inline Comment Composer */}
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.currentTarget;
                                const input = form.elements.namedItem('replyText') as HTMLInputElement;
                                if (input && input.value.trim()) {
                                  handleAddComment(post.id, input.value.trim());
                                  input.value = '';
                                }
                              }}
                              className="flex gap-2 items-center"
                            >
                              <input
                                name="replyText"
                                type="text"
                                placeholder={`Acknowledge this dispatch...`}
                                className={`flex-1 px-3 py-1.5 rounded-xl text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                  darkMode ? 'bg-black/40 border border-white/5 text-white' : 'bg-neutral-100/50 border border-neutral-200 text-slate-800'
                                }`}
                              />
                              <button
                                type="submit"
                                className="py-1 px-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-[10px] uppercase border-0 cursor-pointer transition-colors shrink-0"
                              >
                                Reply
                              </button>
                            </form>

                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Close Bottom Area */}
              <div className="p-4 border-t border-neutral-150 dark:border-white/5 flex items-center justify-end font-sans shrink-0">
                <button
                  type="button"
                  onClick={() => setViewingUserProfileId(null)}
                  className={`px-5 py-2 text-[10px] font-extrabold uppercase tracking-wide rounded-full border-0 cursor-pointer transition-colors ${
                    darkMode ? 'bg-zinc-800 text-slate-200' : 'bg-neutral-100 text-slate-800'
                  }`}
                >
                  Close Explorer
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}
