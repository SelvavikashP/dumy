import React from 'react';
import { ShieldCheck, Cpu, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-100/90 dark:bg-surface-900/80 text-slate-500 dark:text-slate-400 py-6 px-4 text-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-brand-600 dark:text-brand-400" />
          <span className="text-slate-700 dark:text-slate-300 font-semibold">EvalAI Pro &bull; AI Recruitment Assessment &amp; Proctoring Platform</span>
        </div>
        <div className="flex items-center space-x-6 text-slate-500 dark:text-slate-400">
          <span className="flex items-center space-x-1">
            <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
            <span>Sandboxed Code Judge</span>
          </span>
          <span className="flex items-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-accent-emerald" />
            <span>Server-Authoritative Sentinel</span>
          </span>
          <span>&copy; {new Date().getFullYear()} Enterprise Edition</span>
        </div>
      </div>
    </footer>
  );
};
