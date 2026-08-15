import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { CertificateModal } from '../components/CertificateModal';
import { 
  Award, 
  CheckCircle2, 
  XCircle, 
  BarChart3, 
  Clock, 
  AlertTriangle, 
  ArrowRight,
  ShieldCheck,
  FileCheck
} from 'lucide-react';

export const ResultSummaryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt_id');
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [certificateData, setCertificateData] = useState<any | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
  const [certLoading, setCertLoading] = useState<boolean>(false);

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

  const handleOpenCertificate = async () => {
    if (!attemptId) return;
    setCertLoading(true);
    try {
      const cert = await api.getCertificate(attemptId);
      setCertificateData(cert);
      setIsCertModalOpen(true);
    } catch (e) {
      alert('Unable to load certificate. Ensure attempt is complete and passed.');
    } finally {
      setCertLoading(false);
    }
  };

  if (loading || !result) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Loading assessment results scorecard...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header Result Card */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xl">
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto shadow-2xl ${
            result.passed
              ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/30'
              : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/30'
          }`}
        >
          {result.passed ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {result.passed ? 'Assessment Completed — Qualified!' : 'Assessment Attempt Concluded'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">{result.assessment_title}</p>
        </div>

        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-surface-850 border border-slate-200 dark:border-slate-700 text-xs font-mono">
          <span className="text-slate-500 dark:text-slate-400">Total Score:</span>
          <strong className="text-slate-900 dark:text-white text-sm">{result.total_score} / {result.max_score} pts</strong>
          <span className="text-brand-600 dark:text-brand-300 font-bold">({result.percentage}%)</span>
        </div>

        {/* Certificate Callout Button for Passed Candidates */}
        {result.passed && (
          <div className="pt-2">
            <button
              onClick={handleOpenCertificate}
              disabled={certLoading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-2 mx-auto shadow-xl shadow-amber-500/20 transition duration-150 disabled:opacity-50"
            >
              <Award className="w-4 h-4" />
              <span>{certLoading ? 'Generating Credential...' : 'View & Download Official Certificate (PDF)'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Sectional Breakdown Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Aptitude Score</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{result.aptitude_score} pts</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">MCQ Score</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">{result.mcq_score} pts</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Coding Score</span>
          <div className="text-2xl font-bold text-cyan-600 dark:text-accent-cyan font-mono">{result.coding_score} pts</div>
        </div>
      </div>

      {/* Proctoring & Integrity Telemetry */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white font-sans border-b border-slate-200 dark:border-slate-800 pb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Proctoring &amp; Security Summary</span>
        </div>

        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Security Warnings Incurred:</span>
          <strong className="text-slate-900 dark:text-white">{result.warnings_count}</strong>
        </div>
        <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
          <span>Session State:</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{result.status}</span>
        </div>
      </div>

      <div className="text-center pt-4">
        <Link
          to="/dashboard"
          className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs transition inline-flex items-center space-x-2 shadow-lg shadow-brand-600/20"
        >
          <span>Return to Candidate Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Verified Certificate Modal */}
      {certificateData && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          certificate={certificateData}
        />
      )}
    </div>
  );
};
