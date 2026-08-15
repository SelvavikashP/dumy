import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Clock, 
  Camera, 
  Maximize2, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  Layers, 
  Lock 
} from 'lucide-react';

export const AssessmentInstructions: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [consentGiven, setConsentGiven] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await api.getAssessment(id);
        setAssessment(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !assessment) {
    return (
      <div className="p-12 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">
        Loading assessment guidelines...
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Pre-Test Verification &amp; Instructions</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">{assessment.title}</h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">{assessment.description}</p>
      </div>

      {/* Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs font-sans shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Format &amp; Structure</span>
          </h3>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            <li>&bull; Total Duration: <strong className="text-slate-900 dark:text-white font-mono">{assessment.duration_minutes} Minutes</strong>.</li>
            <li>&bull; Sections: <strong className="text-slate-900 dark:text-white font-mono">{assessment.sections?.length || 0} Sections</strong> (Aptitude, MCQs, Coding).</li>
            <li>&bull; Negative Marking: <strong className="text-slate-900 dark:text-white font-mono">{assessment.negative_marking ? `Yes (-${assessment.negative_marking_value} pts)` : 'None'}</strong>.</li>
            <li>&bull; Server-Authoritative Timer: The exam automatically submits when time expires.</li>
          </ul>
        </div>

        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 text-xs font-sans shadow-sm">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Lock className="w-4 h-4 text-cyan-600 dark:text-accent-cyan" />
            <span>Proctoring &amp; Browser Lock</span>
          </h3>
          <ul className="space-y-2 text-slate-700 dark:text-slate-300">
            <li>&bull; Webcam Telemetry: Continuous face presence &amp; room check.</li>
            <li>&bull; Fullscreen Lock: Exiting fullscreen generates a security event.</li>
            <li>&bull; Tab Detection: Do not switch away from the test window.</li>
            <li>&bull; Warning Threshold: <strong className="text-slate-900 dark:text-white font-mono">{assessment.warning_limit} Warnings</strong> before auto-suspension.</li>
          </ul>
        </div>
      </div>

      {/* Consent & Proceed */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="w-4 h-4 mt-0.5 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700"
          />
          <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
            I acknowledge that this assessment session is actively proctored with web camera, audio telemetry, and browser focus monitoring. I consent to adhere to all assessment integrity policies.
          </span>
        </label>

        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs"
          >
            Cancel &amp; Return
          </Link>

          <button
            onClick={() => navigate(`/assessment/${id}/system-check`)}
            disabled={!consentGiven}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <span>Proceed to System Readiness Check</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
