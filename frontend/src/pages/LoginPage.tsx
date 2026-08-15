import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Lock, 
  Mail, 
  BrainCircuit, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  Terminal, 
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('admin@assessmentportal.io');
  const [password, setPassword] = useState<string>('Admin@12345');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await api.login({ email, password });
      login(resp);

      if (resp.role === 'PORTAL_ADMIN') {
        navigate('/portal-admin');
      } else if (resp.role === 'TEST_CREATOR') {
        navigate('/creator');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (role: 'ADMIN' | 'CREATOR' | 'CANDIDATE') => {
    if (role === 'ADMIN') {
      setEmail('admin@assessmentportal.io');
      setPassword('Admin@12345');
    } else if (role === 'CREATOR') {
      setEmail('recruiter@techcorp.com');
      setPassword('Creator@12345');
    } else {
      setEmail('candidate@example.com');
      setPassword('Candidate@12345');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-md">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 mx-auto mb-3 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-slate-50 dark:bg-surface-900 rounded-[14px] flex items-center justify-center">
              <BrainCircuit className="w-7 h-7 text-brand-600 dark:text-brand-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Sign In to EvalAI Pro</h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Access your secure assessment studio or testing room.
          </p>
        </div>

        {/* Quick Demo Switchers for Reviewer Ease */}
        <div className="mb-6 p-3 rounded-xl bg-slate-50 dark:bg-surface-850/90 border border-slate-200 dark:border-slate-800 text-xs shadow-sm">
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 font-mono text-center">
            &mdash; Quick-Fill Demo Credentials &mdash;
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('ADMIN')}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-purple-200 dark:border-slate-700 text-purple-700 dark:text-purple-300 font-mono text-[11px] flex items-center justify-center space-x-1 transition shadow-sm font-semibold"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('CREATOR')}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-indigo-200 dark:border-slate-700 text-brand-700 dark:text-brand-300 font-mono text-[11px] flex items-center justify-center space-x-1 transition shadow-sm font-semibold"
            >
              <Terminal className="w-3 h-3" />
              <span>Creator</span>
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('CANDIDATE')}
              className="px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-emerald-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-300 font-mono text-[11px] flex items-center justify-center space-x-1 transition shadow-sm font-semibold"
            >
              <UserCheck className="w-3 h-3" />
              <span>Candidate</span>
            </button>
          </div>
        </div>

        {/* Login Box */}
        <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl">
          {error && (
            <div className="p-3 mb-6 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@company.com"
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
                  autoComplete="current-password"
                  placeholder="Enter password..."
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
              className="w-full mt-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-sm shadow-xl shadow-brand-600/30 transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-600 dark:text-slate-400 font-sans">
            Need an account?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300 font-semibold">
              Create Account (Student or Teacher)
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
