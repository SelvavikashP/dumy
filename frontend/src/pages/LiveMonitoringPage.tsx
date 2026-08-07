import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LiveCandidateCard } from '../components/LiveCandidateCard';
import { Eye, RefreshCw, AlertTriangle, Layers, ShieldCheck, Activity } from 'lucide-react';

export const LiveMonitoringPage: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAsmId, setSelectedAsmId] = useState<string>('');
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const navigate = useNavigate();

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

  const loadLiveFeed = async (asmId: string) => {
    if (!asmId) return;
    setIsRefreshing(true);
    try {
      const feed = await api.getLiveMonitoring(asmId);
      setCandidates(feed);
    } catch (e) {
      console.error('Failed to load live feed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (selectedAsmId) {
      loadLiveFeed(selectedAsmId);
      const timer = setInterval(() => {
        loadLiveFeed(selectedAsmId);
      }, 5000); // 5s telemetry polling
      return () => clearInterval(timer);
    }
  }, [selectedAsmId]);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-accent-emerald uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-accent-emerald animate-ping" />
            <span>Real-Time Surveillance Stream</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Live Candidate Monitoring</h1>
        </div>

        <div className="flex items-center space-x-3">
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

          <button
            onClick={() => loadLiveFeed(selectedAsmId)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl bg-surface-850 hover:bg-slate-800 text-slate-300 border border-slate-700 transition"
            title="Refresh feed"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Overview Alert Banner */}
      <div className="p-4 rounded-2xl glass-card border border-slate-800 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-3">
          <Activity className="w-4 h-4 text-accent-cyan" />
          <span className="text-slate-300">
            Monitoring <strong className="text-white">{candidates.length}</strong> active &amp; registered candidate(s)
          </span>
        </div>
        <div className="flex items-center space-x-3 text-[11px] text-slate-400">
          <span>Auto-sync interval: 5s</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>
      </div>

      {/* Candidate Surveillance Grid */}
      {candidates.length === 0 ? (
        <div className="py-20 text-center space-y-3 glass-panel rounded-2xl border border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <Eye className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Active Test Attempts Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Candidates who begin their proctored assessment sessions will appear in this real-time surveillance feed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map((c) => (
            <LiveCandidateCard
              key={c.attempt_id}
              candidate={c}
              onViewTimeline={() => navigate(`/creator/violations`)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
