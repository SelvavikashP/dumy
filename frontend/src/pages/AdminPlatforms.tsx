import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Globe2, Activity, CheckCircle2, XCircle, RefreshCw, Key, ShieldCheck } from 'lucide-react';

export const AdminPlatforms: React.FC = () => {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [testingSlug, setTestingSlug] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ slug: string; res: any } | null>(null);

  const loadPlatforms = async () => {
    try {
      const data = await api.listPlatforms();
      setPlatforms(data);
    } catch (e) {
      console.error('Failed to load platforms:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlatforms();
  }, []);

  const togglePlatform = async (p: any) => {
    try {
      await api.updatePlatform(p.slug, { is_enabled: !p.is_enabled });
      loadPlatforms();
    } catch (e) {
      console.error(e);
    }
  };

  const testConnection = async (slug: string) => {
    setTestingSlug(slug);
    setTestResult(null);
    try {
      const res = await api.testPlatformConnection(slug);
      setTestResult({ slug, res });
      loadPlatforms();
    } catch (err: any) {
      setTestResult({ slug, res: { status: 'OFFLINE', message: err.message } });
    } finally {
      setTestingSlug(null);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-accent-cyan uppercase tracking-wider mb-1">
          <Globe2 className="w-4 h-4" />
          <span>Competitive Programming Integrations</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">External Coding Platforms</h1>
        <p className="text-sm text-slate-400 mt-1 max-w-3xl leading-relaxed">
          Configure compliant official APIs and problem reference schemas for international competitive programming platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {platforms.map((p) => {
          const isTesting = testingSlug === p.slug;
          const currentTest = testResult?.slug === p.slug ? testResult.res : null;

          return (
            <div
              key={p.id || p.slug}
              className={`glass-panel p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                p.is_enabled ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-surface-850 border border-slate-700 flex items-center justify-center font-bold text-brand-400 font-mono">
                      {p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white leading-tight">{p.name}</h3>
                      <span className="text-xs text-slate-400 font-mono">slug: {p.slug}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono border ${
                      p.status === 'HEALTHY'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-mono text-slate-300 mb-6 bg-surface-900/80 p-3 rounded-xl border border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">API Endpoint:</span>
                    <span className="truncate max-w-[170px] text-slate-200">{p.api_endpoint || 'Built-in schema'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Rate Limit:</span>
                    <span>{p.rate_limit_per_min || 60} req/min</span>
                  </div>
                </div>

                {currentTest && (
                  <div
                    className={`p-2.5 rounded-xl border text-xs font-mono mb-4 flex items-center space-x-2 ${
                      currentTest.status === 'HEALTHY'
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                    }`}
                  >
                    {currentTest.status === 'HEALTHY' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}
                    <span className="truncate">{currentTest.message || currentTest.status}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  onClick={() => testConnection(p.slug)}
                  disabled={isTesting}
                  className="px-3 py-1.5 rounded-lg bg-surface-850 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 transition flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Probing...' : 'Test Probe'}</span>
                </button>

                <button
                  onClick={() => togglePlatform(p)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition ${
                    p.is_enabled
                      ? 'bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-800/40'
                      : 'bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-800/40'
                  }`}
                >
                  {p.is_enabled ? 'Disable Adapter' : 'Enable Adapter'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
