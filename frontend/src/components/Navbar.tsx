import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Terminal, 
  UserCheck, 
  LogOut, 
  Settings, 
  BrainCircuit, 
  Sun, 
  Moon 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="glass-panel sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-surface-900/90 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-300">
                <div className="w-full h-full bg-slate-100 dark:bg-surface-900 rounded-[10px] flex items-center justify-center">
                  <BrainCircuit className="w-5 h-5 text-brand-500 dark:text-brand-400 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-slate-900 to-brand-600 dark:from-white dark:via-slate-200 dark:to-brand-300 bg-clip-text text-transparent">
                  EvalAI<span className="text-brand-600 dark:text-brand-400 font-normal ml-0.5">Pro</span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 tracking-wider uppercase font-mono">
                  Proctored Assessment Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Center Links based on role */}
          {user && (
            <div className="hidden md:flex items-center space-x-1">
              {user.role === 'PORTAL_ADMIN' && (
                <>
                  <Link to="/portal-admin" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Admin Center
                  </Link>
                  <Link to="/portal-admin/creators" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Test Creators
                  </Link>
                  <Link to="/portal-admin/platforms" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Coding Platforms
                  </Link>
                  <Link to="/portal-admin/settings" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Global Settings
                  </Link>
                </>
              )}

              {user.role === 'TEST_CREATOR' && (
                <>
                  <Link to="/creator" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Dashboard
                  </Link>
                  <Link to="/creator/assessments" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Assessments
                  </Link>
                  <Link to="/creator/question-bank" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Question Bank
                  </Link>
                  <Link to="/creator/coding" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    Coding Studio
                  </Link>
                  <Link to="/creator/live-monitoring" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition flex items-center space-x-1.5">
                    <span className="w-2 h-2 rounded-full bg-accent-emerald animate-ping" />
                    <span>Live Monitoring</span>
                  </Link>
                </>
              )}

              {user.role === 'TEST_ATTENDER' && (
                <>
                  <Link to="/dashboard" className="px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:text-brand-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 transition">
                    My Assessments
                  </Link>
                </>
              )}
            </div>
          )}

          {/* Right Action Profile, Theme Switcher & Badges */}
          <div className="flex items-center space-x-3">
            
            {/* Theme Toggle Button (Light / Dark) */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700/60 bg-slate-100 dark:bg-surface-850/80 text-amber-500 dark:text-amber-400 hover:scale-105 transition-all duration-200 shadow-sm"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-brand-600" />
              )}
            </button>

            {user ? (
              <div className="flex items-center space-x-3">
                {/* Role Badge */}
                <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border bg-slate-100 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700">
                  {user.role === 'PORTAL_ADMIN' && (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-accent-purple" />
                      <span className="text-accent-purple font-mono">Portal Admin</span>
                    </>
                  )}
                  {user.role === 'TEST_CREATOR' && (
                    <>
                      <Terminal className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400" />
                      <span className="text-brand-600 dark:text-brand-300 font-mono">Test Creator</span>
                    </>
                  )}
                  {user.role === 'TEST_ATTENDER' && (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-accent-emerald" />
                      <span className="text-accent-emerald font-mono">Candidate</span>
                    </>
                  )}
                </div>

                {/* User Name & Profile Link */}
                <Link
                  to="/profile"
                  className="text-right hidden lg:block hover:opacity-80 transition group"
                  title="Account Settings & Profile"
                >
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-tight group-hover:text-brand-600 dark:group-hover:text-brand-400">
                    {user.full_name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{user.email}</div>
                </Link>

                {/* Profile / Settings Button */}
                <Link
                  to="/settings"
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-500/10 transition duration-200"
                  title="Settings & Preferences"
                >
                  <Settings className="w-4 h-4" />
                </Link>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition duration-200"
                  title="Log out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  to="/setup"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/50 hover:bg-brand-100 dark:hover:bg-brand-900/60 transition"
                >
                  First-Time Setup
                </Link>
                <Link
                  to="/login"
                  className="px-4 py-1.5 rounded-lg text-sm font-medium bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-600/30 transition duration-200"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
