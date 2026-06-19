import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Mail, Shield, Building, Award, Key, User, GraduationCap, ArrowRight, Sparkles } from 'lucide-react';
import CollegeSelector from './CollegeSelector';
import { api } from '../api';

interface AuthSectionProps {
  onLogin: (user: UserProfile) => void;
  darkMode: boolean;
}

export default function AuthSection({ onLogin, darkMode }: AuthSectionProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [year, setYear] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please fill in all credentials.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await api.auth.login(email, password);
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password || !fullName || !college) {
      setError('All fields are mandatory.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await api.auth.register({ fullName, college, branch, year, email, password });
      onLogin(user);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email may already be registered.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all duration-200 ${darkMode ? 'bg-[#09090C] text-[#F9F7F2]' : 'bg-neutral-50 text-[#1A1A1A]'}`}>
      <div id="auth-card" className={`w-full max-w-md rounded-2xl border border-neutral-250 dark:border-white/10 p-8 shadow-md transition-all ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>
        
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-gradient-to-tr from-indigo-500 to-indigo-600 text-white shadow-xs">
            <GraduationCap size={22} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase font-sans text-indigo-500">The Network</h1>
          <p className="text-xs mt-1.5 max-w-xs mx-auto text-slate-455">
            The premium verified student collaboration platform. Match co-founders, study partners and academic hubs.
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10.5px] text-center font-semibold font-mono uppercase tracking-wide">
            {error}
          </div>
        )}

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
                    <option value="Management Science & Engineering">Management Sci.</option>
                  </select>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450 mb-1">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={15} />
              </span>
              <input
                id="auth-email"
                type="email"
                required
                placeholder={isLogin ? "you@university.edu" : "student@university.edu"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-450">Password</label>
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
            disabled={loading}
            className="w-full mt-3 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-transparent"
          >
            <span>{loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}</span>
            {!loading && <ArrowRight size={14} />}
          </button>
        </form>

        <p className="mt-6 text-center text-[10px] text-slate-400">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-indigo-500 font-bold underline cursor-pointer"
          >
            {isLogin ? 'Register here' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
