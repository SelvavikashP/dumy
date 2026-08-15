import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  Settings, 
  Shield, 
  Cpu, 
  Mail, 
  Send, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Info 
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  // Proctoring Policies
  const [maxWarnings, setMaxWarnings] = useState<number>(3);
  const [autoSuspension, setAutoSuspension] = useState<boolean>(true);
  const [allowVoice, setAllowVoice] = useState<boolean>(true);
  const [allowFullscreen, setAllowFullscreen] = useState<boolean>(true);
  const [judgeTimeout, setJudgeTimeout] = useState<number>(5);

  // AI Generator Settings
  const [aiProvider, setAiProvider] = useState<string>('builtin_expert');
  const [aiModel, setAiModel] = useState<string>('gemini-1.5-pro');

  // Gmail & SMTP Settings
  const [smtpHost, setSmtpHost] = useState<string>('smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPassword, setSmtpPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [fromName, setFromName] = useState<string>('EvalAI Assessment Platform');
  const [fromEmail, setFromEmail] = useState<string>('');
  const [useTls, setUseTls] = useState<boolean>(true);
  const [frontendUrl, setFrontendUrl] = useState<string>('http://localhost:5173');
  const [isConfigured, setIsConfigured] = useState<boolean>(false);

  // Test Email tool
  const [testRecipient, setTestRecipient] = useState<string>('');
  const [testSending, setTestSending] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Save states
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const settings = await api.getPlatformSettings();
        if (settings && settings['global_proctoring_policy']) {
          const p = settings['global_proctoring_policy'];
          setMaxWarnings(p.max_warnings || 3);
          setAutoSuspension(p.auto_suspension_enabled !== false);
          setAllowVoice(p.allow_voice ?? true);
          setAllowFullscreen(p.allow_fullscreen ?? true);
          if (p.judge_timeout_seconds) setJudgeTimeout(p.judge_timeout_seconds);
          if (p.ai_provider) setAiProvider(p.ai_provider);
          if (p.ai_model) setAiModel(p.ai_model);
        }

        const emailCfg = await api.getEmailSettings();
        if (emailCfg) {
          setSmtpHost(emailCfg.host || 'smtp.gmail.com');
          setSmtpPort(emailCfg.port || 587);
          setSmtpUser(emailCfg.user || '');
          setFromName(emailCfg.from_name || 'EvalAI Assessment Platform');
          setFromEmail(emailCfg.from_email || '');
          setUseTls(emailCfg.use_tls !== false);
          setFrontendUrl(emailCfg.frontend_url || 'http://localhost:5173');
          setIsConfigured(emailCfg.is_configured || false);
          if (emailCfg.user && !testRecipient) {
            setTestRecipient(emailCfg.user);
          }
        }
      } catch (e: any) {
        console.warn('Notice: Loading default platform parameters', e);
      }
    };
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    setErrorMessage(null);

    try {
      // 1. Save global proctoring policies
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
        }
      });

      // 2. Save SMTP configurations
      await api.updateEmailSettings({
        host: smtpHost,
        port: smtpPort,
        user: smtpUser,
        password: smtpPassword || undefined,
        from_name: fromName,
        from_email: fromEmail || smtpUser,
        use_tls: useTls,
        frontend_url: frontendUrl
      });

      setIsConfigured(Boolean(smtpUser && (smtpPassword || isConfigured)));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to persist settings. Please check server connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!testRecipient) {
      setErrorMessage('Please enter a recipient email address for testing.');
      return;
    }
    setTestSending(true);
    setTestResult(null);
    setErrorMessage(null);
    try {
      const res = await api.sendTestEmail({
        to_email: testRecipient,
        subject: '🧠 EvalAI — Live Gmail SMTP Probe',
        custom_message: 'Your Gmail SMTP integration is live and functioning perfectly for reminders and verification codes!'
      });
      setTestResult({
        success: res.success,
        message: res.message || (res.success ? 'Test email dispatched successfully!' : 'Failed to send test email.')
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'SMTP Connection Error.'
      });
    } finally {
      setTestSending(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-purple-600 dark:text-accent-purple uppercase tracking-wider mb-1 font-semibold">
          <Settings className="w-4 h-4" />
          <span>Global Platform Policies &amp; Integrations</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
          Configure real-time Gmail SMTP notifications, anti-cheat proctoring policies, and AI generation parameters.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span>All platform settings have been successfully updated and persisted!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs font-mono">
        
        {/* Gmail & SMTP Settings Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white">
              <Mail className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>Gmail &amp; SMTP Notification Engine</span>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              isConfigured 
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30' 
                : 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/30'
            }`}>
              {isConfigured ? '● Gmail Active' : '○ Local Simulation Mode'}
            </span>
          </div>

          <div className="p-3 bg-slate-100 dark:bg-surface-850/60 border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-700 dark:text-slate-300 text-[11px] font-sans flex items-start space-x-2.5">
            <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Gmail Setup Instructions:</strong> To send emails through Gmail, use your Gmail address and generate a 16-character <strong>Google App Password</strong> (from Google Account &gt; Security &gt; 2-Step Verification &gt; App passwords). If left blank, emails and OTP codes will be recorded in simulation mode in the server console for local testing.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">SMTP Host</label>
              <input
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.gmail.com"
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">SMTP Port</label>
              <input
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(parseInt(e.target.value))}
                placeholder="587"
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Sender Gmail / Email Address</label>
              <input
                type="email"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="your-account@gmail.com"
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Google App Password (16 Characters)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={smtpPassword}
                  onChange={(e) => setSmtpPassword(e.target.value)}
                  placeholder={isConfigured ? '•••••••••••••••• (Leave blank to keep existing)' : 'xxxx xxxx xxxx xxxx'}
                  className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Sender Display Name</label>
              <input
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="EvalAI Assessment Platform"
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Web Application Base URL</label>
              <input
                type="text"
                value={frontendUrl}
                onChange={(e) => setFrontendUrl(e.target.value)}
                placeholder="http://localhost:5173"
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={useTls}
                onChange={(e) => setUseTls(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700 focus:ring-brand-500"
              />
              <span className="text-slate-700 dark:text-slate-300 text-xs font-sans">
                Enable STARTTLS Encryption (Required for Gmail on Port 587)
              </span>
            </label>
          </div>

          {/* Test Email Section */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-surface-900/40 p-4 rounded-xl space-y-3 shadow-inner">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans flex items-center space-x-1.5">
              <Send className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>Live Diagnostic Email Probe</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Recipient email (e.g. test@example.com)..."
                className="w-full sm:flex-1 p-2 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
              />
              <button
                type="button"
                onClick={handleSendTestEmail}
                disabled={testSending || !testRecipient}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-sans font-semibold text-xs shadow transition disabled:opacity-50 flex items-center justify-center space-x-1.5"
              >
                <Send className={`w-3.5 h-3.5 ${testSending ? 'animate-pulse' : ''}`} />
                <span>{testSending ? 'Sending Probe...' : 'Send Test Email'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-2.5 rounded-lg text-xs font-sans flex items-center space-x-2 ${
                testResult.success 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300' 
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Proctoring & Sentinel Policies */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            <Shield className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Proctoring &amp; Browser Security Policies</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Default Warning Limit (1 - 5)</label>
              <select
                value={maxWarnings}
                onChange={(e) => setMaxWarnings(parseInt(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value={1}>1 Warning (Strict)</option>
                <option value={2}>2 Warnings</option>
                <option value={3}>3 Warnings (Recommended Default)</option>
                <option value={4}>4 Warnings</option>
                <option value={5}>5 Warnings (Lenient)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Code Judge CPU Timeout (Seconds)</label>
              <input
                type="number"
                value={judgeTimeout}
                onChange={(e) => setJudgeTimeout(parseInt(e.target.value))}
                min={1}
                max={15}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSuspension}
                onChange={(e) => setAutoSuspension(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700 focus:ring-brand-500"
              />
              <span className="text-slate-700 dark:text-slate-300 text-xs font-sans">
                Enable Automatic Session Suspension upon reaching warning threshold
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowFullscreen}
                onChange={(e) => setAllowFullscreen(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700 focus:ring-brand-500"
              />
              <span className="text-slate-700 dark:text-slate-300 text-xs font-sans">
                Allow Test Creators to enforce locked Fullscreen Mode
              </span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowVoice}
                onChange={(e) => setAllowVoice(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700 focus:ring-brand-500"
              />
              <span className="text-slate-700 dark:text-slate-300 text-xs font-sans">
                Allow Test Creators to configure Microphone &amp; Voice Monitoring
              </span>
            </label>
          </div>
        </div>

        {/* AI Generator Settings */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-accent-emerald" />
            <span>AI Engine &amp; Generation Settings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">AI Provider Service</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="builtin_expert">Built-in Expert Technical Engine (Zero-Latency)</option>
                <option value="gemini">Google Gemini 1.5 Pro</option>
                <option value="openai">OpenAI GPT-4o</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Generation Model Target</label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div />

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Persisting Settings...' : 'Save All Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
