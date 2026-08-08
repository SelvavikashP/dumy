import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Settings, Shield, Cpu, Lock, AlertTriangle, Save, CheckCircle2 } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const [maxWarnings, setMaxWarnings] = useState<number>(3);
  const [autoSuspension, setAutoSuspension] = useState<boolean>(true);
  const [allowVoice, setAllowVoice] = useState<boolean>(true);
  const [allowFullscreen, setAllowFullscreen] = useState<boolean>(true);
  const [aiProvider, setAiProvider] = useState<string>('builtin_expert');
  const [aiModel, setAiModel] = useState<string>('gemini-1.5-pro');
  const [judgeTimeout, setJudgeTimeout] = useState<number>(5);

  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await api.getPlatformSettings();
        if (settings['global_proctoring_policy']) {
          const p = settings['global_proctoring_policy'];
          setMaxWarnings(p.max_warnings || 3);
          setAutoSuspension(p.auto_suspension_threshold !== undefined);
          setAllowVoice(p.allow_voice ?? true);
          setAllowFullscreen(p.allow_fullscreen ?? true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await api.updatePlatformSetting({
        setting_key: 'global_proctoring_policy',
        setting_value: {
          max_warnings: maxWarnings,
          auto_suspension_enabled: autoSuspension,
          allow_voice: allowVoice,
          allow_fullscreen: allowFullscreen,
          judge_timeout_seconds: judgeTimeout,
          ai_provider: aiProvider,
          ai_model: aiModel
        },
        description: 'Global system security and proctoring policy thresholds'
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-accent-purple uppercase tracking-wider mb-1">
          <Settings className="w-4 h-4" />
          <span>Global Platform Policies</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Configuration</h1>
        <p className="text-sm text-slate-400 mt-1">
          Global policies configured here determine the baseline boundaries for all assessments and Test Creators.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs font-mono">
        {/* Proctoring & Sentinel Policies */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-brand-400" />
            <span>Proctoring &amp; Browser Security Policies</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Default Warning Limit (1 - 5)</label>
              <select
                value={maxWarnings}
                onChange={(e) => setMaxWarnings(parseInt(e.target.value))}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value={1}>1 Warning (Strict)</option>
                <option value={2}>2 Warnings</option>
                <option value={3}>3 Warnings (Recommended Default)</option>
                <option value={4}>4 Warnings</option>
                <option value={5}>5 Warnings (Lenient)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Code Judge CPU Timeout (Seconds)</label>
              <input
                type="number"
                value={judgeTimeout}
                onChange={(e) => setJudgeTimeout(parseInt(e.target.value))}
                min={1}
                max={15}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSuspension}
                onChange={(e) => setAutoSuspension(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-surface-850 border-slate-700 focus:ring-brand-500"
              />
              <span className="text-slate-300 text-xs font-sans">
                Enable Automatic Session Suspension upon reaching warning threshold
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowFullscreen}
                onChange={(e) => setAllowFullscreen(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-surface-850 border-slate-700 focus:ring-brand-500"
              />
              <span className="text-slate-300 text-xs font-sans">
                Allow Test Creators to enforce locked Fullscreen Mode
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowVoice}
                onChange={(e) => setAllowVoice(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-surface-850 border-slate-700 focus:ring-brand-500"
              />
              <span className="text-slate-300 text-xs font-sans">
                Allow Test Creators to configure Microphone &amp; Voice Monitoring
              </span>
            </label>
          </div>
        </div>

        {/* AI Generator Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-white border-b border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-accent-emerald" />
            <span>AI Engine &amp; Generation Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">AI Provider Service</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="builtin_expert">Built-in Expert Technical Engine (Zero-Latency)</option>
                <option value="gemini">Google Gemini 1.5 Pro</option>
                <option value="openai">OpenAI GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Generation Model Target</label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <div className="flex items-center space-x-2 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings successfully persisted to platform storage!</span>
            </div>
          ) : <div />}

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting Policies...' : 'Save Global Policies'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
