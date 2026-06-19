import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Mail, Shield, Building, Award, Key, User, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import CollegeSelector from './CollegeSelector';

interface AuthSectionProps {
  onLogin: (user: UserProfile) => void;
  allUsers: UserProfile[];
  onRegister: (newUser: UserProfile) => void;
  darkMode: boolean;
}

export default function AuthSection({ onLogin, allUsers, onRegister, darkMode }: AuthSectionProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [year, setYear] = useState(1);
  const [error, setError] = useState('');
  
  // Verification simulation state
  const [verificationStep, setVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [tempUser, setTempUser] = useState<UserProfile | null>(null);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }

    // Special check for mock admin account or any existing users
    const matchedUser = allUsers.find(
      u => u.email.toLowerCase() === email.toLowerCase() && !u.isSuspended
    );

    if (matchedUser) {
      onLogin(matchedUser);
    } else {
      // Create a temporary fast validation for demo smoothness
      const mockNewStudent: UserProfile = {
        id: `user-${Date.now()}`,
        fullName: email.split('@')[0].replace('.', ' '),
        college: 'Stanford University',
        branch: 'Informatics',
        year: 3,
        email: email,
        avatar: email.substring(0, 2).toUpperCase(),
        aboutMe: 'Active student connector here on The Network. Excited to start collaborating!',
        interests: ['Coding', 'AI/ML', 'Startups'],
        skills: ['React', 'Python', 'UI/UX'],
        lookingFor: ['Study Partner', 'Friends'],
        isVerified: email.endsWith('.edu') || email.endsWith('.ac.in') || email.includes('college') || email.includes('.in'),
        isSuspended: false,
        role: 'student',
        privacySettings: {
          showEmail: true,
          onlyAllowVerifiedConnections: false,
          hideProfileFromSearch: false
        },
        createdAt: new Date().toISOString()
      };
      onLogin(mockNewStudent);
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || !fullName || !college) {
      setError('All fields are mandatory.');
      return;
    }

    // Academic domain check
    const isAcademic = email.endsWith('.edu') || email.endsWith('.ac.in') || email.includes('.edu.') || email.endsWith('.edu.in');
    
    // We strictly enforce future-ready academic domain formats
    if (!isAcademic) {
      setError('For trust and academic security, register with a valid university email (e.g., .edu, .ac.in).');
      return;
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}`,
      fullName,
      college,
      branch,
      year: Number(year),
      email,
      avatar: fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'ST',
      aboutMe: 'I am a collaborative student interested in research, peer learning, and networking.',
      interests: ['Coding', 'Placement Preparation'],
      skills: ['Figma', 'Python'],
      lookingFor: ['Friends', 'Study Partner'],
      isVerified: false, // will become true after verification code match
      isSuspended: false,
      role: 'student',
      privacySettings: {
        showEmail: true,
        onlyAllowVerifiedConnections: false,
        hideProfileFromSearch: false
      },
      createdAt: new Date().toISOString()
    };

    // Generate a random 4-digit code for physical academic confirmation
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setVerificationCode(code);
    setTempUser(newUser);
    setVerificationStep(true);
  };

  const verifyCodeAndProceed = () => {
    if (enteredCode === verificationCode || enteredCode === '1234') {
      if (tempUser) {
        const verifiedUser = { ...tempUser, isVerified: true };
        onRegister(verifiedUser);
        onLogin(verifiedUser);
      }
    } else {
      setError('Incorrect verification token. Try again.');
    }
  };

  // Quick helper to auto-populate email inputs for rapid testing
  const selectQuickAdmin = () => {
    setEmail('sarah.lin@stanford.edu');
    setPassword('admin123');
    setIsLogin(true);
  };

  const selectQuickStudent = () => {
    setEmail('aravind.nair@cse.iitd.ac.in');
    setPassword('student123');
    setIsLogin(true);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-200 ${darkMode ? 'bg-[#09090C] text-[#F9F7F2]' : 'bg-neutral-50 text-[#1A1A1A]'}`}>
      <div id="auth-card" className={`w-full max-w-md rounded-2xl border border-neutral-250 dark:border-white/10 p-8 shadow-md transition-all ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
        
        {/* Branding header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-xs">
            <GraduationCap size={22} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase font-sans text-indigo-500">The Network</h1>
          <p className="text-xs mt-1.5 max-w-xs mx-auto text-slate-455">
            The premium verified student collaboration social ledger. Match co-founders, study partners and academic hubs with full trust.
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10.5px] text-center font-semibold font-mono uppercase tracking-wide">
            {error}
          </div>
        )}

        {!verificationStep ? (
          <>
            {/* Tabs */}
            <div className={`flex rounded-xl p-1 mb-6 text-xs font-bold uppercase tracking-wider border border-neutral-200 dark:border-white/5 ${darkMode ? 'bg-[#09090C]' : 'bg-neutral-100'}`}>
              <button
                id="btn-tab-login"
                onClick={() => { setIsLogin(true); setError(''); }}
                className={`py-2 flex-1 rounded-lg text-center transition-all cursor-pointer ${isLogin ? 'bg-indigo-500 text-white shadow-xs' : 'opacity-40 hover:opacity-100 text-slate-400'}`}
              >
                Sign In
              </button>
              <button
                id="btn-tab-signup"
                onClick={() => { setIsLogin(false); setError(''); }}
                className={`py-2 flex-1 rounded-lg text-center transition-all cursor-pointer ${!isLogin ? 'bg-indigo-500 text-white shadow-xs' : 'opacity-40 hover:opacity-100 text-slate-400'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={isLogin ? handleLoginSubmit : handleRegisterSubmit} className="space-y-4 font-sans text-left">
              
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450 mb-1">Full Name</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <User size={15} />
                      </span>
                      <input
                        id="auth-fullName"
                        type="text"
                        required
                        placeholder="Elena Rostova"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                      />
                    </div>
                  </div>

                  <div>
                    <CollegeSelector
                      id="auth-college"
                      value={college}
                      onChange={setCollege}
                      darkMode={darkMode}
                      label="University / College"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450 mb-1">Study Year</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                          <Award size={14} />
                        </span>
                        <select
                          id="auth-year"
                          value={year}
                          onChange={(e) => setYear(Number(e.target.value))}
                          className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none cursor-pointer ${darkMode ? 'bg-[#09090C] text-slate-350' : 'bg-[#FFF] text-slate-805'}`}
                        >
                          <option value={1}>1st Yr (Fr)</option>
                          <option value={2}>2nd Yr (So)</option>
                          <option value={3}>3rd Yr (Jr)</option>
                          <option value={4}>4th Yr (Sr)</option>
                          <option value={5}>Postgrad</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450 mb-1">Department</label>
                      <select
                        id="auth-branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className={`w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none cursor-pointer ${darkMode ? 'bg-[#09090C] text-slate-350' : 'bg-[#FFF] text-slate-805'}`}
                      >
                        <option value="Computer Science">Comp. Science</option>
                        <option value="Electrical Engineering">Electrical Eng.</option>
                        <option value="Electronics & Instrumentation">Electronics</option>
                        <option value="Mechanical Engineering">Mechanical Eng.</option>
                        <option value="Biotechnology">Biotech</option>
                        <option value="Cognitive Science">Cognitive Sci.</option>
                        <option value="Physics">Physics</option>
                        <option value="Informatics">Informatics</option>
                        <option value="Business Management">Business Mgmt</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450 mb-1">University Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={15} />
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder={isLogin ? "aravind@cse.iitd.ac.in" : "student@university.edu"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                  />
                </div>
                {!isLogin && (
                  <p className="text-[9px] mt-1 text-indigo-550 leading-relaxed font-semibold">
                    * Strict Rule: Use a valid university email (e.g. .edu, .ac.in) for validation ledger matching.
                  </p>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450">Password</label>
                  {isLogin && <span className="text-[10px] text-indigo-500 underline cursor-pointer">Forgot?</span>}
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Key size={15} />
                  </span>
                  <input
                    id="auth-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                  />
                </div>
              </div>

              <button
                id="btn-auth-submit"
                type="submit"
                className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-transparent"
              >
                <span>{isLogin ? 'Authenticate Peer Identity' : 'Provision Student Key'}</span>
                <ArrowRight size={14} />
              </button>
            </form>

            <div className="mt-8 pt-4 border-t border-dashed border-neutral-200 dark:border-white/5 text-center">
              <span className="text-[8px] uppercase font-mono tracking-widest text-slate-400">
                Demo Quick Accounts
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  id="btn-quick-student"
                  onClick={selectQuickStudent}
                  className={`text-[10px] uppercase font-semibold py-2 px-3 rounded-xl border transition-colors cursor-pointer text-center ${darkMode ? 'bg-[#09090C] border-white/5 hover:bg-zinc-805 text-slate-300' : 'bg-white border-neutral-200 hover:bg-neutral-50 text-slate-700'}`}
                >
                  Student (Aravind - IIT)
                </button>
                <button
                  id="btn-quick-admin"
                  onClick={selectQuickAdmin}
                  className={`text-[10px] uppercase font-semibold py-2 px-3 rounded-xl border transition-colors cursor-pointer text-center ${darkMode ? 'bg-[#09090C] border-white/5 hover:bg-zinc-805 text-slate-300' : 'bg-white border-neutral-200 hover:bg-neutral-50 text-slate-700'}`}
                >
                  Admin (Prof. Sarah)
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-5 text-left">
            <div className="p-4 rounded-xl border border-indigo-500/25 flex items-start gap-3 bg-indigo-500/[0.03]">
              <Shield className="text-indigo-500 shrink-0 mt-0.5" size={18} />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1">Ledger Confirmation</h3>
                <p className="text-[11px] leading-relaxed text-slate-450">
                  We dispatched an institutional 4-digit ledger security code to <strong className="font-bold underline">{tempUser?.email}</strong>. Entering this code simulatedly checks university verification portals.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450 mb-1.5 text-center">Enter 4-Digit Ledger Code</label>
              <input
                id="auth-verification-code"
                type="text"
                maxLength={4}
                required
                placeholder="8492"
                value={enteredCode}
                onChange={(e) => setEnteredCode(e.target.value)}
                className={`w-full py-2.5 text-center text-xl tracking-widest font-mono rounded-xl border-2 border-indigo-500 focus:outline-none focus:ring-0 ${darkMode ? 'bg-[#09090C] text-[#F9F7F2]' : 'bg-[#FFF] text-[#1A1A1A]'}`}
              />
              <p className="text-[10px] text-center mt-2.5 font-mono text-slate-400">
                Simulating network transmission code: <span className="font-bold underline text-indigo-500">{verificationCode}</span> (or enter <span className="font-bold text-indigo-500">1234</span>)
              </p>
            </div>

            <button
              id="btn-auth-verify"
              onClick={verifyCodeAndProceed}
              className="w-full mt-2 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-xs uppercase tracking-wider transition-colors cursor-pointer text-center shadow-sm"
            >
              Verify institutional alignment
            </button>

            <button
              id="btn-auth-cancel-verify"
              onClick={() => { setVerificationStep(false); setTempUser(null); setError(''); }}
              className="w-full text-center text-xs underline uppercase tracking-wider font-bold cursor-pointer text-rose-500 hover:text-rose-600 mt-2 block"
            >
              Cancel registration
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
