import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  FileCode,
  Layers,
  Sparkles,
  Users,
  Eye,
  BarChart3,
  AlertTriangle,
  Globe2,
  Settings,
  Shield,
  History,
  FileQuestion,
  UserCheck
} from 'lucide-react';

interface NavLinkItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  if (!user) return null;

  const adminLinks: NavLinkItem[] = [
    { to: '/portal-admin', label: 'Executive Overview', icon: LayoutDashboard },
    { to: '/portal-admin/creators', label: 'Test Creators', icon: Users },
    { to: '/portal-admin/platforms', label: 'Coding Platforms', icon: Globe2 },
    { to: '/portal-admin/proctoring', label: 'Proctoring Policies', icon: Shield },
    { to: '/portal-admin/settings', label: 'Global Settings', icon: Settings },
    { to: '/portal-admin/audit-logs', label: 'Audit Trail', icon: History },
  ];

  const creatorLinks: NavLinkItem[] = [
    { to: '/creator', label: 'Overview', icon: LayoutDashboard },
    { to: '/creator/assessments', label: 'Assessments', icon: Layers },
    { to: '/creator/assessments/create', label: 'Create Assessment', icon: FileCode },
    { to: '/creator/question-bank', label: 'Question Bank', icon: FileQuestion },
    { to: '/creator/coding', label: 'Coding Problem Studio', icon: FileCode },
    { to: '/creator/live-monitoring', label: 'Live Monitoring', icon: Eye, highlight: true },
    { to: '/creator/results', label: 'Results & Analytics', icon: BarChart3 },
    { to: '/creator/violations', label: 'Incident Timeline', icon: AlertTriangle },
    { to: '/profile', label: 'Account & Settings', icon: Settings },
  ];

  const attenderLinks: NavLinkItem[] = [
    { to: '/dashboard', label: 'My Assessments', icon: Layers },
    { to: '/profile', label: 'Profile & Credentials', icon: Settings },
  ];

  const links: NavLinkItem[] = user.role === 'PORTAL_ADMIN' ? adminLinks : (user.role === 'TEST_CREATOR' ? creatorLinks : attenderLinks);

  return (
    <aside className="w-64 flex-shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-surface-900/50 backdrop-blur-md hidden md:block min-h-[calc(100vh-4rem)] p-4 transition-colors duration-200">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
          {user.role === 'PORTAL_ADMIN' ? 'Platform Administration' : (user.role === 'TEST_CREATOR' ? 'Recruiter Studio' : 'Candidate Portal')}
        </div>

        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/portal-admin' || link.to === '/creator' || link.to === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-600/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30 shadow-sm shadow-brand-500/10'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50'
                } ${link.highlight ? 'text-accent-emerald' : ''}`
              }
            >
              <Icon className={`w-4 h-4 ${link.highlight ? 'text-accent-emerald animate-pulse' : ''}`} />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
};
