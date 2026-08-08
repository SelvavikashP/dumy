import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Users, 
  Layers, 
  Eye, 
  AlertTriangle, 
  ShieldCheck, 
  Globe2, 
  Activity, 
  Sparkles,
  Server,
  ArrowUpRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.getAdminOverview();
        setOverview(data);
      } catch (e) {
        console.error('Failed to load admin overview:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-accent-purple uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Portal Admin Control Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Executive System Telemetry</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/portal-admin/creators"
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-sm transition shadow-lg shadow-brand-600/30 flex items-center space-x-1.5"
          >
            <Users className="w-4 h-4" />
            <span>Manage Creators</span>
          </Link>
          <Link
            to="/portal-admin/settings"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium transition"
          >
            Platform Policies
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl glass-card border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Test Creators</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white font-mono">{overview?.total_test_creators || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Authorized Recruiter Leads</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Candidates</span>
            <div className="p-2 rounded-xl bg-accent-emerald/10 text-accent-emerald">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-accent-emerald font-mono">{overview?.total_test_attenders || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Registered Test Attenders</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Assessments</span>
            <div className="p-2 rounded-xl bg-accent-cyan/10 text-accent-cyan">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-white font-mono">{overview?.total_assessments || 0}</div>
          <div className="text-xs text-slate-400 mt-1">Active Question Catalogs</div>
        </div>

        <div className="p-5 rounded-2xl glass-card border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 uppercase">Total Attempts</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-3xl font-bold text-purple-300 font-mono">{overview?.total_attempts || 0}</div>
          <div className="text-xs text-slate-400 mt-1">{overview?.active_attempts_now || 0} Active Right Now</div>
        </div>
      </div>

      {/* Control Panels & Integrations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-white">Platform Governance Quick Controls</h3>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Status: {overview?.system_status}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Link
              to="/portal-admin/creators"
              className="p-4 rounded-xl bg-surface-850 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-white text-sm">Test Creator Permissions</div>
                <div className="text-xs text-slate-400 mt-0.5">Toggle granular abilities &amp; AI access</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition" />
            </Link>

            <Link
              to="/portal-admin/platforms"
              className="p-4 rounded-xl bg-surface-850 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-white text-sm">Coding Platform Adapters</div>
                <div className="text-xs text-slate-400 mt-0.5">HackerRank, LeetCode, Codeforces</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition" />
            </Link>

            <Link
              to="/portal-admin/settings"
              className="p-4 rounded-xl bg-surface-850 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-white text-sm">Proctoring &amp; Warning Thresholds</div>
                <div className="text-xs text-slate-400 mt-0.5">Camera, mic, suspension policies</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition" />
            </Link>

            <Link
              to="/portal-admin/audit-logs"
              className="p-4 rounded-xl bg-surface-850 hover:bg-slate-800/80 border border-slate-800 transition flex items-center justify-between group"
            >
              <div>
                <div className="font-semibold text-white text-sm">System Audit Trail</div>
                <div className="text-xs text-slate-400 mt-0.5">Immutable action log records</div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition" />
            </Link>
          </div>
        </div>

        {/* Security & Incident Snapshot */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-sm font-bold text-white mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Proctoring Incident Telemetry</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Real-time violation events processed across all active assessments and test sessions.
            </p>

            <div className="my-6 p-4 rounded-xl bg-surface-850 border border-slate-800 text-center font-mono">
              <div className="text-3xl font-bold text-amber-300">{overview?.total_proctoring_incidents || 0}</div>
              <div className="text-xs text-slate-400 mt-1">Logged Sentinel Risk Signals</div>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400 text-center">
            Zero-Trust Architectural Model Active
          </div>
        </div>
      </div>
    </div>
  );
};
