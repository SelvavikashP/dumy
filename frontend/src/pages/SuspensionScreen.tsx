import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowRight, FileText } from 'lucide-react';

export const SuspensionScreen: React.FC = () => {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt_id');

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-rose-800/60 shadow-2xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
          <Lock className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-tight">Assessment Session Suspended</h1>
          <p className="text-xs text-rose-300 font-mono">
            Configured Security Threshold Exceeded
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 text-xs text-slate-300 font-sans leading-relaxed text-left space-y-2">
          <p>
            Your assessment attempt was automatically suspended because the assessment environment registered events exceeding the configured security limit.
          </p>
          <p className="text-slate-400">
            <strong>State Preservation Notice:</strong> All answers, code submissions, and sectional timer states have been securely saved and transmitted to the recruiter review queue.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            Candidate Dashboard
          </Link>
          <Link
            to={`/assessment/any/reattempt?attempt_id=${attemptId || ''}`}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition shadow-lg shadow-amber-600/30 flex items-center justify-center space-x-1.5"
          >
            <span>Request Reattempt Review</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
