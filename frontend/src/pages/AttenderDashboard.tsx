import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Award,
  AlertCircle,
  FileCheck,
  UserCheck
} from 'lucide-react';

export const AttenderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.listAssignedAssessments();
        setAssessments(data);
      } catch (e) {
        console.error('Failed to load assigned assessments:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Candidate Profile Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-surface-900 rounded-[14px] flex items-center justify-center font-extrabold text-xl text-white">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">{user?.full_name}</h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Verified Candidate
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-surface-850 border border-slate-800 text-slate-300">
            Assigned Exams: <strong className="text-white">{assessments.length}</strong>
          </div>
        </div>
      </div>

      {/* Assigned Assessments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-400" />
            <span>Assigned Proctored Assessments</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs font-mono">
            Loading your assigned assessments...
          </div>
        ) : assessments.length === 0 ? (
          <div className="py-16 text-center glass-panel rounded-2xl border border-slate-800 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No Pending Assessments</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              You are all caught up! New recruitment invitations will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessments.map((asm) => {
              const attempt = asm.latest_attempt;
              const isCompleted = attempt?.status === 'COMPLETED';
              const isSuspended = attempt?.status === 'SUSPENDED';
              const isActive = attempt?.status === 'ACTIVE';

              return (
                <div
                  key={asm.id}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-base font-bold text-white leading-tight">{asm.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                        {asm.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {asm.description || 'Comprehensive proctored assessment.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 bg-surface-900/80 p-3 rounded-xl border border-slate-800 mb-5">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-400" />
                        <span>{asm.duration_minutes} Mins</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-accent-cyan" />
                        <span>Proctor: {asm.proctoring_level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Entry Action */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      {isCompleted && (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed ({attempt.score} pts &bull; {attempt.percentage}%)</span>
                        </div>
                      )}
                      {isSuspended && (
                        <div className="flex items-center space-x-1.5 text-xs text-rose-400 font-mono font-semibold">
                          <AlertCircle className="w-4 h-4" />
                          <span>Session Suspended</span>
                        </div>
                      )}
                      {!isCompleted && !isSuspended && (
                        <span className="text-xs text-slate-400 font-mono">
                          {isActive ? 'Session in progress' : 'Ready to begin'}
                        </span>
                      )}
                    </div>

                    <div>
                      {isCompleted ? (
                        <Link
                          to={`/assessment/${asm.id}/result?attempt_id=${attempt.id}`}
                          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs font-sans transition"
                        >
                          View Scorecard
                        </Link>
                      ) : isSuspended ? (
                        <Link
                          to={`/assessment/${asm.id}/reattempt?attempt_id=${attempt.id}`}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs font-sans transition"
                        >
                          Request Reattempt
                        </Link>
                      ) : (
                        <Link
                          to={`/assessment/${asm.id}/instructions`}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-1.5"
                        >
                          <span>{isActive ? 'Resume Test' : 'Start Assessment'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
