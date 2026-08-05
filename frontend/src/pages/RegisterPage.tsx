import React, { useState } from 'react';
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
  EyeOff
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await api.register({
        full_name: fullName,
        email,
        phone,
        password
      });
      login(resp);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 mx-auto mb-3 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-surface-900 rounded-[14px] flex items-center justify-center">
              <BrainCircuit className="w-7 h-7 text-brand-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-white dark:text-white light:text-slate-900 tracking-tight">Candidate Registration</h2>
          <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 mt-1">
            Create an account to attend proctored recruitment assessments.
          </p>
        </div>

        <div className="glass-panel p-8 rounded-2xl border border-slate-800 dark:border-slate-800 light:border-slate-200 shadow-2xl">
          {error && (
            <div className="p-3 mb-6 bg-rose-950/40 dark:bg-rose-950/40 light:bg-rose-50 border border-rose-800/60 dark:border-rose-800/60 light:border-rose-200 rounded-xl text-rose-300 dark:text-rose-300 light:text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Full Legal Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="e.g. Jordan Lee"
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="candidate@example.com"
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Phone Number (Optional)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-9 pr-3 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 dark:text-slate-300 light:text-slate-700 font-semibold mb-1">Password</label>
              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Create password (min 6 characters)..."
                  className="w-full pl-9 pr-10 py-2.5 bg-surface-850 dark:bg-surface-850 light:bg-slate-50 border border-slate-700 dark:border-slate-700 light:border-slate-300 rounded-xl text-slate-100 dark:text-slate-100 light:text-slate-900 text-xs focus:outline-none focus:border-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-200 dark:hover:text-slate-200 light:hover:text-slate-700 transition"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-semibold text-sm shadow-xl shadow-brand-600/30 transition duration-200 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{loading ? 'Creating Account...' : 'Register Account'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 text-center text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-sans">
            Already registered?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300 dark:text-brand-400 light:text-brand-600 font-medium">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
