import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  AlertCircle, 
  Award, 
  CheckCircle2, 
  Calendar, 
  User, 
  Building, 
  ArrowLeft,
  Lock,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export const CertificateVerificationPage: React.FC = () => {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verify = async () => {
      if (!certificateId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.verifyCertificate(certificateId);
        setData(res);
      } catch (err: any) {
        setError(err.message || 'Certificate verification failed or credential does not exist.');
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, [certificateId]);

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto space-y-6 font-sans">
      
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center space-x-2 text-xs font-mono text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Public Verification Service</span>
      </div>

      {/* Header Card */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-brand-500 to-accent-cyan p-0.5 mx-auto shadow-xl shadow-brand-500/20">
          <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[14px] flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-amber-500 dark:text-amber-400" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Official Credential Verification
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
          Cryptographically verifying credential ID: <span className="font-bold text-amber-600 dark:text-amber-400">{certificateId}</span>
        </p>
      </div>

      {/* Result Panel */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs glass-panel rounded-2xl border border-slate-200 dark:border-slate-800">
          Querying EvalAI Registry &amp; calculating cryptographic digests...
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verification Failed</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-mono font-medium">{error}</p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The requested certificate ID could not be validated in the registry. Ensure the serial number was entered correctly.
          </p>
        </div>
      ) : (
        <div className="glass-panel p-8 rounded-2xl border border-amber-500/30 dark:border-amber-500/40 shadow-2xl space-y-6">
          
          {/* Validity Badge */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs font-mono">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span>OFFICIALLY VERIFIED &bull; AUTHENTIC RECORD</span>
            </div>
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">{data.status}</span>
          </div>

          {/* Details Table */}
          <div className="space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>Candidate Name:</span>
              </div>
              <strong className="text-slate-900 dark:text-white text-sm font-sans">{data.candidate_name}</strong>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <span>Assessment Title:</span>
              </div>
              <strong className="text-slate-900 dark:text-white text-sm font-sans">{data.assessment_title}</strong>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Sparkles className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>Verified Score:</span>
              </div>
              <span className="text-base text-amber-600 dark:text-amber-400 font-bold">{data.score_percentage}%</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>Date Issued:</span>
              </div>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{data.issue_date}</span>
            </div>

            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Building className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>Issuing Authority:</span>
              </div>
              <span className="text-slate-700 dark:text-slate-300 font-medium">{data.issuer}</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                <span>HMAC Signature Hash:</span>
              </div>
              <span className="text-slate-600 dark:text-slate-400 text-[11px] font-mono">{data.verification_hash}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-600 dark:text-slate-400">
            This verification record was retrieved directly from the secure immutable assessment registry.
          </div>
        </div>
      )}

    </div>
  );
};
