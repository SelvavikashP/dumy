import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ShieldAlert, AlertTriangle, Clock, Eye, Activity, Filter } from 'lucide-react';

export const ViolationsReviewPage: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAsmId, setSelectedAsmId] = useState<string>('');
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      try {
        const list = await api.listAssessments();
        setAssessments(list);
        if (list.length > 0) {
          setSelectedAsmId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadViolations = async (asmId: string) => {
    if (!asmId) return;
    setLoading(true);
    try {
      const data = await api.listViolations(asmId);
      setViolations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAsmId) {
      loadViolations(selectedAsmId);
    }
  }, [selectedAsmId]);

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400 uppercase tracking-wider mb-1">
            <ShieldAlert className="w-4 h-4" />
            <span>Proctoring Incident Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Violation &amp; Evidence Timeline</h1>
        </div>

        <select
          value={selectedAsmId}
          onChange={(e) => setSelectedAsmId(e.target.value)}
          className="bg-surface-850 text-slate-200 rounded-xl px-3.5 py-2 text-xs border border-slate-700 font-mono focus:outline-none focus:border-brand-500"
        >
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {/* Overview Notice */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
        <strong className="text-white">Ethical Proctoring Telemetry:</strong> All automated signals (e.g. tab switches, face presence checks) are treated as probabilistic risk indicators rather than definitive proof of malpractice.
      </div>

      {/* Chronological Timeline */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white">Chronological Signal Feed ({violations.length} Events)</h3>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">Loading incident timeline...</div>
        ) : violations.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No proctoring violations or security alerts recorded for this assessment.
          </div>
        ) : (
          <div className="relative border-l border-slate-800 ml-4 space-y-6">
            {violations.map((ev, idx) => (
              <div key={ev.id || idx} className="ml-6 relative">
                {/* Node dot */}
                <div
                  className={`w-3 h-3 rounded-full absolute -left-[31px] top-1.5 border-2 border-surface-900 ${
                    ev.severity === 'CRITICAL' || ev.severity === 'HIGH' ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                />

                <div className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{ev.candidate_name}</span>
                      <span className="text-slate-400">({ev.candidate_email})</span>
                    </div>
                    <span className="text-slate-400">
                      {new Date(ev.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 text-[11px] font-mono font-bold">
                      {ev.event_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      Severity: <strong className="text-white">{ev.severity}</strong> &bull; Confidence: {(ev.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {ev.warning_issued && (
                    <div className="text-[11px] text-amber-300 font-mono flex items-center space-x-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Security Warning Issued to Candidate</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
