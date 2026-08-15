import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  User, 
  Phone, 
  BrainCircuit, 
  AlertCircle, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck, 
  RotateCw, 
  Sparkles,
  GraduationCap,
  BookOpen
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [step, setStep] = useState<'REGISTER' | 'VERIFY_OTP'>('REGISTER');
  const [role, setRole] = useState<'TEST_ATTENDER' | 'TEST_CREATOR'>('TEST_ATTENDER');
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [pendingTokenResponse, setPendingTokenResponse] = useState<any | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    setLoading(true);

    try {
      const resp = await api.register({
        full_name: fullName,
        email,
        phone,
        password,
        role
      });
      // Store token response in auth context & local state
      setPendingTokenResponse(resp);
      login(resp);
      
      // Transition to OTP verification step
      setStep('VERIFY_OTP');
      setResendCooldown(60);

      if (resp.otp_hint) {
        setOtpCode(resp.otp_hint);
        setInfoMsg(`Verification code generated: ${resp.otp_hint}. (Click verify below or check your inbox)`);
      } else {
        setInfoMsg(`A 6-digit verification code has been sent to ${email}. Check your inbox or spam folder.`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMsg(null);
    if (!otpCode || otpCode.length < 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await api.verifyEmailOTP(email, otpCode);
      setInfoMsg('Email verified successfully! Redirecting...');
      setTimeout(() => {
        if (role === 'TEST_CREATOR') {
          navigate('/creator');
        } else {
          navigate('/dashboard');
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const res = await api.sendVerificationOTP(email);
      setResendCooldown(60);

      if (res.message && res.message.includes('[')) {
        const match = res.message.match(/\[(\d{6})\]/);
        if (match && match[1]) {
          setOtpCode(match[1]);
        }
      }
      setInfoMsg(res.message || `A fresh verification code has been sent to ${email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        
        {/* Header Branding */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 mx-auto mb-3 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-slate-50 dark:bg-surface-900 rounded-[14px] flex items-center justify-center">
              {step === 'REGISTER' ? (
                role === 'TEST_CREATOR' ? (
                  <BookOpen className="w-7 h-7 text-accent-cyan" />
                ) : (
                  <GraduationCap className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                )
              ) : (
                <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            {step === 'REGISTER' ? (
              role === 'TEST_CREATOR' ? 'Teacher / Creator Registration' : 'Student / Candidate Registration'
            ) : 'Verify Registered Email'}
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            {step === 'REGISTER' 
              ? (role === 'TEST_CREATOR'
                  ? 'Create an account to design assessments, manage question banks & proctor candidates.'
                  : 'Create an account to attend proctored recruitment & skill assessments.')
              : `Confirm ownership of ${email} to activate all platform features.`}
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
          
          {/* Account Role Selector */}
          {step === 'REGISTER' && (
            <div className="space-y-1.5 font-sans">
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('TEST_ATTENDER')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    role === 'TEST_ATTENDER'
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : 'bg-white dark:bg-surface-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-brand-500" />
                    <span className="font-bold text-xs">Student / Candidate</span>
                  </div>
                  <span className="text-[10px] opacity-80 leading-tight">Attend proctored tests</span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('TEST_CREATOR')}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition ${
                    role === 'TEST_CREATOR'
                      ? 'bg-cyan-50 dark:bg-cyan-950/40 border-accent-cyan text-cyan-700 dark:text-cyan-300 ring-2 ring-cyan-500/20'
                      : 'bg-white dark:bg-surface-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <BookOpen className="w-4 h-4 text-accent-cyan" />
                    <span className="font-bold text-xs">Teacher / Creator</span>
                  </div>
                  <span className="text-[10px] opacity-80 leading-tight">Design &amp; proctor tests</span>
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2 font-mono">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {infoMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2 font-mono">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
              <span>{infoMsg}</span>
            </div>
          )}

          {step === 'REGISTER' ? (
            <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Full Legal Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="e.g. Prof. Jordan Lee"
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder={role === 'TEST_CREATOR' ? 'teacher@institution.edu' : 'candidate@example.com'}
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Phone Number (Optional)</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full pl-9 pr-3 py-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    placeholder="Create password (min 6 characters)..."
                    className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-semibold text-sm shadow-xl shadow-brand-600/30 transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Creating Account...' : `Register as ${role === 'TEST_CREATOR' ? 'Teacher / Creator' : 'Student / Candidate'}`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-5 text-xs font-mono">
              <div className="bg-slate-50 dark:bg-surface-850/80 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 text-center">
                <div className="text-slate-500 dark:text-slate-400 text-[11px] mb-1 font-sans">Enter the 6-digit code sent to</div>
                <div className="text-sm font-bold text-slate-900 dark:text-white tracking-wide">{email}</div>
              </div>

              {/* Dev Simulation Verification Code Banner */}
              {pendingTokenResponse?.otp_hint && (
                <div className="p-3.5 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-center space-y-1">
                  <div className="text-[10px] text-cyan-300 font-mono font-bold uppercase tracking-wider flex items-center justify-center space-x-1">
                    <Sparkles className="w-3 h-3 text-accent-cyan" />
                    <span>Dev Simulation Verification Code</span>
                  </div>
                  <div className="text-2xl font-bold font-mono text-cyan-300 tracking-[6px]">{pendingTokenResponse.otp_hint}</div>
                  <div className="text-[10px] text-slate-400 font-sans">
                    Auto-filled for testing. (To deliver live emails to real inboxes, configure Gmail SMTP in <Link to="/portal-admin/settings" className="underline text-cyan-400">Admin Settings</Link>)
                  </div>
                </div>
              )}

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-2 text-center font-sans">
                  6-Digit Verification Code
                </label>
                <div className="flex justify-center">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    autoFocus
                    placeholder="• • • • • •"
                    className="w-48 py-3 bg-white dark:bg-surface-900 border-2 border-brand-500/60 focus:border-brand-500 rounded-xl text-center text-2xl font-bold tracking-[8px] text-cyan-600 dark:text-cyan-300 focus:outline-none shadow-lg shadow-brand-500/10 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-sans font-semibold text-sm shadow-xl shadow-emerald-600/30 transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{loading ? 'Verifying OTP...' : 'Verify Email & Complete Registration'}</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendCooldown > 0 || loading}
                  className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 disabled:text-slate-400 flex items-center space-x-1 transition font-sans font-semibold"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Verification Code'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate(role === 'TEST_CREATOR' ? '/creator' : '/dashboard')}
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition font-sans underline"
                >
                  Skip for now →
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400 font-sans">
            Already registered?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 font-semibold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
