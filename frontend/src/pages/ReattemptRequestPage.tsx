import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { RotateCcw, AlertCircle, CheckCircle2, Send, ArrowLeft } from 'lucide-react';

export const ReattemptRequestPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt_id') || '';
  const navigate = useNavigate();

  const [reason, setReason] = useState<string>(
    'Experienced temporary hardware glitch / network fluctuation during fullscreen lock.'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attemptId) {
      setError('Missing attempt ID parameter');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.requestReattempt(attemptId, reason);
      setStatusMsg(res.message);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit reattempt request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-lg glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6">
        
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Request Assessment Reattempt</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Attempt Ref: {attemptId.substring(0, 8) || 'N/A'}</p>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {statusMsg ? (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs text-center space-y-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 mx-auto" />
            <p className="font-semibold">{statusMsg}</p>
            <p className="text-slate-500 dark:text-slate-400">Redirecting to candidate dashboard...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">
                Contextual Justification / Reason for Reattempt
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                required
                className="w-full p-3 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none focus:border-brand-500 leading-relaxed shadow-sm"
                placeholder="Explain the circumstance (e.g. system disconnect, power interruption)..."
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-200">Policy Note:</strong> If approved by the recruiter, a new clean attempt record will be generated. Past attempt logs remain permanently archived in compliance records.
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
              <Link to="/dashboard" className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center space-x-1 font-mono text-xs">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-sans font-bold text-xs shadow-lg shadow-amber-600/30 transition flex items-center space-x-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? 'Submitting...' : 'Submit Reattempt Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
