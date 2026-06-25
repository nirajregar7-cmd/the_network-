import React, { useState, useRef } from 'react';
import {
  X, Send, Image as ImageIcon, FileText, Calendar, Rocket,
  Users, MessageSquare, Video, Plus, Trash2, Globe, MapPin,
  Cpu, Hash, Zap, ChevronDown
} from 'lucide-react';
import { api } from '../api';
import Avatar from './Avatar';

interface UserProfile {
  id: string; fullName: string; college: string; branch: string; year: number;
  email: string; avatar: string; aboutMe: string; interests: string[];
  skills: string[]; lookingFor: string[]; isVerified: boolean; isSuspended: boolean;
  role: string; collegeAdminOf?: string | null; privacySettings: any; createdAt: string;
}

interface Community { id: string; name: string; }

interface Props {
  onClose: () => void;
  currentUser: UserProfile;
  communities: Community[];
  darkMode: boolean;
  onPostCreated: (post: any) => void;
  onEventCreated: (event: any) => void;
  onProjectCreated: (project: any) => void;
  onCommunityCreated: (community: any) => void;
  onGroupCreated: (group: any) => void;
  onStoryCreated: (story: any) => void;
}

type Tab = 'post' | 'event' | 'project' | 'community' | 'group' | 'reel';

const TABS: { id: Tab; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'post',      label: 'Post',      icon: <FileText size={14} />,     color: 'indigo' },
  { id: 'event',     label: 'Event',     icon: <Calendar size={14} />,     color: 'rose' },
  { id: 'project',   label: 'Project',   icon: <Rocket size={14} />,       color: 'amber' },
  { id: 'community', label: 'Community', icon: <Users size={14} />,        color: 'emerald' },
  { id: 'group',     label: 'Group',     icon: <MessageSquare size={14} />, color: 'sky' },
  { id: 'reel',      label: 'Reel',      icon: <Video size={14} />,        color: 'pink' },
];

const ACADEMIC_TAGS = [
  'Startup Pitch 🚀','Co-Founder Search 🤝','Study Partner Wanted 📚',
  'Idea Drop 💡','Research Collaborator 🔬','Hackathon Squad 💻',
  'Mentor Match 🎓','Startup Discussion 💬'
];
const FEELING_PRESETS = [
  { emoji: '🚀', label: 'Building' }, { emoji: '💡', label: 'Ideating' },
  { emoji: '🔥', label: 'Hustling' }, { emoji: '🧠', label: 'Deep Work' },
  { emoji: '🤝', label: 'Networking' }, { emoji: '🎯', label: 'Focused' },
];
const EVENT_CATS = ['Hackathon', 'Study Group', 'Seminar', 'Workshop', 'Social', 'Sports', 'Cultural', 'General'];
const PROJECT_STAGES = ['Idea', 'Prototype', 'MVP', 'Scaling', 'Completed'];
const COMMUNITY_CATS = ['Academic', 'Tech', 'Social', 'Sports', 'Cultural', 'Startup', 'Research', 'General'];
const COMMUNITY_ICONS = ['📚','💻','🚀','🎨','⚽','🎸','🔬','🌍','💼','🎭','🏆','🤝'];
const LOOKING_FOR_OPTIONS = ['Friends', 'Study Partner', 'Startup Co-Founder', 'Project Partner', 'Hackathon Team', 'Mentor', 'Mentee'];
const GROUP_TYPES = [
  { value: 'fun', label: 'Fun & Social', icon: '🎉' },
  { value: 'study', label: 'Study Group', icon: '📚' },
  { value: 'project', label: 'Project Team', icon: '🚀' },
  { value: 'branch', label: 'Branch Circle', icon: '🔧' },
  { value: 'batch', label: 'Batch Group', icon: '🎓' },
];

function inputCls(dark: boolean) {
  return `w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${
    dark ? 'bg-[#0a0a0e] border-white/10 text-slate-100 placeholder-slate-600' : 'bg-neutral-50 border-neutral-200 text-slate-900 placeholder-slate-400'
  }`;
}
function labelCls() { return 'block text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1'; }
function selectCls(dark: boolean) {
  return `w-full px-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all appearance-none ${
    dark ? 'bg-[#0a0a0e] border-white/10 text-slate-100' : 'bg-neutral-50 border-neutral-200 text-slate-900'
  }`;
}

export default function CreateModal({ onClose, currentUser, communities, darkMode, onPostCreated, onEventCreated, onProjectCreated, onCommunityCreated, onGroupCreated, onStoryCreated }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('post');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);
  const reelFileRef = useRef<HTMLInputElement>(null);

  const [postContent, setPostContent] = useState('');
  const [postTag, setPostTag] = useState(ACADEMIC_TAGS[0]);
  const [postFeeling, setPostFeeling] = useState('');
  const [postCommunity, setPostCommunity] = useState('');
  const [postProjectTitle, setPostProjectTitle] = useState('');
  const [postImage, setPostImage] = useState('');

  const [eventTitle, setEventTitle] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventCat, setEventCat] = useState('General');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventOnline, setEventOnline] = useState(false);
  const [eventLink, setEventLink] = useState('');
  const [eventSeats, setEventSeats] = useState('');

  const [projTitle, setProjTitle] = useState('');
  const [projDesc, setProjDesc] = useState('');
  const [projStage, setProjStage] = useState('Idea');
  const [projTags, setProjTags] = useState('');
  const [projLookingFor, setProjLookingFor] = useState<string[]>([]);

  const [commName, setCommName] = useState('');
  const [commDesc, setCommDesc] = useState('');
  const [commIcon, setCommIcon] = useState('📚');
  const [commCat, setCommCat] = useState('General');
  const [commTags, setCommTags] = useState('');

  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('fun');

  const [reelContent, setReelContent] = useState('');
  const [reelImage, setReelImage] = useState('');

  const dm = darkMode;

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => { setSuccess(''); onClose(); }, 1500);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setter(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;
    setSaving(true);
    try {
      const created = await api.posts.create({
        authorId: currentUser.id, content: postContent.trim(),
        academicTag: postTag, communityId: postCommunity || null,
        projectTitle: postProjectTitle || null, postImage: postImage || null,
        feeling: postFeeling || null,
      });
      onPostCreated(created);
      showSuccess('Post shared! 🎉');
    } catch { setSaving(false); }
  };

  const handleEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventDate.trim()) return;
    setSaving(true);
    try {
      const created = await api.events.create({
        title: eventTitle.trim(), description: eventDesc.trim(), category: eventCat,
        date: eventDate.trim(), time: eventTime.trim(), venue: eventVenue.trim(),
        organizer: currentUser.fullName, organizerId: currentUser.id,
        college: currentUser.college, maxSeats: eventSeats ? parseInt(eventSeats) : null,
        isOnline: eventOnline, link: eventLink.trim(),
      });
      onEventCreated(created);
      showSuccess('Event created! 📅');
    } catch { setSaving(false); }
  };

  const handleProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projTitle.trim()) return;
    setSaving(true);
    try {
      const created = await api.projects.create({
        title: projTitle.trim(), description: projDesc.trim(), stage: projStage,
        tags: projTags.split(',').map(t => t.trim()).filter(Boolean),
        lookingFor: projLookingFor, memberIds: [currentUser.id],
        creatorId: currentUser.id,
      });
      onProjectCreated(created);
      showSuccess('Project launched! 🚀');
    } catch { setSaving(false); }
  };

  const handleCommunity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commName.trim()) return;
    setSaving(true);
    try {
      const created = await api.communities.create({
        name: commName.trim(), description: commDesc.trim(), icon: commIcon,
        category: commCat, tags: commTags.split(',').map(t => t.trim()).filter(Boolean),
        creatorId: currentUser.id,
      });
      onCommunityCreated(created);
      showSuccess('Community created! 👥');
    } catch { setSaving(false); }
  };

  const handleGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      const created = await api.groupChats.create({
        name: groupName.trim(), type: groupType,
        creatorId: currentUser.id, college: currentUser.college,
        branch: currentUser.branch, memberIds: [currentUser.id],
      });
      onGroupCreated(created);
      showSuccess('Group created! 💬');
    } catch { setSaving(false); }
  };

  const handleReel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reelContent.trim() && !reelImage) return;
    setSaving(true);
    try {
      const created = await api.stories.create(currentUser.id, reelContent.trim(), reelImage || undefined);
      onStoryCreated(created);
      showSuccess('Reel posted! 🎬');
    } catch { setSaving(false); }
  };

  const tabColor: Record<Tab, string> = {
    post: 'from-indigo-500 to-violet-600',
    event: 'from-rose-500 to-pink-600',
    project: 'from-amber-500 to-orange-500',
    community: 'from-emerald-500 to-teal-600',
    group: 'from-sky-500 to-cyan-600',
    reel: 'from-pink-500 to-fuchsia-600',
  };

  const activeGrad = tabColor[activeTab];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`relative w-full max-w-xl rounded-3xl shadow-2xl border overflow-hidden flex flex-col max-h-[92vh] ${dm ? 'bg-[#0E0E12] border-white/10 text-slate-100' : 'bg-white border-neutral-200 text-slate-900'}`}>

        {/* Header */}
        <div className={`bg-gradient-to-r ${activeGrad} p-4 shrink-0`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-white/30 flex items-center justify-center text-xs font-bold bg-white/20">
                <Avatar avatar={currentUser.avatar} />
              </div>
              <div>
                <p className="text-white font-bold text-xs leading-none">{currentUser.fullName}</p>
                <p className="text-white/60 text-[9px] font-mono mt-0.5">{currentUser.college}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer border-0">
              <X size={14} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 overflow-x-auto no-scrollbar pb-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer border-0 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'bg-white/15 text-white hover:bg-white/25'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-3xl">
            <div className={`text-center p-6 rounded-2xl ${dm ? 'bg-[#121217]' : 'bg-white'} shadow-xl border ${dm ? 'border-white/10' : 'border-neutral-200'}`}>
              <div className="text-4xl mb-2">✅</div>
              <p className="font-bold text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">

          {/* ── POST ── */}
          {activeTab === 'post' && (
            <form id="form-create" onSubmit={handlePost} className="space-y-3">
              <div>
                <label className={labelCls()}>What are you building or looking for?</label>
                <textarea required rows={4} value={postContent} onChange={e => setPostContent(e.target.value)}
                  placeholder="Pitch your startup idea, find a study partner, share a research opportunity..."
                  className={`${inputCls(dm)} resize-none`} />
              </div>
              <div>
                <label className={labelCls()}>Tag</label>
                <div className="relative">
                  <select value={postTag} onChange={e => setPostTag(e.target.value)} className={selectCls(dm)}>
                    {ACADEMIC_TAGS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>
              <div>
                <label className={labelCls()}>Community (optional)</label>
                <div className="relative">
                  <select value={postCommunity} onChange={e => setPostCommunity(e.target.value)} className={selectCls(dm)}>
                    <option value="">No community</option>
                    {communities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>
              <div>
                <label className={labelCls()}>Project title (optional)</label>
                <input value={postProjectTitle} onChange={e => setPostProjectTitle(e.target.value)} placeholder="e.g. CampusAI" className={inputCls(dm)} />
              </div>
              <div>
                <label className={labelCls()}>Feeling</label>
                <div className="flex flex-wrap gap-1.5">
                  {FEELING_PRESETS.map(f => {
                    const val = `${f.emoji} ${f.label}`;
                    const sel = postFeeling === val;
                    return (
                      <button key={f.label} type="button" onClick={() => setPostFeeling(sel ? '' : val)}
                        className={`px-2.5 py-1 rounded-xl text-[10.5px] border cursor-pointer transition-all ${sel ? `bg-gradient-to-r ${activeGrad} border-transparent text-white font-bold` : dm ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-slate-50 border-neutral-200 text-slate-700'}`}>
                        {f.emoji} {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className={labelCls()}>Image (optional)</label>
                {postImage ? (
                  <div className="relative rounded-xl overflow-hidden h-28">
                    <img src={postImage} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPostImage('')} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white cursor-pointer border-0"><X size={12} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className={`w-full py-3 rounded-xl border-2 border-dashed text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${dm ? 'border-white/10 text-slate-500 hover:border-white/20' : 'border-neutral-200 text-slate-400 hover:border-neutral-300'}`}>
                    <ImageIcon size={14} /> Upload image
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setPostImage)} />
              </div>
            </form>
          )}

          {/* ── EVENT ── */}
          {activeTab === 'event' && (
            <form id="form-create" onSubmit={handleEvent} className="space-y-3">
              <div>
                <label className={labelCls()}>Event title *</label>
                <input required value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="e.g. NIT Trichy Hackathon 2026" className={inputCls(dm)} />
              </div>
              <div>
                <label className={labelCls()}>Description</label>
                <textarea rows={3} value={eventDesc} onChange={e => setEventDesc(e.target.value)} placeholder="What's this event about?" className={`${inputCls(dm)} resize-none`} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls()}>Category</label>
                  <div className="relative">
                    <select value={eventCat} onChange={e => setEventCat(e.target.value)} className={selectCls(dm)}>
                      {EVENT_CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
                <div>
                  <label className={labelCls()}>Max seats</label>
                  <input type="number" value={eventSeats} onChange={e => setEventSeats(e.target.value)} placeholder="Unlimited" className={inputCls(dm)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelCls()}>Date *</label>
                  <input required type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className={inputCls(dm)} />
                </div>
                <div>
                  <label className={labelCls()}>Time</label>
                  <input type="time" value={eventTime} onChange={e => setEventTime(e.target.value)} className={inputCls(dm)} />
                </div>
              </div>
              <div>
                <label className={labelCls()}>Mode</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEventOnline(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${!eventOnline ? `bg-gradient-to-r ${activeGrad} text-white border-transparent` : dm ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-neutral-200 text-slate-600'}`}>
                    <MapPin size={12} /> In-Person
                  </button>
                  <button type="button" onClick={() => setEventOnline(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer flex items-center justify-center gap-1.5 ${eventOnline ? `bg-gradient-to-r ${activeGrad} text-white border-transparent` : dm ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-neutral-200 text-slate-600'}`}>
                    <Globe size={12} /> Online
                  </button>
                </div>
              </div>
              {eventOnline ? (
                <div>
                  <label className={labelCls()}>Link</label>
                  <input value={eventLink} onChange={e => setEventLink(e.target.value)} placeholder="https://meet.google.com/..." className={inputCls(dm)} />
                </div>
              ) : (
                <div>
                  <label className={labelCls()}>Venue</label>
                  <input value={eventVenue} onChange={e => setEventVenue(e.target.value)} placeholder="e.g. Main Auditorium, NIT Trichy" className={inputCls(dm)} />
                </div>
              )}
            </form>
          )}

          {/* ── PROJECT ── */}
          {activeTab === 'project' && (
            <form id="form-create" onSubmit={handleProject} className="space-y-3">
              <div>
                <label className={labelCls()}>Project title *</label>
                <input required value={projTitle} onChange={e => setProjTitle(e.target.value)} placeholder="e.g. CampusAI, SmartAttend..." className={inputCls(dm)} />
              </div>
              <div>
                <label className={labelCls()}>Description</label>
                <textarea rows={3} value={projDesc} onChange={e => setProjDesc(e.target.value)} placeholder="What problem does it solve? Who's it for?" className={`${inputCls(dm)} resize-none`} />
              </div>
              <div>
                <label className={labelCls()}>Stage</label>
                <div className="flex flex-wrap gap-1.5">
                  {PROJECT_STAGES.map(s => (
                    <button key={s} type="button" onClick={() => setProjStage(s)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer transition-all ${projStage === s ? `bg-gradient-to-r ${activeGrad} text-white border-transparent` : dm ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-neutral-200 text-slate-600'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls()}>Tags (comma separated)</label>
                <input value={projTags} onChange={e => setProjTags(e.target.value)} placeholder="e.g. AI, React, Health Tech" className={inputCls(dm)} />
              </div>
              <div>
                <label className={labelCls()}>Looking for</label>
                <div className="flex flex-wrap gap-1.5">
                  {LOOKING_FOR_OPTIONS.map(opt => {
                    const sel = projLookingFor.includes(opt);
                    return (
                      <button key={opt} type="button"
                        onClick={() => setProjLookingFor(sel ? projLookingFor.filter(x => x !== opt) : [...projLookingFor, opt])}
                        className={`px-2.5 py-1 rounded-xl text-[10.5px] font-bold border cursor-pointer transition-all ${sel ? `bg-gradient-to-r ${activeGrad} text-white border-transparent` : dm ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-neutral-200 text-slate-600'}`}>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            </form>
          )}

          {/* ── COMMUNITY ── */}
          {activeTab === 'community' && (
            <form id="form-create" onSubmit={handleCommunity} className="space-y-3">
              <div>
                <label className={labelCls()}>Community name *</label>
                <input required value={commName} onChange={e => setCommName(e.target.value)} placeholder="e.g. NIT Trichy Startup Club" className={inputCls(dm)} />
              </div>
              <div>
                <label className={labelCls()}>Description</label>
                <textarea rows={3} value={commDesc} onChange={e => setCommDesc(e.target.value)} placeholder="What's this community about?" className={`${inputCls(dm)} resize-none`} />
              </div>
              <div>
                <label className={labelCls()}>Icon</label>
                <div className="flex flex-wrap gap-2">
                  {COMMUNITY_ICONS.map(icon => (
                    <button key={icon} type="button" onClick={() => setCommIcon(icon)}
                      className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center cursor-pointer border transition-all ${commIcon === icon ? 'border-indigo-500 bg-indigo-500/10 scale-110' : dm ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-neutral-200 bg-slate-50 hover:bg-slate-100'}`}>
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelCls()}>Category</label>
                <div className="relative">
                  <select value={commCat} onChange={e => setCommCat(e.target.value)} className={selectCls(dm)}>
                    {COMMUNITY_CATS.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                </div>
              </div>
              <div>
                <label className={labelCls()}>Tags (comma separated)</label>
                <input value={commTags} onChange={e => setCommTags(e.target.value)} placeholder="e.g. AI, Startups, NIT Trichy" className={inputCls(dm)} />
              </div>
            </form>
          )}

          {/* ── GROUP ── */}
          {activeTab === 'group' && (
            <form id="form-create" onSubmit={handleGroup} className="space-y-3">
              <div>
                <label className={labelCls()}>Group name *</label>
                <input required value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="e.g. EEE Study Squad, CS Hackers..." className={inputCls(dm)} />
              </div>
              <div>
                <label className={labelCls()}>Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {GROUP_TYPES.map(t => (
                    <button key={t.value} type="button" onClick={() => setGroupType(t.value)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-all text-left ${groupType === t.value ? `bg-gradient-to-r ${activeGrad} text-white border-transparent` : dm ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10' : 'bg-slate-50 border-neutral-200 text-slate-700 hover:bg-slate-100'}`}>
                      <span className="text-lg">{t.icon}</span>
                      <span className="text-xs font-bold">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className={`p-3 rounded-xl border text-xs ${dm ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-slate-50 border-neutral-200 text-slate-500'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Zap size={12} className="text-amber-400" />
                  <span className="font-bold text-[10px] uppercase tracking-wide">Auto-added</span>
                </div>
                You'll be added as admin. Your college: <span className="font-bold text-indigo-400">{currentUser.college}</span>
              </div>
            </form>
          )}

          {/* ── REEL ── */}
          {activeTab === 'reel' && (
            <form id="form-create" onSubmit={handleReel} className="space-y-3">
              <div className={`p-3 rounded-xl border text-[10px] font-mono ${dm ? 'border-pink-500/20 bg-pink-500/5 text-pink-400' : 'border-pink-200 bg-pink-50 text-pink-600'}`}>
                ✨ Reels are 24-hour stories visible to your campus network
              </div>
              <div>
                <label className={labelCls()}>Caption</label>
                <textarea rows={3} value={reelContent} onChange={e => setReelContent(e.target.value)}
                  placeholder="Share a moment, achievement, or thought..."
                  className={`${inputCls(dm)} resize-none`} />
              </div>
              <div>
                <label className={labelCls()}>Image / Clip</label>
                {reelImage ? (
                  <div className="relative rounded-xl overflow-hidden h-40">
                    <img src={reelImage} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setReelImage('')} className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white cursor-pointer border-0"><X size={12} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => reelFileRef.current?.click()}
                    className={`w-full py-8 rounded-xl border-2 border-dashed text-xs flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${dm ? 'border-white/10 text-slate-500 hover:border-white/20' : 'border-neutral-200 text-slate-400 hover:border-neutral-300'}`}>
                    <Video size={24} className="text-pink-400" />
                    <span>Upload image for your reel</span>
                    <span className="text-[10px] opacity-60">PNG, JPG supported</span>
                  </button>
                )}
                <input ref={reelFileRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, setReelImage)} />
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className={`shrink-0 flex items-center justify-between gap-3 px-4 py-3 border-t ${dm ? 'border-white/10 bg-[#0E0E12]' : 'border-neutral-200 bg-white'}`}>
          <button type="button" onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all ${dm ? 'border-white/10 text-slate-400 hover:bg-white/5' : 'border-neutral-200 text-slate-500 hover:bg-slate-50'}`}>
            Cancel
          </button>
          <button
            type="submit"
            form="form-create"
            disabled={saving}
            className={`px-5 py-2 rounded-xl text-xs font-extrabold uppercase tracking-wider text-white bg-gradient-to-r ${activeGrad} hover:opacity-90 active:scale-[0.98] transition-all shadow-sm cursor-pointer border-0 flex items-center gap-1.5 disabled:opacity-60`}>
            {saving ? (
              <span className="flex items-center gap-1.5"><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</span>
            ) : (
              <><Send size={12} /> {TABS.find(t => t.id === activeTab)?.label === 'Post' ? 'Share Post' : `Create ${TABS.find(t => t.id === activeTab)?.label}`}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
