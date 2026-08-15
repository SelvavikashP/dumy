import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Layers, 
  Users, 
  Sparkles, 
  Eye, 
  Plus, 
  BarChart3, 
  AlertTriangle,
  Clock,
  ArrowRight,
  Terminal,
  FileCode
} from 'lucide-react';
import { AIGeneratorModal } from './AIGeneratorModal';

export const CreatorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAIModal, setShowAIModal] = useState<boolean>(false);

  const loadAssessments = async () => {
    try {
      const data = await api.listAssessments();
      setAssessments(data);
    } catch (e) {
      console.error('Failed to load assessments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 font-semibold">
            <Terminal className="w-4 h-4" />
            <span>Recruiter Assessment Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Recruiter'}
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-mono">
            Company Scope: <span className="font-semibold text-slate-800 dark:text-slate-200">{user?.company_name || 'TechCorp Enterprise'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-brand-500 hover:from-cyan-400 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Assessment Generator</span>
          </button>

          <Link
            to="/creator/assessments/create"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Assessment</span>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">My Assessments</span>
            <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-slate-900 dark:text-white font-mono">{assessments.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total created exams</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Published &amp; Active</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-accent-emerald/10 text-emerald-600 dark:text-accent-emerald">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-emerald-600 dark:text-accent-emerald font-mono">
            {assessments.filter((a) => a.status === 'PUBLISHED').length}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Accepting candidate attempts</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Live Surveillance</span>
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-accent-cyan/10 text-cyan-600 dark:text-accent-cyan">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-cyan-600 dark:text-accent-cyan font-mono">Real-Time</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Active proctoring stream</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Coding Sandbox</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <FileCode className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-purple-700 dark:text-purple-300 font-mono">8+ Languages</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Isolated Judge Runner</div>
        </div>
      </div>

      {/* Recent Assessments Section */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Recruitment Assessments</h3>
          <Link to="/creator/assessments" className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium font-mono">
            View All ({assessments.length}) &rarr;
          </Link>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-500 dark:text-slate-400 text-xs">Loading assessments...</div>
        ) : assessments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <Layers className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Assessments Created Yet</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              Get started by launching the AI Assessment Generator or authoring an assessment manually.
            </p>
            <button
              onClick={() => setShowAIModal(true)}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs transition inline-flex items-center space-x-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch AI Generator</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assessments.slice(0, 4).map((a) => (
              <div
                key={a.id}
                className="p-5 rounded-xl bg-white dark:bg-surface-850 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{a.title}</h4>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${
                        a.status === 'PUBLISHED'
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">{a.description || 'No description'}</p>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500 dark:text-slate-400">{a.duration_minutes} mins &bull; {a.difficulty}</span>
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/creator/live-monitoring`}
                      className="text-emerald-600 dark:text-accent-emerald hover:underline text-xs font-semibold"
                    >
                      Live
                    </Link>
                    <Link
                      to={`/creator/results`}
                      className="text-brand-600 dark:text-brand-400 hover:underline text-xs font-semibold"
                    >
                      Results
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onCreated={() => {
          setShowAIModal(false);
          loadAssessments();
        }}
      />
    </div>
  );
};
