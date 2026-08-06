import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Award, CheckCircle2, XCircle, BarChart3, Clock, AlertTriangle, ArrowRight } from 'lucide-react';

export const ResultSummaryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt_id');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      if (!attemptId) return;
      try {
        const data = await api.getCandidateResult(attemptId);
        setResult(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  if (loading || !result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-400 font-mono text-xs">
        Loading assessment results scorecard...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header Result Card */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 text-center space-y-4">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-2xl ${
            result.passed
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}
        >
          {result.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {result.passed ? 'Assessment Completed — Qualified!' : 'Assessment Attempt Concluded'}
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">{result.assessment_title}</p>
        </div>

        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-surface-850 border border-slate-700 text-xs font-mono">
          <span className="text-slate-400">Total Score:</span>
          <strong className="text-white text-sm">{result.total_score} / {result.max_score} pts</strong>
          <span className="text-brand-300">({result.percentage}%)</span>
        </div>
      </div>

      {/* Sectional Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Aptitude Score</span>
          <div className="text-2xl font-bold text-white font-mono">{result.aptitude_score} pts</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">MCQ Score</span>
          <div className="text-2xl font-bold text-white font-mono">{result.mcq_score} pts</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Coding Score</span>
          <div className="text-2xl font-bold text-accent-cyan font-mono">{result.coding_score} pts</div>
        </div>
      </div>

      {/* Proctoring & Integrity Telemetry */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-sm font-bold text-white font-sans border-b border-slate-800 pb-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Proctoring &amp; Security Summary</span>
        </div>

        <div className="flex items-center justify-between text-slate-300">
          <span>Security Warnings Incurred:</span>
          <strong className="text-white">{result.warnings_count}</strong>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span>Session State:</span>
          <span className="text-emerald-400 font-bold">{result.status}</span>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/dashboard"
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition inline-flex items-center space-x-2"
        >
          <span>Return to Candidate Portal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
};
