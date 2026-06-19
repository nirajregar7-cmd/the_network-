import React, { useState } from 'react';
import { UserProfile } from '../types';
import { ShieldCheck, Eye, EyeOff, Mail, Key, Sparkles, Plus, Check, Save, Image as ImageIcon } from 'lucide-react';
import CollegeSelector from './CollegeSelector';
import Avatar from './Avatar';

interface ProfileSectionProps {
  currentUser: UserProfile;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  darkMode: boolean;
}

export default function ProfileSection({
  currentUser,
  onUpdateProfile,
  darkMode
}: ProfileSectionProps) {
  // Local profile state
  const [fullName, setFullName] = useState(currentUser.fullName);
  const [aboutMe, setAboutMe] = useState(currentUser.aboutMe);
  const [college, setCollege] = useState(currentUser.college);
  const [branch, setBranch] = useState(currentUser.branch);
  const [year, setYear] = useState(currentUser.year);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  
  const [selectedInterests, setSelectedInterests] = useState<string[]>(currentUser.interests);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(currentUser.skills);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(currentUser.lookingFor);

  // Privacy preferences
  const [showEmail, setShowEmail] = useState(currentUser.privacySettings.showEmail);
  const [onlyVerified, setOnlyVerified] = useState(currentUser.privacySettings.onlyAllowVerifiedConnections);
  const [hideProfile, setHideProfile] = useState(currentUser.privacySettings.hideProfileFromSearch);

  // Custom visual notify flag (to avoid alert popups)
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Dynamic Profile Strength Calculation
  const scoreInterestsCount = Math.min(3, selectedInterests.length);
  const scoreSkillsCount = Math.min(3, selectedSkills.length);
  const scoreLookingForCount = Math.min(2, selectedLookingFor.length);

  const calculateStrength = () => {
    let score = 0;
    if (fullName.trim()) score += 10;
    if (college.trim()) score += 10;
    if (branch.trim()) score += 10;
    if (year > 0) score += 10;
    
    if (aboutMe.trim().length >= 20) {
      score += 20;
    } else if (aboutMe.trim()) {
      score += 10;
    }
    
    score += scoreInterestsCount * 5;
    score += scoreSkillsCount * 5;
    score += scoreLookingForCount * 5;
    
    return score;
  };

  const strength = calculateStrength();

  const getStrengthLabel = (val: number) => {
    if (val < 40) return { text: 'SPECTATOR / INCOMPLETE', color: 'text-rose-500 bg-rose-500/10 border-rose-500/20', barBg: 'bg-rose-500' };
    if (val < 80) return { text: 'COMPETENT / FILLING OUT', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', barBg: 'bg-amber-500' };
    return { text: 'OPTIMIZED / ELITE', color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', barBg: 'bg-gradient-to-r from-indigo-500 to-emerald-500' };
  };

  const strengthMeta = getStrengthLabel(strength);

  const UNIQUE_INTERESTS = [
    'Startups', 'AI/ML', 'Coding', 'Design', 'Finance', 'Entrepreneurship', 'Research', 'Higher Studies', 'Placement Preparation', 'Sports', 'Music', 'Gaming', 'Photography'
  ];

  const UNIQUE_SKILLS = [
    'React', 'Python', 'UI/UX', 'Marketing', 'Video Editing', 'C++', 'Data Structures', 'PyTorch', 'Figma', 'Embedded Systems', 'SQL', 'Algorithms'
  ];

  const UNIQUE_LOOKING_FOR = [
    'Friends', 'Study Partner', 'Startup Co-Founder', 'Hackathon Team', 'Mentor', 'Career Guidance', 'Research Collaborator', 'Project Partner'
  ];

  const handleInterestToggle = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSkillToggle = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleLookingForToggle = (opt: string) => {
    setSelectedLookingFor(prev =>
      prev.includes(opt) ? prev.filter(l => l !== opt) : [...prev, opt]
    );
  };

  const saveProfileData = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedUser: UserProfile = {
      ...currentUser,
      fullName,
      aboutMe,
      college,
      branch,
      year,
      avatar, // save custom profile picture/avatar
      interests: selectedInterests,
      skills: selectedSkills,
      lookingFor: selectedLookingFor,
      privacySettings: {
        showEmail,
        onlyAllowVerifiedConnections: onlyVerified,
        hideProfileFromSearch: hideProfile
      }
    };
    onUpdateProfile(parsedUser);
    setShowSuccessToast(true);
    setTimeout(() => {
      setShowSuccessToast(false);
    }, 4000);
  };

  return (
    <form onSubmit={saveProfileData} className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
      
      {/* Toast Notifier */}
      {showSuccessToast && (
        <div className="col-span-full p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs font-semibold shadow-xs animate-none">
          <Sparkles size={14} className="text-emerald-500 animate-spin" />
          <span>Success! Your academic coordinates was cataloged and saved inside the Institutional ledger.</span>
        </div>
      )}

      {/* Left Column: Ident & Settings */}
      <div className="space-y-6 lg:col-span-1">
        
         {/* Bio Card summary */}
        <div className={`p-6 rounded-2xl border border-neutral-200 dark:border-white/10 shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <div className="text-center space-y-3">
            {/* Custom Interactive Avatar Uploader */}
            <div className="relative group mx-auto w-20 h-20">
              <div className="p-[2.5px] rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-indigo-600 w-full h-full">
                <div className={`w-full h-full rounded-full border-2 border-white dark:border-[#121217] flex items-center justify-center font-bold text-lg overflow-hidden ${darkMode ? 'bg-zinc-900 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  <Avatar avatar={avatar} />
                </div>
              </div>
              <label 
                htmlFor="profile-avatar-file" 
                className="absolute inset-[2px] bg-black/70 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white text-[8px] font-bold"
                title="Upload Photo File"
              >
                <ImageIcon size={14} className="mb-0.5 text-indigo-400" />
                <span>Upload Photo</span>
              </label>
              <input
                id="profile-avatar-file"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 8 * 1024 * 1024) {
                      alert('This photo is larger than 8MB. Please use a smaller visual file.');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setAvatar(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            {/* Manual Text Avatar / URL control fallback */}
            <div className="pt-1.5 px-3">
              <label className="block text-[7.5px] font-extrabold uppercase tracking-widest text-[#8F8F9F] mb-1">
                Customize Photo URL or Emoji
              </label>
              <input
                id="txt-manual-avatar"
                type="text"
                value={avatar.startsWith('data:image/') ? '[Custom visual photo file uploaded]' : avatar}
                onChange={(e) => {
                  const text = e.target.value;
                  if (text !== '[Custom visual photo file uploaded]') {
                    setAvatar(text);
                  }
                }}
                placeholder="e.g. 👨‍💻, 🚀 or Unsplash Visual URL"
                className={`w-full px-2.5 py-1 text-[9.5px] border rounded-lg text-center font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-zinc-950/80 text-white border-white/10' : 'bg-neutral-50 border-neutral-200 text-slate-800'}`}
              />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xs flex items-center justify-center gap-1.5 font-sans">
                <span>{fullName}</span>
                {currentUser.isVerified && (
                  <span className="py-0.5 px-2 rounded-full text-[8px] font-mono font-bold uppercase bg-indigo-500/10 text-indigo-550 dark:bg-indigo-500/20 dark:text-indigo-400">
                    VERIFIED
                  </span>
                )}
              </h3>
              <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                {currentUser.email}
              </p>
            </div>
          </div>

          {/* Profile Strength Indicator Bar */}
          <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-white/5 text-left space-y-2">
            <div className="flex justify-between items-center text-[10px] font-mono font-bold uppercase tracking-wider">
              <span className="text-slate-450">Profile Setup Index</span>
              <span className="text-indigo-500 font-extrabold">{strength}%</span>
            </div>
            
            <div className="w-full h-2.5 bg-neutral-150 dark:bg-zinc-800/65 rounded-full overflow-hidden">
              <div 
                className={`h-full ${strengthMeta.barBg} transition-all duration-500 rounded-full`}
                style={{ width: `${strength}%` }}
              />
            </div>
            
            <div className="text-[9.5px] font-mono uppercase tracking-tight text-slate-400 space-y-2">
              <div className={`p-1 px-2.5 rounded-lg border text-[8px] font-bold text-center mt-3 ${strengthMeta.color}`}>
                Rank: {strengthMeta.text}
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] pt-1">
                <div className="flex items-center gap-1.5">
                  <span className={aboutMe.trim().length >= 20 ? "text-emerald-500 font-bold" : "text-neutral-400"}>
                    {aboutMe.trim().length >= 20 ? '●' : '○'}
                  </span>
                  <span>Bio ({aboutMe.trim().length}/20)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={selectedInterests.length >= 3 ? "text-emerald-500 font-bold" : "text-neutral-400"}>
                    {selectedInterests.length >= 3 ? '●' : '○'}
                  </span>
                  <span>Interests ({selectedInterests.length}/3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={selectedSkills.length >= 3 ? "text-emerald-500 font-bold" : "text-neutral-400"}>
                    {selectedSkills.length >= 3 ? '●' : '○'}
                  </span>
                  <span>Skills ({selectedSkills.length}/3)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={selectedLookingFor.length >= 2 ? "text-emerald-500 font-bold" : "text-neutral-400"}>
                    {selectedLookingFor.length >= 2 ? '●' : '○'}
                  </span>
                  <span>Goals ({selectedLookingFor.length}/2)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-white/5 text-xs space-y-3.5">
            <div>
              <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-450 mb-1">Full Name</label>
              <input
                id="profile-fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
              />
            </div>

            <div>
              <CollegeSelector
                id="profile-college"
                value={college}
                onChange={setCollege}
                darkMode={darkMode}
                label="University / College Seat"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-450 mb-1">Department</label>
                <input
                   id="profile-branch"
                   type="text"
                   required
                   value={branch}
                   onChange={(e) => setBranch(e.target.value)}
                   className={`w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                />
              </div>

              <div>
                <label className="block text-[8px] font-bold uppercase tracking-wider text-slate-450 mb-1">Study Year</label>
                <select
                  id="profile-year"
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={`w-full px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none cursor-pointer ${darkMode ? 'bg-[#09090C] text-slate-350' : 'bg-white text-slate-800'}`}
                >
                  <option value={1}>1st Yr (Fr)</option>
                  <option value={2}>2nd Yr (So)</option>
                  <option value={3}>3rd Yr (Jr)</option>
                  <option value={4}>4th Yr (Sr)</option>
                  <option value={5}>Postgrad / Fellow</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Directory Privacy Settings Block */}
        <div className={`p-6 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
            Privacy Preferences
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="font-bold tracking-tight text-[11px] text-slate-800 dark:text-slate-100">Expose University Email</h4>
                <p className="text-[10px] text-slate-450 leading-relaxed">
                  Allow verified matches to view your academic email coordinates.
                </p>
              </div>
              <input
                id="toggle-show-email"
                type="checkbox"
                checked={showEmail}
                onChange={(e) => setShowEmail(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 border-neutral-300 focus:ring-0 cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="font-bold tracking-tight text-[11px] text-slate-800 dark:text-slate-100">Strict Connection Filter</h4>
                <p className="text-[10px] text-slate-450 leading-relaxed">
                  Restrict outreach so you only receive matches from verified campus seats.
                </p>
              </div>
              <input
                id="toggle-only-verified"
                type="checkbox"
                checked={onlyVerified}
                onChange={(e) => setOnlyVerified(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 border-neutral-300 focus:ring-0 cursor-pointer shrink-0"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="font-bold tracking-tight text-[11px] text-slate-800 dark:text-slate-100">Go Stealth / Incognito</h4>
                <p className="text-[10px] text-slate-450 leading-relaxed">
                  Hide your student card profile from the discovery search engine completely.
                </p>
              </div>
              <input
                id="toggle-hide-profile"
                type="checkbox"
                checked={hideProfile}
                onChange={(e) => setHideProfile(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-500 border-neutral-300 focus:ring-0 cursor-pointer shrink-0"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Bio Details, Interests, Skills, Looking For multi selectors */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Profile Bio details */}
        <div className={`p-6 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-3.5 shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-300">
            Institutional Bio
          </h3>
          <textarea
            id="profile-aboutMe"
            rows={4}
            required
            placeholder="Share info on what you’re currently working on, startup plans, study target courses, or internship preparation..."
            value={aboutMe}
            onChange={(e) => setAboutMe(e.target.value)}
            className={`w-full p-4 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none resize-none ${darkMode ? 'bg-[#09090C] text-slate-100' : 'bg-neutral-50 text-slate-850'}`}
          />
        </div>

        {/* Interests selection */}
        <div className={`p-6 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <div className="flex items-center justify-between border-b border-dashed border-neutral-150 dark:border-white/5 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider">Academic & Social Interests</h3>
            <span className="text-[9px] font-mono text-slate-400">[Target tags]</span>
          </div>
          
          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {UNIQUE_INTERESTS.map(interest => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  id={`tag-interest-${interest}`}
                  key={interest}
                  type="button"
                  onClick={() => handleInterestToggle(interest)}
                  className={`py-1 px-3.5 rounded-full border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${active ? 'bg-indigo-500 text-white border-transparent shadow-xs' : 'bg-transparent border-neutral-200 dark:border-white/10 hover:border-indigo-500 text-slate-550 dark:text-slate-400'}`}
                >
                  {interest}
                  {active && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Technical or hard skills */}
        <div className={`p-6 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <div className="flex items-center justify-between border-b border-dashed border-neutral-150 dark:border-white/5 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider">Hard Skills & Focus Fields</h3>
            <span className="text-[9px] font-mono text-slate-400">[Pick skills]</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {UNIQUE_SKILLS.map(skill => {
              const active = selectedSkills.includes(skill);
              return (
                <button
                  id={`tag-skill-${skill}`}
                  key={skill}
                  type="button"
                  onClick={() => handleSkillToggle(skill)}
                  className={`py-1 px-3.5 rounded-full border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${active ? 'bg-indigo-500 text-white border-transparent shadow-xs' : 'bg-transparent border-neutral-200 dark:border-white/10 hover:border-indigo-500 text-slate-550 dark:text-slate-400'}`}
                >
                  {skill}
                  {active && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Looking For checks */}
        <div className={`p-6 rounded-2xl border border-neutral-200 dark:border-white/10 space-y-4 shadow-sm ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
          <div className="flex items-center justify-between border-b border-dashed border-neutral-150 dark:border-white/5 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider">Campus Collaborations Sought</h3>
            <span className="text-[9px] font-mono text-slate-400">[Goals]</span>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 text-xs">
            {UNIQUE_LOOKING_FOR.map(opt => {
              const active = selectedLookingFor.includes(opt);
              return (
                <button
                  id={`tag-lf-${opt}`}
                  key={opt}
                  type="button"
                  onClick={() => handleLookingForToggle(opt)}
                  className={`py-1 px-3.5 rounded-full border text-xs font-semibold cursor-pointer transition-all flex items-center gap-1.5 ${active ? 'bg-emerald-500 text-white border-transparent shadow-xs' : 'bg-transparent border-neutral-200 dark:border-white/10 hover:border-[#10B981] text-slate-550 dark:text-slate-400'}`}
                >
                  {opt}
                  {active && <Check size={11} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Submit Save Bar */}
        <div className="flex justify-end pt-2">
          <button
            id="btn-save-profile"
            type="submit"
            className="py-2.5 px-6 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold uppercase text-[10px] tracking-wider cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save size={13} /> Update Campus Profile
          </button>
        </div>

      </div>

    </form>
  );
}
