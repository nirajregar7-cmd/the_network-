import React, { useState, useEffect, useCallback, useRef } from 'react';
import { UserProfile, Post, Community, Connection, DirectMessage, UserReport, Comment, Story } from './types';
import { ALL_PREDEFINED_CHAPTERS } from './data/chaptersData';
import { api } from './api';

import CreateModal from './components/CreateModal';
import ReelsViewer from './components/ReelsViewer';
import AuthSection from './components/AuthSection';
import OnboardingSection from './components/OnboardingSection';
import DashboardSection from './components/DashboardSection';
import DiscoverySection from './components/DiscoverySection';
import FeedSection from './components/FeedSection';
import MessagingSection from './components/MessagingSection';
import CommunitiesSection from './components/CommunitiesSection';
import ProfileSection from './components/ProfileSection';
import AdminSection from './components/AdminSection';
import CollegeAdminSection from './components/CollegeAdminSection';
import ProjectsSection from './components/ProjectsSection';
import CollegesSection from './components/CollegesSection';
import EventsSection from './components/EventsSection';
import AttendanceSection from './components/AttendanceSection';
import NotificationsDropdown from './components/NotificationsDropdown';
import Avatar from './components/Avatar';
import InstallPrompt from './components/InstallPrompt';
import NotificationSetup from './components/NotificationSetup';
import MyContentSection from './components/MyContentSection';

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
  Plus,
  X,
  Image as ImageIcon,
  Send,
  Sparkle,
  Heart,
  Check,
  Rocket,
  Building2,
  Calendar,
  Crown,
  ClipboardCheck,
  LayoutGrid,
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
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [communities, setCommunities] = useState<Community[]>([]);
  const [reports, setReports] = useState<UserReport[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [theme, setTheme] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('network_theme') as ThemeName;
    if (saved && THEMES[saved]) return saved;
    return 'light';
  });
  const darkMode = THEMES[theme].isDark;

  const [activeView, setActiveView] = useState<string>('feed');
  const [showNewPostModal, setShowNewPostModal] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeReelData, setActiveReelData] = useState<{ reels: Story[]; index: number } | null>(null);
  const [viewingUserProfileId, setViewingUserProfileId] = useState<string | null>(null);
  const [preSelectedMsgUserId, setPreSelectedMsgUserId] = useState<string | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<'card' | 'shares'>('card');
  const [profileInterestsExpanded, setProfileInterestsExpanded] = useState<boolean>(false);
  const [profileLookingForExpanded, setProfileLookingForExpanded] = useState<boolean>(false);

  const touchStartX = useRef<number>(0);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const SWIPE_VIEWS = ['feed', 'dashboard', 'explore', 'messages', 'colleges', 'attendance', 'mycontent', 'profile'];

  const [modalPostContent, setModalPostContent] = useState('');
  const [modalSelectedTag, setModalSelectedTag] = useState('Startup Pitch 🚀');
  const [modalSelectedFeeling, setModalSelectedFeeling] = useState('');
  const [modalSelectedCommunity, setModalSelectedCommunity] = useState('');
  const [modalProjectTitle, setModalProjectTitle] = useState('');
  const [modalPostImage, setModalPostImage] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);

  useEffect(() => {
    setProfileInterestsExpanded(false);
    setProfileLookingForExpanded(false);
  }, [viewingUserProfileId]);

  // ── Restore session from localStorage on page load ────────────────────────
  useEffect(() => {
    const savedId = localStorage.getItem('network_uid');
    if (!savedId) { setSessionRestored(true); return; }
    api.users.getById(savedId)
      .then((user: UserProfile) => {
        if (user && !user.isSuspended) setCurrentUser(user);
        else localStorage.removeItem('network_uid');
      })
      .catch(() => localStorage.removeItem('network_uid'))
      .finally(() => setSessionRestored(true));
  }, []);

  // ── Read ?view= URL param on load (from push notification click) ──────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get('view');
    const userId = params.get('userId');
    if (view) {
      setActiveView(view);
      if (userId && view === 'messages') setPreSelectedMsgUserId(userId);
      // Clean URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // ── Listen for SW_NAVIGATE messages (push notification click in open app) ─
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SW_NAVIGATE' && e.data.view) {
        setActiveView(e.data.view);
        if (e.data.userId && e.data.view === 'messages') {
          setPreSelectedMsgUserId(e.data.userId);
        }
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }, []);

  // ── Notifications polling (every 25s) ─────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;
    const fetchNotifs = () => api.notifications.getForUser(currentUser.id).catch(() => null);
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 25000);
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  useEffect(() => {
    localStorage.setItem('network_theme', theme);
    const html = document.documentElement;
    html.classList.remove('theme-light', 'theme-dark', 'theme-ocean', 'theme-forest', 'theme-sunset', 'theme-midnight', 'dark');
    html.classList.add(`theme-${theme}`);
    if (THEMES[theme].isDark) html.classList.add('dark');
  }, [theme]);

  const loadAppData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersData, postsData, connectionsData, messagesData, storiesData, reportsData] = await Promise.all([
        api.users.getAll(),
        api.posts.getAll(),
        api.connections.getAll(),
        api.messages.getAll(),
        api.stories.getAll(),
        api.reports.getAll(),
      ]);
      setAllUsers(usersData);
      setPosts(postsData);
      setConnections(connectionsData);
      setMessages(messagesData);
      setStories(storiesData);
      setReports(reportsData);

      const commData = await api.communities.getAll();
      if (commData.length === 0) {
        await api.communities.seed(ALL_PREDEFINED_CHAPTERS);
        const seeded = await api.communities.getAll();
        setCommunities(seeded);
      } else {
        setCommunities(commData);
      }
    } catch (err) {
      console.error('Failed to load app data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppData();
  }, [loadAppData]);

  const isNewUser = (user: UserProfile) =>
    !user.aboutMe && user.interests.length === 0 && user.skills.length === 0 && user.lookingFor.length === 0;

  const handleLogin = (user: UserProfile) => {
    localStorage.setItem('network_uid', user.id);
    setCurrentUser(user);
    setAllUsers(prev => {
      if (prev.some(u => u.id === user.id)) {
        return prev.map(u => u.id === user.id ? user : u);
      }
      return [...prev, user];
    });
    // Auto-join batch group
    api.batchGroup.ensure(user.id).catch(() => {});
    if (isNewUser(user)) {
      setShowOnboarding(true);
    } else {
      setActiveView('feed');
    }
  };

  const handleOnboardingComplete = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const saved = await api.users.update(currentUser.id, { ...currentUser, ...updates });
    setCurrentUser(saved);
    setAllUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
    setShowOnboarding(false);
    setActiveView('feed');
  };

  const handleLogout = () => {
    localStorage.removeItem('network_uid');
    setCurrentUser(null);
    setActiveView('feed');
  };

  const handleUpdateProfile = async (updatedProfile: UserProfile) => {
    try {
      const saved = await api.users.update(updatedProfile.id, updatedProfile);
      setCurrentUser(saved);
      setAllUsers(prev => prev.map(u => u.id === saved.id ? saved : u));
    } catch (err) {
      console.error('Failed to update profile', err);
    }
  };

  const handleSendConnectionRequest = async (
    receiverId: string,
    type: 'Startup Discussion' | 'Friendship' | 'Study Partner' | 'Hackathon Team',
    message: string
  ) => {
    if (!currentUser) return;
    try {
      const newConn = await api.connections.create({ senderId: currentUser.id, receiverId, type, message });
      setConnections(prev => [...prev, newConn]);
    } catch (err) {
      console.error('Failed to send connection request', err);
    }
  };

  const handleAcceptConnection = async (requestId: string) => {
    try {
      const updated = await api.connections.update(requestId, 'accepted');
      setConnections(prev => prev.map(c => c.id === requestId ? updated : c));
    } catch (err) {
      console.error('Failed to accept connection', err);
    }
  };

  const handleRejectConnection = async (requestId: string) => {
    try {
      const updated = await api.connections.update(requestId, 'rejected');
      setConnections(prev => prev.map(c => c.id === requestId ? updated : c));
    } catch (err) {
      console.error('Failed to reject connection', err);
    }
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (!currentUser) return;
    const comm = communities.find(c => c.id === communityId);
    if (!comm) return;
    const newMemberIds = [...(comm.memberIds as string[]).filter(id => id !== currentUser.id), currentUser.id];
    try {
      const updated = await api.communities.update(communityId, { memberIds: newMemberIds });
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updated } : c));
    } catch (err) {
      console.error('Failed to join community', err);
    }
  };

  const handleLeaveCommunity = async (communityId: string) => {
    if (!currentUser) return;
    const comm = communities.find(c => c.id === communityId);
    if (!comm) return;
    const newMemberIds = (comm.memberIds as string[]).filter(id => id !== currentUser.id);
    try {
      const updated = await api.communities.update(communityId, { memberIds: newMemberIds });
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updated } : c));
    } catch (err) {
      console.error('Failed to leave community', err);
    }
  };

  const handleCreateCommunity = async (community: { name: string; description: string; icon: string; tags: string[]; category: string }) => {
    if (!currentUser) return;
    try {
      const newComm = await api.communities.create({ ...community, creatorId: currentUser.id });
      setCommunities(prev => [newComm, ...prev]);
    } catch (err) {
      console.error('Failed to create community', err);
    }
  };

  const handleAddCommunityResource = async (communityId: string, title: string, link: string, description: string) => {
    if (!currentUser) return;
    const comm = communities.find(c => c.id === communityId);
    if (!comm) return;
    const newResource = {
      id: `res-${Date.now()}`,
      title, link, description,
      authorId: currentUser.id,
      createdAt: new Date().toISOString()
    };
    const newResources = [...(comm.resources || []), newResource];
    try {
      const updated = await api.communities.update(communityId, { resources: newResources });
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updated } : c));
    } catch (err) {
      console.error('Failed to add resource', err);
    }
  };

  const handleAddCommunityThread = async (communityId: string, title: string, content: string) => {
    if (!currentUser) return;
    const comm = communities.find(c => c.id === communityId);
    if (!comm) return;
    const newThread = {
      id: `thread-${Date.now()}`,
      title, content,
      authorId: currentUser.id,
      createdAt: new Date().toISOString(),
      replies: []
    };
    const newThreads = [...(comm.threads || []), newThread];
    try {
      const updated = await api.communities.update(communityId, { threads: newThreads });
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updated } : c));
    } catch (err) {
      console.error('Failed to add thread', err);
    }
  };

  const handleAddThreadReply = async (communityId: string, threadId: string, content: string) => {
    if (!currentUser) return;
    const comm = communities.find(c => c.id === communityId);
    if (!comm) return;
    const newThreads = (comm.threads || []).map((t: any) => {
      if (t.id === threadId) {
        return {
          ...t,
          replies: [...t.replies, {
            id: `rep-${Date.now()}`,
            authorId: currentUser.id,
            content,
            createdAt: new Date().toISOString()
          }]
        };
      }
      return t;
    });
    try {
      const updated = await api.communities.update(communityId, { threads: newThreads });
      setCommunities(prev => prev.map(c => c.id === communityId ? { ...c, ...updated } : c));
    } catch (err) {
      console.error('Failed to add reply', err);
    }
  };

  const handleAddPost = async (
    content: string,
    academicTag: string,
    communityId?: string,
    projectTitle?: string,
    postImage?: string,
    feeling?: string
  ) => {
    if (!currentUser) return;
    try {
      const newPost = await api.posts.create({
        authorId: currentUser.id,
        content, academicTag,
        communityId: communityId || null,
        projectTitle: projectTitle || null,
        postImage: postImage || null,
        feeling: feeling || null
      });
      setPosts(prev => [newPost, ...prev]);
    } catch (err) {
      console.error('Failed to create post', err);
    }
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

  const handleAddStory = async (content: string, image?: string) => {
    if (!currentUser) return;
    try {
      const newStory = await api.stories.create(currentUser.id, content, image);
      setStories(prev => [newStory, ...prev]);
    } catch (err) {
      console.error('Failed to create story', err);
    }
  };

  const handleReactToStory = async (storyId: string, emoji: string) => {
    try {
      const updated = await api.stories.react(storyId, emoji);
      setStories(prev => prev.map(s => s.id === storyId ? { ...s, reactions: updated.reactions } : s));
    } catch (err) {
      console.error('Failed to react to story', err);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!currentUser) return;
    try {
      const updated = await api.posts.like(postId, currentUser.id);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes: updated.likes } : p));
    } catch (err) {
      console.error('Failed to like post', err);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!currentUser) return;
    try {
      const newComment = await api.posts.addComment(postId, currentUser.id, content);
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      }));
    } catch (err) {
      console.error('Failed to add comment', err);
    }
  };

  const handleSendMessage = async (receiverId: string, content: string) => {
    if (!currentUser) return;
    try {
      const newMsg = await api.messages.send(currentUser.id, receiverId, content);
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleReportUser = async (reportedUserId: string, reason: string, description: string) => {
    if (!currentUser) return;
    try {
      const newReport = await api.reports.create({
        reporterId: currentUser.id,
        reportedUserId,
        reason,
        description
      });
      setReports(prev => [newReport, ...prev]);
    } catch (err) {
      console.error('Failed to report user', err);
    }
  };

  const handleToggleUserSuspension = async (userId: string) => {
    try {
      const updated = await api.users.toggleSuspend(userId);
      setAllUsers(prev => prev.map(u => u.id === userId ? updated : u));
      if (currentUser?.id === userId) {
        alert('This profile is under suspension. Logging you out...');
        handleLogout();
      }
    } catch (err) {
      console.error('Failed to toggle suspension', err);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'suspended' | 'dismissed') => {
    try {
      const updated = await api.reports.update(reportId, status);
      setReports(prev => prev.map(r => r.id === reportId ? updated : r));
    } catch (err) {
      console.error('Failed to resolve report', err);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await api.posts.delete(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error('Failed to delete post', err);
    }
  };

  const handleRegisterEvent = (eventId: string) => {
    if (!registeredEvents.includes(eventId)) {
      setRegisteredEvents(prev => [...prev, eventId]);
    }
  };

  const onSwipeStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const onSwipeEnd = useCallback((e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    const idx = SWIPE_VIEWS.indexOf(activeView);
    if (delta > 60 && idx < SWIPE_VIEWS.length - 1) {
      setActiveView(SWIPE_VIEWS[idx + 1]);
    } else if (delta < -60 && idx > 0) {
      setActiveView(SWIPE_VIEWS[idx - 1]);
    }
  }, [activeView]);

  const handleMobileScroll = useCallback(() => {
    const el = mobileScrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollLeft / el.clientWidth);
    const view = SWIPE_VIEWS[idx];
    if (view && view !== activeView) setActiveView(view);
  }, [activeView]);

  if (isLoading || !sessionRestored) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${darkMode ? 'bg-[#09090C] text-white' : 'bg-neutral-50 text-slate-900'}`}>
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm font-mono text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <AuthSection
        onLogin={handleLogin}
        darkMode={darkMode}
      />
    );
  }

  if (showOnboarding) {
    return (
      <OnboardingSection
        user={currentUser}
        onComplete={handleOnboardingComplete}
        darkMode={darkMode}
      />
    );
  }

  const totalUnreadMessages = messages.filter(
    m => m.receiverId === currentUser.id && !m.isRead
  ).length;

  const renderSection = (view: string) => {
    if (view === 'feed') return (
      <FeedSection
        currentUser={currentUser}
        posts={posts}
        allUsers={allUsers}
        communities={communities}
        connections={connections}
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
        onSendConnectionRequest={(receiverId) => handleSendConnectionRequest(receiverId, 'Friendship', `Hi! I'd love to connect with you.`)}
        onNavigate={setActiveView}
        onOpenReel={(reels, index) => setActiveReelData({ reels, index })}
      />
    );
    if (view === 'dashboard') return (
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
    );
    if (view === 'explore') return (
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
    );
    if (view === 'messages') return (
      <MessagingSection
        currentUser={currentUser}
        connections={connections}
        allUsers={allUsers}
        messages={messages}
        onSendMessage={handleSendMessage}
        darkMode={darkMode}
        preSelectedUserId={preSelectedMsgUserId || undefined}
        onViewUserProfile={setViewingUserProfileId}
        onMessagesRefresh={async () => {
          try {
            const fresh = await api.messages.getAll();
            setMessages(fresh);
          } catch {}
        }}
      />
    );
    if (view === 'colleges') return (
      <CollegesSection
        currentUser={currentUser}
        allUsers={allUsers}
        communities={communities}
        connections={connections}
        posts={posts}
        darkMode={darkMode}
        onCommunitiesChange={setCommunities}
        onViewUserProfile={setViewingUserProfileId}
      />
    );
    if (view === 'attendance') return (
      <AttendanceSection currentUser={currentUser} darkMode={darkMode} />
    );
    if (view === 'mycontent') return (
      <MyContentSection
        currentUser={currentUser}
        darkMode={darkMode}
        posts={posts}
        allUsers={allUsers}
        onDeletePost={handleDeletePost}
        onNavigate={setActiveView}
      />
    );
    if (view === 'profile') return (
      <ProfileSection
        currentUser={currentUser}
        onUpdateProfile={handleUpdateProfile}
        darkMode={darkMode}
        communities={communities}
        connections={connections}
        allUsers={allUsers}
        onLogout={handleLogout}
      />
    );
    if (view === 'projects') return (
      <ProjectsSection
        currentUser={currentUser}
        allUsers={allUsers}
        connections={connections}
        darkMode={darkMode}
        onViewUserProfile={setViewingUserProfileId}
      />
    );
    if (view === 'events') return (
      <EventsSection
        currentUser={currentUser}
        allUsers={allUsers}
        darkMode={darkMode}
        onViewUserProfile={setViewingUserProfileId}
      />
    );
    if (view === 'communities') return (
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
    );
    if (view === 'admin') return (
      <AdminSection
        currentUser={currentUser}
        allUsers={allUsers}
        reports={reports}
        posts={posts}
        communities={communities}
        onToggleUserSuspension={handleToggleUserSuspension}
        onResolveReport={handleResolveReport}
        onDeletePost={handleDeletePost}
        onAllUsersChange={setAllUsers}
        darkMode={darkMode}
      />
    );
    if (view === 'college_admin' && currentUser.role === 'college_admin') return (
      <CollegeAdminSection
        currentUser={currentUser}
        allUsers={allUsers}
        communities={communities}
        darkMode={darkMode}
        onCommunitiesChange={setCommunities}
        onAllUsersChange={setAllUsers}
      />
    );
    return null;
  };

  return (
    <div className={`h-screen overflow-hidden flex flex-col md:h-auto md:min-h-screen md:overflow-x-hidden md:block w-full font-sans transition-all duration-300 ${darkMode ? 'text-slate-100' : 'text-slate-950'}`} style={{ backgroundColor: 'var(--t-bg)' }}>
      
      {/* ── Top Header ── */}
      <header className="shrink-0 md:fixed md:top-0 md:left-0 md:right-0 z-30 transition-all backdrop-blur-xl" style={{ backgroundColor: 'var(--t-header)' }}>

        {/* Main header row */}
        <div className="flex items-center justify-between px-4 lg:px-8 border-b border-neutral-200/70 dark:border-white/8 py-2 md:h-14 md:py-0">

          {/* Left — Logo: 2-line on mobile, 1-line on desktop */}
          <div className="flex items-center gap-3">
            <h1 className="font-serif italic font-black tracking-tight uppercase select-none bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent leading-[1.1] text-lg md:text-xl">
              <span className="block md:inline">The</span>
              <span className="block md:inline md:ml-1">Network</span>
            </h1>
            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/8 border border-indigo-500/15 text-[9px] font-mono font-bold text-indigo-500/70 tracking-widest uppercase">
              Campus Co-founder Hub
            </span>
          </div>

          {/* Right — Actions */}
          <div className="flex items-center gap-1 sm:gap-1.5">

            {/* Live DB pill — desktop only */}
            <div className="hidden md:flex items-center gap-1.5 bg-emerald-500/8 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/15 text-[10px] font-mono font-bold">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </div>

            {/* Theme cycler */}
            <button
              onClick={() => {
                const keys = Object.keys(THEMES) as ThemeName[];
                setTheme(keys[(keys.indexOf(theme) + 1) % keys.length]);
              }}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${darkMode ? 'border-white/10 hover:bg-white/6 text-slate-300' : 'border-neutral-200 hover:bg-neutral-100 text-slate-600'}`}
              title={`Theme: ${THEMES[theme].label}`}
            >
              <Palette size={15} />
            </button>

            {/* Notifications */}
            <NotificationsDropdown
              userId={currentUser.id}
              darkMode={darkMode}
              onNavigate={(view, actorId) => {
                if (view === 'messages' && actorId) setPreSelectedMsgUserId(actorId);
                setActiveView(view);
              }}
            />

            {/* Create pill — desktop only */}
            {!currentUser.isSuspended && (
              <button
                id="header-post-trigger"
                onClick={() => setShowCreateModal(true)}
                className="hidden md:flex items-center gap-1.5 py-1.5 px-4 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-pink-500 hover:to-indigo-600 font-extrabold text-[11px] uppercase tracking-wider text-white shadow-sm hover:shadow-indigo-500/20 hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer border-0 shrink-0"
                title="Create"
              >
                <Plus size={12} strokeWidth={2.5} />
                Create
              </button>
            )}

            {/* Avatar */}
            <button
              onClick={() => setActiveView('profile')}
              className="p-[2.5px] rounded-full bg-gradient-to-tr from-rose-500 via-amber-500 to-indigo-600 cursor-pointer hover:scale-105 transition-transform shrink-0"
              title="My profile"
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border-2 border-white dark:border-zinc-900 overflow-hidden ${darkMode ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-900'}`}>
                <Avatar avatar={currentUser.avatar} />
              </div>
            </button>
          </div>
        </div>

        {/* ── Horizontal scrolling tab nav — mobile only ── */}
        <div className={`md:hidden border-b border-neutral-200/70 dark:border-white/8 overflow-x-auto no-scrollbar px-3 pt-4 pb-2.5`}>
          <div className="flex gap-1.5 items-center w-max">
            {([
              { view: 'feed',         icon: <BookOpen size={13} />,       label: 'Home Feed' },
              { view: 'dashboard',    icon: <LayoutDashboard size={13} />, label: 'Dashboard' },
              { view: 'explore',      icon: <Search size={13} />,          label: 'Discovery' },
              { view: 'messages',     icon: <MessageSquare size={13} />,   label: 'College Chats', badge: totalUnreadMessages },
              { view: 'colleges',     icon: <Building2 size={13} />,       label: 'Colleges' },
              { view: 'attendance',   icon: <ClipboardCheck size={13} />,  label: 'Attendance' },
              { view: 'mycontent',    icon: <LayoutGrid size={13} />,      label: 'My Content' },
              { view: 'profile',      icon: <Settings size={13} />,        label: 'Profile' },
              ...(currentUser.role === 'admin'         ? [{ view: 'admin',         icon: <ShieldAlert size={13} />, label: 'Admin' }] : []),
              ...(currentUser.role === 'college_admin' ? [{ view: 'college_admin', icon: <Crown size={13} />,      label: 'College Panel' }] : []),
            ] as { view: string; icon: React.ReactNode; label: string; badge?: number }[]).map(item => (
              <button
                key={item.view}
                onClick={() => setActiveView(item.view)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border-0 whitespace-nowrap relative ${
                  activeView === item.view
                    ? 'bg-indigo-500 text-white shadow-sm shadow-indigo-500/25'
                    : darkMode
                      ? 'text-slate-400 hover:text-white hover:bg-white/8 bg-white/4'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-neutral-100 bg-neutral-100/80'
                }`}
              >
                {item.icon}
                {item.label}
                {item.badge && item.badge > 0 ? (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[8px] font-black flex items-center justify-center shrink-0">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MOBILE: horizontal snap-scroll pages ── */}
      <div
        ref={mobileScrollRef}
        className="md:hidden flex-1 flex overflow-x-scroll snap-x snap-mandatory"
        style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
        onScroll={handleMobileScroll}
      >
        {SWIPE_VIEWS.map((view) => (
          <div
            key={view}
            className={`snap-start w-screen shrink-0 ${
              view === 'messages' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'
            }`}
            style={{ touchAction: 'pan-y' }}
          >
            <div className={view === 'messages' ? 'flex flex-col flex-1 h-full overflow-hidden' : 'p-3 pb-4 space-y-4'}>
              {renderSection(view)}
            </div>
          </div>
        ))}
        {/* Admin / college_admin overlays when selected from tab strip */}
        {(activeView === 'admin' || activeView === 'college_admin') && (
          <div className="fixed inset-0 z-40 overflow-y-auto" style={{ top: 0, backgroundColor: 'var(--t-bg)' }}>
            <div className="pt-[108px] pb-24 px-3">
              {renderSection(activeView)}
            </div>
          </div>
        )}
      </div>

      {/* ── DESKTOP: sidebar + main ── */}
      <div className={`hidden md:flex max-w-5xl w-full mx-auto flex-row gap-6 p-4 pt-14 pb-6 ${activeView === 'messages' ? 'min-h-0 overflow-hidden' : 'min-h-screen'}`}>

        <aside className={`hidden md:flex md:flex-col md:w-60 shrink-0 space-y-4 ${activeView === 'messages' ? 'md:overflow-y-auto md:max-h-full' : ''}`}>
          <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-white/10 shadow-sm transition-all overflow-x-auto md:overflow-hidden" style={{ backgroundColor: 'var(--t-card)' }}>
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
                id="view-colleges-tab"
                onClick={() => setActiveView('colleges')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'colleges' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <Building2 size={14} />
                <span>Colleges</span>
              </button>

              <button
                id="view-attendance-tab"
                onClick={() => setActiveView('attendance')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'attendance' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <ClipboardCheck size={14} />
                <span>Attendance</span>
              </button>

              <button
                id="view-mycontent-tab"
                onClick={() => setActiveView('mycontent')}
                className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'mycontent' ? 'bg-indigo-500 text-white border-transparent shadow-sm' : (darkMode ? 'text-slate-400 border-transparent hover:bg-white/5 hover:text-white' : 'text-slate-600 border-transparent hover:bg-neutral-100 hover:text-slate-950')}`}
              >
                <LayoutGrid size={14} />
                <span>My Content</span>
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

              {currentUser.role === 'college_admin' && (
                <button
                  onClick={() => setActiveView('college_admin')}
                  className={`shrink-0 md:w-full py-2 px-3 rounded-xl flex items-center gap-3 font-semibold transition-all cursor-pointer border ${activeView === 'college_admin' ? 'bg-amber-500 text-white border-transparent shadow-sm' : 'text-amber-600 border-transparent hover:bg-amber-500/10'}`}
                >
                  <Crown size={14} />
                  <span>College Panel</span>
                </button>
              )}
            </nav>

            <div className="hidden md:block mt-6 pt-4 border-t border-neutral-150 dark:border-white/10 space-y-3">
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

        <main className={`flex-1 min-w-0 ${activeView === 'messages' ? 'flex flex-col min-h-0 overflow-hidden' : 'space-y-6'}`}>
          {renderSection(activeView)}
        </main>

      </div>

      {/* Root-level Reels Viewer — renders above everything including fixed header & bottom nav */}
      {activeReelData && (
        <ReelsViewer
          reels={activeReelData.reels}
          startIndex={activeReelData.index}
          allUsers={allUsers}
          currentUser={currentUser}
          darkMode={darkMode}
          onClose={() => setActiveReelData(null)}
          onViewUserProfile={(id) => { setActiveReelData(null); setViewingUserProfileId(id); }}
          onReact={handleReactToStory}
        />
      )}

      {/* New Post Modal */}
      {showCreateModal && (
        <CreateModal
          onClose={() => setShowCreateModal(false)}
          currentUser={currentUser}
          communities={communities}
          darkMode={darkMode}
          onPostCreated={(post) => setPosts(prev => [post, ...prev])}
          onEventCreated={(event) => { /* events live in EventsSection local state; navigate there */ setActiveView('events'); }}
          onProjectCreated={(proj) => { setActiveView('projects'); }}
          onCommunityCreated={(comm) => setCommunities(prev => [comm, ...prev])}
          onGroupCreated={(group) => { setActiveView('messages'); }}
          onStoryCreated={(story) => setStories(prev => [story, ...prev])}
        />
      )}

      {showNewPostModal && (
        <div className="fixed inset-0 bg-neutral-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 transition-all animate-fade-in font-sans">
          <div className={`relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-neutral-200/90 dark:border-white/10 flex flex-col md:flex-row max-h-[90vh] md:h-[620px] transition-all duration-300 ${darkMode ? 'bg-[#0E0E12] text-[#F9F7F2]' : 'bg-white text-slate-900'}`}>
            
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

                {modalProjectTitle && (
                  <div className="mt-3 bg-gradient-to-r from-indigo-500/10 via-pink-500/10 to-indigo-500/10 border border-indigo-500/30 rounded-lg p-2">
                    <div className="text-[7.5px] font-mono uppercase text-indigo-400 font-extrabold tracking-widest">🚀 Project showcase</div>
                    <div className="text-[10px] font-extrabold text-white truncate">{modalProjectTitle}</div>
                  </div>
                )}

                <p className="mt-3.5 text-[11px] font-sans leading-relaxed text-neutral-350 max-h-24 overflow-y-auto no-scrollbar break-words italic">
                  "{modalPostContent || 'Type something beautiful to preview your update in real-time on the campus timeline...'}"
                </p>
              </div>

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

            <form onSubmit={handleModalPostSubmit} className="flex-1 p-6 flex flex-col justify-between overflow-y-auto min-h-0">
              
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

              <div className="py-4 space-y-4 flex-1 overflow-y-auto pr-1 no-scrollbar text-xs">
                
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500">Academic Category</label>
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

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500">Post to Community</label>
                    <select
                      value={modalSelectedCommunity}
                      onChange={(e) => setModalSelectedCommunity(e.target.value)}
                      className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-indigo-500 text-xs focus:outline-none cursor-pointer transition-all ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                    >
                      <option value="">General Feed</option>
                      {communities.map(comm => (
                        <option key={comm.id} value={comm.id}>{comm.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500">Project / Pitch Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. EcoDrone Autonomous Pitch Seed..."
                    value={modalProjectTitle}
                    onChange={(e) => setModalProjectTitle(e.target.value)}
                    className={`w-full p-2.5 rounded-xl border focus:ring-1 focus:ring-indigo-500 text-xs focus:outline-none transition-all ${darkMode ? 'bg-[#09090C] border-white/5 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'}`}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wide font-extrabold text-slate-400 dark:text-zinc-500 block">Attach Image (Optional)</label>
                  
                  <div className="space-y-1">
                    <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 block">Pick a stock theme:</span>
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
                        Upload Photo
                      </label>
                    </div>
                  </div>
                </div>

              </div>

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

      {/* Peer Profile Overlay Modal */}
      {viewingUserProfileId && (() => {
        const selectedUser = allUsers.find(u => u.id === viewingUserProfileId);
        if (!selectedUser) return null;

        const sharedPosts = posts.filter(p => p.authorId === selectedUser.id);
        const currentRelations = connections.filter(
          c => (c.senderId === currentUser.id && c.receiverId === selectedUser.id) ||
               (c.senderId === selectedUser.id && c.receiverId === currentUser.id)
        );
        const activeRelation = currentRelations[0];
        const sharedInterests = (selectedUser.interests as string[]).filter(tag => (currentUser.interests as string[]).includes(tag));
        const sharedSkills = (selectedUser.skills as string[]).filter(tag => (currentUser.skills as string[]).includes(tag));
        const overlapCount = sharedInterests.length + sharedSkills.length;

        const handleQuickConnect = () => {
          handleSendConnectionRequest(selectedUser.id, 'Friendship', `Hi ${selectedUser.fullName}! I saw your profile and wanted to connect.`);
        };

        const handleStartChat = () => {
          setPreSelectedMsgUserId(selectedUser.id);
          setViewingUserProfileId(null);
          setActiveView('messages');
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 sm:p-4 backdrop-blur-xs text-left overflow-hidden">
            <div className={`relative w-full max-w-2xl rounded-3xl border border-neutral-200/50 dark:border-white/10 shadow-2xl overflow-hidden transition-all flex flex-col h-[90vh] sm:h-[85vh] max-h-[90vh] min-h-0 ${
              darkMode ? 'bg-[#121217] text-slate-100' : 'bg-white text-slate-900'
            }`}>
              
              <div className="h-28 shrink-0 bg-gradient-to-r from-indigo-505 via-indigo-600 to-pink-500 relative flex items-end p-4">
                <button
                  onClick={() => setViewingUserProfileId(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-all cursor-pointer border-0"
                >
                  <X size={16} />
                </button>
                <div className="absolute -bottom-8 left-6 p-[2px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 shadow-lg animate-none">
                  <div className={`w-18 h-18 rounded-full border-4 border-white dark:border-[#121217] flex items-center justify-center font-black text-xl bg-[#1A1A1A] text-white overflow-hidden`}>
                    <Avatar avatar={selectedUser.avatar} />
                  </div>
                </div>
              </div>

              <div className="pt-10 px-6 pb-4 shrink-0 border-b border-dashed border-neutral-150 dark:border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5 font-sans">
                      <span>{selectedUser.fullName}</span>
                      {selectedUser.isVerified && (
                        <span className="py-0.5 px-2 rounded bg-indigo-500/15 text-indigo-500 dark:bg-indigo-500/25 text-[9px] font-mono font-bold uppercase tracking-wide">
                          VERIFIED
                        </span>
                      )}
                    </h3>
                    <p className="text-xs font-mono text-indigo-550 dark:text-indigo-400 mt-0.5">
                      {selectedUser.college} • {selectedUser.branch}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Year {selectedUser.year} Student
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {selectedUser.id !== currentUser.id && (
                      <>
                        {activeRelation ? (
                          <span className={`py-1.5 px-3.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            activeRelation.status === 'accepted' 
                              ? 'bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15' 
                              : 'bg-amber-500/10 text-amber-500 dark:bg-amber-500/15'
                          }`}>
                            {activeRelation.status === 'accepted' ? 'Connected' : 'Pending'}
                          </span>
                        ) : (
                          <button
                            onClick={handleQuickConnect}
                            className="py-1.5 px-4 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase tracking-wider text-[10px] border-0 cursor-pointer transition-colors shadow-xs"
                          >
                            Connect
                          </button>
                        )}

                        <button
                          onClick={handleStartChat}
                          className="py-1.5 px-4 rounded-full bg-pink-500 hover:bg-pink-600 text-white font-bold uppercase tracking-wider text-[10px] border-0 cursor-pointer transition-colors shadow-xs"
                        >
                          Message
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedUser.id !== currentUser.id && overlapCount > 0 && (
                  <div className="mt-3.5 inline-flex items-center gap-1.5 py-1 px-3 rounded-lg border border-indigo-400/20 bg-indigo-500/[0.03] dark:bg-indigo-500/[0.05] text-[10px] font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    <Sparkles size={11} className="text-indigo-500" />
                    <span>{overlapCount} shared dimension{overlapCount > 1 ? 's' : ''}: {[...sharedInterests, ...sharedSkills].join(', ')}</span>
                  </div>
                )}
              </div>

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
                  Profile 📑
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
                  Posts ({sharedPosts.length}) 📢
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                {profileActiveTab === 'card' && (
                  <div className="p-6 space-y-5 text-xs">
                    {selectedUser.aboutMe && (
                      <div>
                        <h4 className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">About</h4>
                        <p className="leading-relaxed text-xs">{selectedUser.aboutMe}</p>
                      </div>
                    )}

                    {(selectedUser.interests as string[]).length > 0 && (
                      <div>
                        <h4 className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">Interests</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedUser.interests as string[]).map(interest => (
                            <span key={interest} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${sharedInterests.includes(interest) ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-400/20' : darkMode ? 'bg-white/5 text-slate-300' : 'bg-neutral-100 text-slate-700'}`}>
                              {interest} {sharedInterests.includes(interest) && '✓'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedUser.skills as string[]).length > 0 && (
                      <div>
                        <h4 className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedUser.skills as string[]).map(skill => (
                            <span key={skill} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${sharedSkills.includes(skill) ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-400/20' : darkMode ? 'bg-white/5 text-slate-300' : 'bg-neutral-100 text-slate-700'}`}>
                              {skill} {sharedSkills.includes(skill) && '✓'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {(selectedUser.lookingFor as string[]).length > 0 && (
                      <div>
                        <h4 className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400 mb-2">Looking For</h4>
                        <div className="flex flex-wrap gap-1.5">
                          {(selectedUser.lookingFor as string[]).map(item => (
                            <span key={item} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${darkMode ? 'bg-pink-500/10 text-pink-400' : 'bg-pink-50 text-pink-600 border border-pink-200/50'}`}>
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {profileActiveTab === 'shares' && (
                  <div className="p-4 space-y-3">
                    {sharedPosts.length === 0 ? (
                      <div className="text-center py-12 text-slate-400">
                        <p className="text-sm">No posts yet</p>
                      </div>
                    ) : (
                      sharedPosts.map(post => (
                        <div key={post.id} className={`p-4 rounded-xl border text-xs ${darkMode ? 'bg-white/3 border-white/5' : 'bg-neutral-50 border-neutral-200'}`}>
                          {post.projectTitle && (
                            <div className="text-[9px] font-mono text-indigo-500 uppercase font-bold mb-1">{post.projectTitle}</div>
                          )}
                          <p className="leading-relaxed">{post.content}</p>
                          <div className="flex items-center gap-3 mt-2 text-[9px] text-slate-400">
                            <span className="flex items-center gap-1"><Heart size={10} /> {(post.likes as string[]).length}</span>
                            <span>{post.academicTag}</span>
                            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

    <InstallPrompt darkMode={darkMode} />
    {currentUser && <NotificationSetup userId={currentUser.id} darkMode={darkMode} />}

    {/* Mobile Bottom Navigation Bar */}
    <nav className={`md:hidden shrink-0 z-50 border-t flex items-center justify-around px-2 py-2 ${darkMode ? 'bg-[#09090C]/95 border-white/10 backdrop-blur-xl' : 'bg-white/95 border-neutral-200 backdrop-blur-xl'}`}
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      {[
        { view: 'feed',        icon: <BookOpen size={18} />,      label: 'Home' },
        { view: 'explore',     icon: <Search size={18} />,         label: 'Explore' },
        { view: 'messages',    icon: <MessageSquare size={18} />,  label: 'Chats', badge: totalUnreadMessages },
        { view: 'colleges',    icon: <Building2 size={18} />,      label: 'Campus' },
        { view: 'profile',     icon: <Settings size={18} />,       label: 'Profile' },
      ].map(item => (
        <button
          key={item.view}
          onClick={() => setActiveView(item.view)}
          className={`relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all cursor-pointer ${
            activeView === item.view
              ? 'text-indigo-500'
              : darkMode ? 'text-slate-500' : 'text-slate-400'
          }`}
        >
          {item.badge && item.badge > 0 ? (
            <span className="relative">
              {item.icon}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-rose-500 text-white text-[7px] font-bold flex items-center justify-center">{item.badge > 9 ? '9+' : item.badge}</span>
            </span>
          ) : item.icon}
          <span className={`text-[9px] font-semibold leading-none ${activeView === item.view ? 'text-indigo-500' : ''}`}>{item.label}</span>
          {activeView === item.view && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-indigo-500" />}
        </button>
      ))}

      {/* Centre Create button */}
      {!currentUser.isSuspended && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex flex-col items-center gap-0.5 px-3 py-1 cursor-pointer"
          style={{ order: -1, marginLeft: 'auto', marginRight: 'auto' }}
        >
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 -mt-5">
            <Plus size={20} className="text-white" strokeWidth={2.5} />
          </span>
          <span className={`text-[9px] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Create</span>
        </button>
      )}
    </nav>
    </div>
  );
}
