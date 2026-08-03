import React from 'react';
import { ShieldCheck, Cpu, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-surface-900/80 text-slate-400 py-6 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2 font-mono">
          <ShieldCheck className="w-4 h-4 text-brand-400" />
          <span>EvalAI Pro &bull; AI Recruitment Assessment &amp; Proctoring Platform</span>
        </div>
        <div className="flex items-center space-x-6 text-slate-400">
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
