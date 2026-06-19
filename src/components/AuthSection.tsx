import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { Mail, Key, User, Award, GraduationCap, ArrowRight, RefreshCw, ShieldCheck } from 'lucide-react';
import CollegeSelector from './CollegeSelector';
import { api } from '../api';

interface AuthSectionProps {
  onLogin: (user: UserProfile) => void;
  darkMode: boolean;
}

type Step = 'form' | 'otp';
type Mode = 'login' | 'register';

export default function AuthSection({ onLogin, darkMode }: AuthSectionProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('form');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [college, setCollege] = useState('');
  const [branch, setBranch] = useState('Computer Science');
  const [year, setYear] = useState(1);

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const switchMode = (m: Mode) => {
    setMode(m); setStep('form'); setError('');
    setOtp(['', '', '', '', '', '']);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
  };

  const sendOtp = async (isResend = false) => {
    setError('');
    if (!email) { setError('Please enter your email first.'); return; }
    if (mode === 'register' && (!fullName || !college)) {
      setError('Please fill in all required fields first.'); return;
    }
    setLoading(true);
    try {
      const data = mode === 'register' ? { fullName, college, branch, year, password } : undefined;
      await api.auth.sendOtp(email, mode, data);
      setStep('otp');
      setResendCooldown(60);
      if (isResend) setOtp(['', '', '', '', '', '']);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the 6-digit code.'); return; }
    setLoading(true);
    setError('');
    try {
      const { user } = await api.auth.verifyOtp(email, code);
      onLogin(user);
    } catch (err: any) {
      setError(err.message);
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login' && !password) { setError('Enter your password.'); return; }
    if (mode === 'register' && (!password || password.length < 6)) {
      setError('Password must be at least 6 characters.'); return;
    }
    sendOtp();
  };

  const card = `w-full max-w-md rounded-2xl border border-neutral-200 dark:border-white/10 p-8 shadow-md transition-all ${darkMode ? 'bg-[#121217]' : 'bg-white'}`;
  const input = `w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${darkMode ? 'bg-[#09090C] text-white placeholder:text-slate-600' : 'bg-white text-slate-800 placeholder:text-slate-400'}`;

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 transition-all ${darkMode ? 'bg-[#09090C] text-slate-100' : 'bg-neutral-50 text-slate-900'}`}>
      <div className={card}>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-sm">
            <GraduationCap size={22} />
          </div>
          <h1 className="text-2xl font-extrabold tracking-wide uppercase text-indigo-500">The Network</h1>
          <p className="text-xs mt-1.5 max-w-xs mx-auto text-slate-400">
            The premium verified student collaboration platform.
          </p>
        </div>

        {/* Tab switcher */}
        {step === 'form' && (
          <div className={`flex rounded-xl p-1 mb-6 text-xs font-bold uppercase tracking-wider border border-neutral-200 dark:border-white/5 ${darkMode ? 'bg-[#09090C]' : 'bg-neutral-100'}`}>
            <button onClick={() => switchMode('login')} className={`py-2 flex-1 rounded-lg transition-all cursor-pointer ${mode === 'login' ? 'bg-indigo-500 text-white shadow-sm' : 'opacity-40 hover:opacity-80 text-slate-400'}`}>
              Sign In
            </button>
            <button onClick={() => switchMode('register')} className={`py-2 flex-1 rounded-lg transition-all cursor-pointer ${mode === 'register' ? 'bg-indigo-500 text-white shadow-sm' : 'opacity-40 hover:opacity-80 text-slate-400'}`}>
              Register
            </button>
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10.5px] text-center font-semibold font-mono uppercase tracking-wide">
            {error}
          </div>
        )}

        {/* ── FORM STEP ── */}
        {step === 'form' && (
          <form onSubmit={handleFormSubmit} className="space-y-4 text-left">

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><User size={15} /></span>
                    <input type="text" required placeholder="Your Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className={input} />
                  </div>
                </div>

                <CollegeSelector id="auth-college" value={college} onChange={setCollege} darkMode={darkMode} label="University / College" />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Study Year</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Award size={14} /></span>
                      <select value={year} onChange={e => setYear(Number(e.target.value))} className={`w-full pl-8 pr-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none cursor-pointer ${darkMode ? 'bg-[#09090C] text-slate-300' : 'bg-white text-slate-800'}`}>
                        <option value={1}>1st Year</option>
                        <option value={2}>2nd Year</option>
                        <option value={3}>3rd Year</option>
                        <option value={4}>4th Year</option>
                        <option value={5}>Postgrad</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Department</label>
                    <select value={branch} onChange={e => setBranch(e.target.value)} className={`w-full px-3 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-white/10 focus:outline-none cursor-pointer ${darkMode ? 'bg-[#09090C] text-slate-300' : 'bg-white text-slate-800'}`}>
                      <option>Computer Science</option>
                      <option>Electrical Engineering</option>
                      <option>Electronics & Instrumentation</option>
                      <option>Mechanical Engineering</option>
                      <option>Biotechnology</option>
                      <option>Cognitive Science</option>
                      <option>Physics</option>
                      <option>Informatics</option>
                      <option>Business Management</option>
                      <option>Management Science & Engineering</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Mail size={15} /></span>
                <input type="email" required placeholder="you@university.edu" value={email} onChange={e => setEmail(e.target.value)} className={input} />
              </div>
            </div>

            <div>
              <label className="block text-[8.5px] uppercase tracking-wider font-extrabold text-slate-400 mb-1">
                {mode === 'register' ? 'Create Password' : 'Password'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400"><Key size={15} /></span>
                <input type="password" required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} className={input} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full mt-2 py-2.5 px-4 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer">
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending OTP...</>
              ) : (
                <>{mode === 'login' ? 'Send OTP to Email' : 'Create Account & Send OTP'} <ArrowRight size={14} /></>
              )}
            </button>

            {/* Google Sign-In */}
            <div className="relative my-1">
              <div className={`absolute inset-0 flex items-center`}><div className="w-full border-t border-neutral-200 dark:border-white/10" /></div>
              <div className="relative flex justify-center"><span className={`px-3 text-[10px] font-semibold text-slate-400 ${darkMode ? 'bg-[#121217]' : 'bg-white'}`}>or</span></div>
            </div>

            <button
              type="button"
              onClick={() => setError('Google sign-in requires a custom domain setup. Use email + OTP for now.')}
              className={`w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2.5 cursor-pointer transition-colors ${darkMode ? 'border-white/10 hover:bg-white/5 text-slate-300' : 'border-neutral-200 hover:bg-neutral-50 text-slate-700'}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>

            <p className="text-center text-[10px] text-slate-400 pt-1">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="text-indigo-500 font-bold underline cursor-pointer">
                {mode === 'login' ? 'Register here' : 'Sign in'}
              </button>
            </p>
          </form>
        )}

        {/* ── OTP STEP ── */}
        {step === 'otp' && (
          <form onSubmit={verifyOtp} className="space-y-6 text-center">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 mb-4">
                <ShieldCheck size={22} />
              </div>
              <h2 className="font-bold text-base mb-1">Check your email</h2>
              <p className="text-xs text-slate-400">
                We sent a 6-digit OTP to<br />
                <strong className="text-slate-700 dark:text-slate-200">{email}</strong>
              </p>
            </div>

            {/* 6-box OTP input */}
            <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(i, e.target.value)}
                  onKeyDown={e => handleOtpKeyDown(i, e)}
                  className={`w-11 h-13 text-center text-xl font-black rounded-xl border-2 focus:outline-none transition-all ${
                    digit
                      ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                      : 'border-neutral-200 dark:border-white/10'
                  } ${darkMode ? 'bg-[#09090C] text-white' : 'bg-white text-slate-800'}`}
                  style={{ height: '52px' }}
                  autoFocus={i === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length < 6}
              className="w-full py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-extrabold text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
              ) : (
                <><ShieldCheck size={14} /> Verify & Continue</>
              )}
            </button>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => sendOtp(true)}
                disabled={resendCooldown > 0 || loading}
                className="text-xs text-indigo-500 hover:text-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 mx-auto transition-colors"
              >
                <RefreshCw size={11} />
                {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('form'); setOtp(['', '', '', '', '', '']); setError(''); }}
                className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer block mx-auto"
              >
                ← Change email
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
