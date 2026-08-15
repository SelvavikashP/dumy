import React from 'react';
import { LiveCandidate } from '../types';
import { Camera, Clock, AlertTriangle, ShieldCheck, ShieldAlert, User, Activity } from 'lucide-react';

interface LiveCandidateCardProps {
  candidate: LiveCandidate;
  onViewTimeline?: (attemptId: string) => void;
}

export const LiveCandidateCard: React.FC<LiveCandidateCardProps> = ({ candidate, onViewTimeline }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getRiskBadgeColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-100 dark:bg-rose-500/20 border-rose-300 dark:border-rose-500/50 text-rose-700 dark:text-rose-300';
      case 'HIGH':
        return 'bg-amber-100 dark:bg-amber-500/20 border-amber-300 dark:border-amber-500/50 text-amber-700 dark:text-amber-300';
      case 'MEDIUM':
        return 'bg-yellow-100 dark:bg-yellow-500/20 border-yellow-300 dark:border-yellow-500/50 text-yellow-700 dark:text-yellow-300';
      default:
        return 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300';
    }
  };

  return (
    <div className="glass-card rounded-2xl p-4 border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition duration-200 shadow-sm font-sans">
      <div>
        {/* Header: Candidate Info & Risk Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
              {candidate.candidate_name.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-tight">{candidate.candidate_name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px] font-mono">{candidate.candidate_email}</p>
            </div>
          </div>

          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border font-mono ${getRiskBadgeColor(candidate.risk_level)}`}>
            {candidate.risk_level} RISK
          </span>
        </div>

        {/* Live Status Row */}
        <div className="grid grid-cols-2 gap-2 my-3 text-xs font-mono">
          <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-slate-50 dark:bg-surface-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{candidate.status === 'ACTIVE' ? formatTime(candidate.time_remaining_seconds) : candidate.status}</span>
          </div>

          <div className="flex items-center space-x-1.5 p-2 rounded-lg bg-slate-50 dark:bg-surface-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            <AlertTriangle className={`w-3.5 h-3.5 ${candidate.warnings_count > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
            <span>Warnings: {candidate.warnings_count} / {candidate.warning_limit}</span>
          </div>
        </div>

        {/* Last telemetry event */}
        {candidate.last_event && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-surface-900/80 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 mb-3 flex items-center space-x-1.5 font-mono">
            <Activity className="w-3.5 h-3.5 text-cyan-600 dark:text-accent-cyan flex-shrink-0" />
            <span className="truncate">Last Signal: {candidate.last_event.event_type.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-1.5 text-[11px] font-mono">
          <span className={`w-2 h-2 rounded-full ${candidate.camera_online ? 'bg-emerald-500 animate-ping' : 'bg-slate-400 dark:bg-slate-600'}`} />
          <span className="text-slate-600 dark:text-slate-400">{candidate.camera_online ? 'Stream Online' : 'Offline'}</span>
        </div>

        {onViewTimeline && (
          <button
            onClick={() => onViewTimeline(candidate.attempt_id)}
            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium transition"
          >
            Review Evidence &rarr;
          </button>
        )}
      </div>
    </div>
  );
};
