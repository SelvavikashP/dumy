import React, { useState } from 'react';
import { api } from '../services/api';
import { Sparkles, X, BrainCircuit, CheckCircle2, AlertCircle, Layers, Code2, ArrowRight } from 'lucide-react';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({ isOpen, onClose, onCreated }) => {
  const [prompt, setPrompt] = useState<string>(
    'Create a comprehensive 60-minute Full Stack Software Engineer assessment containing Quantitative Aptitude, SQL database queries, and an algorithmic competitive programming challenge with hidden test cases.'
  );
  const [jobRole, setJobRole] = useState<string>('Full Stack Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState<string>('Mid-to-Senior Level');
  const [duration, setDuration] = useState<number>(60);
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [aptitudeCount, setAptitudeCount] = useState<number>(2);
  const [mcqCount, setMcqCount] = useState<number>(2);
  const [codingCount, setCodingCount] = useState<number>(1);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [draft, setDraft] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);
    setDraft(null);

    try {
      const res = await api.generateAIAssessment({
        prompt,
        job_role: jobRole,
        experience_level: experienceLevel,
        duration_minutes: duration,
        difficulty,
        skills: ['Python', 'Algorithms', 'SQL', 'Quantitative Aptitude'],
        aptitude_count: aptitudeCount,
        mcq_count: mcqCount,
        coding_count: codingCount
      });
      setDraft(res);
    } catch (err: any) {
      setError(err.message || 'Failed to generate assessment');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApproveAndSave = async () => {
    if (!draft) return;
    setIsSaving(true);
    setError(null);

    try {
      await api.createAssessment({
        title: draft.title,
        description: draft.description,
        duration_minutes: draft.duration_minutes,
        passing_percentage: 60.0,
        difficulty: draft.difficulty,
        instructions: '• Server proctored assessment.\n• Complete all sections.\n• Sandboxed coding judge enabled.',
        randomize_questions: false,
        negative_marking: true,
        negative_marking_value: 0.25,
        proctoring_level: 'STANDARD',
        camera_required: true,
        microphone_required: false,
        fullscreen_required: true,
        tab_detection_enabled: true,
        warning_limit: 3,
        auto_suspension_enabled: true,
        reattempt_policy: 'MANUAL',
        max_reattempts: 1,
        difficulty_escalation: true,
        sections: draft.sections
      });
      onCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to save generated assessment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col justify-between">
        
        {/* Header */}
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan text-white">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white leading-tight">AI Assessment Generator</h3>
                <p className="text-xs text-slate-400 font-mono">DRAFT &rarr; REVIEW &rarr; APPROVED &rarr; PUBLISHED</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="p-3 mb-4 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Generator Input Form */}
          {!draft ? (
            <form onSubmit={handleGenerate} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Natural Language Assessment Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={3}
                  required
                  className="w-full p-3 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 font-sans text-xs leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Experience Level</label>
                  <input
                    type="text"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duration (Mins)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(parseInt(e.target.value))}
                    min={15}
                    max={180}
                    className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-surface-900 rounded-xl border border-slate-800 text-center">
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Aptitude Qs</label>
                  <input
                    type="number"
                    value={aptitudeCount}
                    onChange={(e) => setAptitudeCount(parseInt(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full p-1.5 bg-surface-850 border border-slate-700 rounded-lg text-slate-100 text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">MCQ Qs</label>
                  <input
                    type="number"
                    value={mcqCount}
                    onChange={(e) => setMcqCount(parseInt(e.target.value))}
                    min={1}
                    max={10}
                    className="w-full p-1.5 bg-surface-850 border border-slate-700 rounded-lg text-slate-100 text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[11px] mb-1">Coding Challenges</label>
                  <input
                    type="number"
                    value={codingCount}
                    onChange={(e) => setCodingCount(parseInt(e.target.value))}
                    min={1}
                    max={5}
                    className="w-full p-1.5 bg-surface-850 border border-slate-700 rounded-lg text-slate-100 text-center"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-semibold text-xs shadow-xl shadow-brand-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isGenerating ? 'Synthesizing Assessment & Validating Test Cases...' : 'Generate Assessment Draft'}</span>
              </button>
            </form>
          ) : (
            /* Review Generated Draft */
            <div className="space-y-4 text-xs font-sans">
              <div className="p-4 rounded-xl bg-surface-900 border border-slate-800">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base">{draft.title}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono text-[10px]">
                    {draft.validation_summary?.status || 'APPROVED'}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">{draft.description}</p>
                
                {draft.validation_summary && (
                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs font-mono flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                    <span>{draft.validation_summary.test_case_validation}</span>
                  </div>
                )}
              </div>

              {/* Sections Preview */}
              <div className="space-y-3">
                <h5 className="font-bold text-slate-200 text-xs font-mono uppercase tracking-wider">
                  Generated Sections &amp; Questions ({draft.sections.length} Sections)
                </h5>

                {draft.sections.map((sec: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-surface-850 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between font-mono font-bold text-slate-200 text-xs">
                      <span>{sec.title}</span>
                      <span className="text-slate-400 text-[11px]">{sec.questions.length} Questions</span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {sec.questions.map((q: any, qIdx: number) => (
                        <div key={qIdx} className="p-2 rounded-lg bg-surface-900 text-xs text-slate-300 flex items-center justify-between">
                          <div className="flex items-center space-x-2 truncate">
                            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-brand-300">{q.type}</span>
                            <span className="truncate max-w-md">{q.problem_statement || q.coding_problem?.title}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">{q.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setDraft(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-mono text-xs"
                >
                  &larr; Re-generate Draft
                </button>

                <button
                  onClick={handleApproveAndSave}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSaving ? 'Publishing to Database...' : 'Approve & Create Assessment'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
