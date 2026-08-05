import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';

export const SetupPage: React.FC = () => {
  const [isCompleted, setIsCompleted] = useState<boolean | null>(null);
  const [fullName, setFullName] = useState<string>('Portal Administrator');
  const [email, setEmail] = useState<string>('admin@assessmentportal.io');
  const [password, setPassword] = useState<string>('Admin@12345');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<string>('CONFIRM_SETUP');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const check = async () => {
      try {
        const res = await api.checkSetup();
        setIsCompleted(res.is_setup_completed);
      } catch (err: any) {
        setIsCompleted(false);
      }
    };
    check();
  }, []);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const tokenResp = await api.setupInitialAdmin({
        full_name: fullName,
        email,
        password,
        security_confirmation: confirmation
      });
      login(tokenResp);
      navigate('/portal-admin');
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Portal Admin');
    } finally {
      setLoading(false);
    }
  };

  if (isCompleted === null) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Card Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 mx-auto mb-4 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-surface-900 rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-brand-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">First-Time Setup Wizard</h2>
          <p className="text-sm text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">
            Initialize the singular Portal Admin account for this platform.
          </p>
        </div>

        {isCompleted ? (
          <div className="p-6 rounded-2xl glass-card border border-slate-800 dark:border-slate-800 light:border-slate-200 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white dark:text-white light:text-slate-900">Setup Already Completed</h3>
            <p className="text-xs text-slate-300 dark:text-slate-300 light:text-slate-600">
              The Portal Admin account has already been created. Public admin initialization is locked.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition shadow-lg shadow-brand-600/30"
            >
              Go to Sign In
            </button>
          </div>
        ) : (
          <div className="glass-panel p-8 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl">
            {error && (
              <div className="p-3 mb-6 bg-rose-950/40 dark:bg-rose-950/40 light:bg-rose-50 border border-rose-800/60 dark:border-rose-800/60 light:border-rose-200 rounded-xl text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSetup} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Admin Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Admin Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Master Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-9 pr-10 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-700 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 text-brand-400" />
                    ) : (
                      <Eye className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Security Confirmation (Type 'CONFIRM_SETUP')</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={confirmation}
                    onChange={(e) => setConfirmation(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-semibold text-sm shadow-xl shadow-brand-600/30 transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Initializing Admin Account...' : 'Complete Portal Admin Setup'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
