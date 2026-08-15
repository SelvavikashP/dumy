import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Terminal, 
  BrainCircuit, 
  Sparkles, 
  Layers, 
  Lock, 
  Cpu, 
  Eye, 
  CheckCircle2, 
  ArrowRight,
  Code2,
  Users
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-28 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-slate-50 via-white to-slate-50 dark:from-surface-900 dark:via-surface-850 dark:to-surface-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-500/10 dark:from-brand-600/15 via-transparent to-transparent pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 text-brand-700 dark:text-brand-300 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse-subtle font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-accent-cyan" />
            <span>Next-Gen AI Proctored Recruitment Assessment Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Enterprise Assessments. <br />
            <span className="bg-gradient-to-r from-brand-600 via-cyan-600 to-emerald-600 dark:from-brand-400 dark:via-accent-cyan dark:to-accent-emerald bg-clip-text text-transparent">
              Zero-Compromise Proctoring.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Conduct multi-section aptitude, technical MCQs, and competitive programming challenges in an isolated sandbox with AI generation and ethical server-authoritative proctoring.
          </p>

          {/* Call to Actions */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-base shadow-xl shadow-brand-600/25 transition-all duration-200 flex items-center justify-center space-x-2 group"
            >
              <span>Explore Platform Demo</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>

            <Link
              to="/setup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-semibold text-base transition-all duration-200 flex items-center justify-center space-x-2 shadow-sm"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-accent-purple" />
              <span>First-Time Setup Wizard</span>
            </Link>
          </div>

          {/* Key Metric Highlights */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono">3-Tier</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Strict RBAC &amp; Single Admin</div>
            </div>
            <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-2xl font-bold text-cyan-600 dark:text-accent-cyan font-mono">8+ Langs</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Isolated Code Judge</div>
            </div>
            <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-2xl font-bold text-emerald-600 dark:text-accent-emerald font-mono">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Server-Authoritative Timer</div>
            </div>
            <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="text-2xl font-bold text-brand-600 dark:text-brand-400 font-mono">AI Studio</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Draft &rarr; Validate &rarr; Publish</div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Engineered for Technical Excellence</h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2 max-w-2xl mx-auto">
            From algorithmic problem solving inspired by global competitive platforms to privacy-preserving proctoring.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:border-brand-500/40 transition-all duration-300 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400 mb-5">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Competitive Code Judge</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Monaco code editor with Python, JavaScript, C++, Java, and Go. Evaluates code against public samples and hidden test cases with strict CPU, wall time, and memory isolation.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center text-xs font-mono text-brand-600 dark:text-brand-400 font-semibold">
              <span>Diff viewer &bull; Timeouts &bull; Partial credits</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-all duration-300 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-cyan-50 dark:bg-accent-cyan/10 border border-cyan-200 dark:border-accent-cyan/20 flex items-center justify-center text-cyan-600 dark:text-accent-cyan mb-5">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Proctoring &amp; Browser Lock</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Webcam presence, audio level signals, fullscreen enforcement, and tab-switch detection. Automatic neutral suspension when configured warning limits are exceeded.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center text-xs font-mono text-cyan-600 dark:text-accent-cyan font-semibold">
              <span>Risk Scoring &bull; 1-5 Warnings &bull; Neutral Language</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between shadow-sm">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-accent-emerald/10 border border-emerald-200 dark:border-accent-emerald/20 flex items-center justify-center text-emerald-600 dark:text-accent-emerald mb-5">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">AI Assessment Studio</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Natural language exam generation for any engineering role. Automatically validates reference solutions against generated test cases before publication.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center text-xs font-mono text-emerald-600 dark:text-accent-emerald font-semibold">
              <span>Draft &bull; Review &bull; Approved &bull; Published</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
