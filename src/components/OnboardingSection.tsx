import React, { useState } from 'react';
import { UserProfile } from '../types';
import { GraduationCap, ArrowRight, Check, Sparkles, Target, Zap, Users } from 'lucide-react';

interface OnboardingSectionProps {
  user: UserProfile;
  onComplete: (updates: Partial<UserProfile>) => Promise<void>;
  darkMode: boolean;
}

const INTERESTS = [
  'Startups', 'AI/ML', 'Coding', 'Design', 'Finance', 'Entrepreneurship',
  'Research', 'Higher Studies', 'Placement Preparation', 'Sports', 'Music',
  'Gaming', 'Photography'
];

const SKILLS = [
  'React', 'Python', 'UI/UX', 'Marketing', 'Video Editing', 'C++',
  'Data Structures', 'PyTorch', 'Figma', 'Embedded Systems', 'SQL', 'Algorithms'
];

const LOOKING_FOR = [
  'Friends', 'Study Partner', 'Startup Co-Founder', 'Hackathon Team',
  'Mentor', 'Career Guidance', 'Research Collaborator', 'Project Partner'
];

const STEPS = [
  { id: 'bio',       label: 'About You',  icon: Sparkles, color: 'text-indigo-500' },
  { id: 'interests', label: 'Interests',  icon: Zap,      color: 'text-amber-500'  },
  { id: 'skills',    label: 'Skills',     icon: Target,   color: 'text-emerald-500'},
  { id: 'goals',     label: 'Goals',      icon: Users,    color: 'text-purple-500' },
];

export default function OnboardingSection({ user, onComplete, darkMode }: OnboardingSectionProps) {
  const [step, setStep] = useState(0);
  const [aboutMe, setAboutMe] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggle = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter(x => x !== item) : [...list, item]);
  };

  const canContinue = () => {
    if (step === 0) return aboutMe.trim().length >= 10;
    if (step === 1) return selectedInterests.length >= 1;
    if (step === 2) return selectedSkills.length >= 1;
    if (step === 3) return selectedLookingFor.length >= 1;
    return false;
  };

  const handleNext = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    setLoading(true); setError('');
    try {
      await onComplete({ aboutMe, interests: selectedInterests, skills: selectedSkills, lookingFor: selectedLookingFor });
    } catch (err: any) {
      setError(err.message || 'Failed to save. Please try again.');
      setLoading(false);
    }
  };

  const bg = darkMode ? 'bg-[#09090C]' : 'bg-neutral-50';
  const card = `w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-white/10 shadow-md ${darkMode ? 'bg-[#121217]' : 'bg-white'}`;
  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer select-none transition-all border ${
      active
        ? 'bg-indigo-500 text-white border-indigo-500 shadow-sm'
        : darkMode
        ? 'bg-white/5 text-slate-300 border-white/10 hover:border-indigo-400 hover:text-indigo-300'
        : 'bg-white text-slate-600 border-neutral-200 hover:border-indigo-400 hover:text-indigo-600'
    }`;

  const firstName = user.fullName.split(' ')[0];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bg} ${darkMode ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className={card}>

        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-t-2xl px-8 py-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <GraduationCap size={18} />
            </div>
            <span className="text-xs font-extrabold tracking-widest uppercase opacity-80">The Network — Onboarding</span>
          </div>
          {step === 0 && (
            <>
              <h1 className="text-xl font-extrabold mt-1">Welcome, {firstName}! 👋</h1>
              <p className="text-sm opacity-75 mt-1">Let's set up your profile so others can find and connect with you.</p>
            </>
          )}
          {step === 1 && <h1 className="text-xl font-extrabold mt-1">What are you into?</h1>}
          {step === 2 && <h1 className="text-xl font-extrabold mt-1">What are your skills?</h1>}
          {step === 3 && <h1 className="text-xl font-extrabold mt-1">What are you looking for?</h1>}

          {/* Step dots */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((s, i) => (
              <div
                key={s.id}
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? 'bg-white' : 'bg-white/30'
                } ${i === step ? 'flex-[2]' : 'flex-1'}`}
              />
            ))}
          </div>
          <p className="text-[10px] opacity-60 mt-1.5">Step {step + 1} of {STEPS.length}</p>
        </div>

        <div className="p-8 space-y-5">

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs text-center font-semibold">
              {error}
            </div>
          )}

          {/* Step 0 — Bio */}
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 mb-2">
                  Institutional Bio <span className="text-indigo-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Share what you're currently working on, startup plans, study goals, internship prep..."
                  value={aboutMe}
                  onChange={e => setAboutMe(e.target.value)}
                  className={`w-full p-3 text-sm rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none ${
                    darkMode
                      ? 'bg-[#09090C] border-white/10 text-white placeholder:text-slate-600'
                      : 'bg-white border-neutral-200 text-slate-800 placeholder:text-slate-400'
                  }`}
                />
                <p className={`text-[10px] mt-1 ${aboutMe.trim().length >= 10 ? 'text-emerald-500' : 'text-slate-400'}`}>
                  {aboutMe.trim().length}/10 minimum characters
                </p>
              </div>
            </div>
          )}

          {/* Step 1 — Interests */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Pick at least 1 that describes you. Others will use this to find you.</p>
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(selectedInterests, setSelectedInterests, item)}
                    className={chip(selectedInterests.includes(item))}
                  >
                    {selectedInterests.includes(item) && <Check size={11} className="inline mr-1" />}
                    {item}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">{selectedInterests.length} selected</p>
            </div>
          )}

          {/* Step 2 — Skills */}
          {step === 2 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">Pick the skills you have or are learning. This helps teammates find you.</p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(selectedSkills, setSelectedSkills, item)}
                    className={chip(selectedSkills.includes(item))}
                  >
                    {selectedSkills.includes(item) && <Check size={11} className="inline mr-1" />}
                    {item}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">{selectedSkills.length} selected</p>
            </div>
          )}

          {/* Step 3 — Looking For */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">What kind of connections are you looking for on The Network?</p>
              <div className="flex flex-wrap gap-2">
                {LOOKING_FOR.map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggle(selectedLookingFor, setSelectedLookingFor, item)}
                    className={chip(selectedLookingFor.includes(item))}
                  >
                    {selectedLookingFor.includes(item) && <Check size={11} className="inline mr-1" />}
                    {item}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">{selectedLookingFor.length} selected</p>
            </div>
          )}

          {/* Nav buttons */}
          <div className="flex items-center gap-3 pt-2">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  darkMode
                    ? 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    : 'border-neutral-200 text-slate-500 hover:text-slate-800 hover:border-neutral-300'
                }`}
              >
                ← Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canContinue() || loading}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
              ) : step === STEPS.length - 1 ? (
                <><Check size={14} /> Complete Profile</>
              ) : (
                <>Continue <ArrowRight size={14} /></>
              )}
            </button>
          </div>

          {!canContinue() && !loading && (
            <p className="text-center text-[10px] text-slate-400">
              {step === 0 ? 'Write at least 10 characters to continue.' :
               step === 1 ? 'Pick at least 1 interest.' :
               step === 2 ? 'Pick at least 1 skill.' :
               'Pick at least 1 goal.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
