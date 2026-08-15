import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Layers, 
  Plus, 
  Trash2, 
  ShieldCheck, 
  Code2, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

export const AssessmentBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Step 1: Assessment Meta
  const [title, setTitle] = useState<string>('Senior Backend & Systems Engineer Assessment');
  const [description, setDescription] = useState<string>('Evaluates core algorithms, concurrency, system design, and database queries in an isolated judge environment.');
  const [duration, setDuration] = useState<number>(60);
  const [passingPercentage, setPassingPercentage] = useState<number>(65.0);
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [negativeMarking, setNegativeMarking] = useState<boolean>(true);
  const [negativeValue, setNegativeValue] = useState<number>(0.25);

  // Step 2: Sections & Questions
  const [sections, setSections] = useState<any[]>([
    {
      title: 'Section 1 — Quantitative & Logical Aptitude',
      description: 'Analytical reasoning and mathematical deduction.',
      duration_minutes: 20,
      section_order: 1,
      questions: [
        {
          type: 'APTITUDE',
          topic: 'Time and Work',
          skill: 'Quantitative Aptitude',
          difficulty: 'MEDIUM',
          problem_statement: 'A pump can fill a reservoir in 4 hours, but due to a leak it takes 5 hours. In how many hours will the leak alone empty the full reservoir?',
          points: 2.0,
          negative_points: 0.5,
          options: [
            { option_text: '15 hours', is_correct: false },
            { option_text: '20 hours', is_correct: true, explanation: '1/4 - 1/5 = 1/20 => 20 hours' },
            { option_text: '25 hours', is_correct: false },
            { option_text: '30 hours', is_correct: false }
          ]
        }
      ]
    },
    {
      title: 'Section 2 — Algorithmic Programming Challenge',
      description: 'Hands-on coding problem executed against hidden test cases.',
      duration_minutes: 40,
      section_order: 2,
      questions: [
        {
          type: 'CODING',
          topic: 'Algorithms',
          skill: 'Data Structures',
          difficulty: 'MEDIUM',
          problem_statement: 'Given an array of integers nums and an integer k, return the count of continuous subarrays whose sum equals to k.',
          points: 10.0,
          negative_points: 0.0,
          coding_problem: {
            title: 'Subarray Sum Equals K',
            statement: 'Given an array of integers nums and an integer k, return the count of continuous subarrays whose sum equals to k.',
            input_format: 'N\nnums[0] ... nums[N-1]\nK',
            output_format: 'Integer count',
            constraints: '1 <= N <= 2*10^4',
            examples: [{ input: '3\n1 1 1\n2', output: '2' }],
            default_code: {
              python: "import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    k = int(lines[n+1])\n    # Implement prefix sum\n    print(2)\nsolve()"
            },
            reference_solution: "import sys\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    k = int(lines[n+1])\n    count = 0\n    curr = 0\n    p = {0: 1}\n    for x in nums:\n        curr += x\n        if curr - k in p: count += p[curr - k]\n        p[curr] = p.get(curr, 0) + 1\n    print(count)\nsolve()",
            time_limit_seconds: 2.0,
            memory_limit_mb: 256,
            supported_languages: ['python', 'javascript', 'cpp', 'java'],
            tags: ['Array', 'Hash Table'],
            difficulty: 'MEDIUM',
            test_cases: [
              { input_data: '3\n1 1 1\n2', expected_output: '2', is_hidden: false, points: 2.0 },
              { input_data: '5\n1 -1 0 1 -1\n0', expected_output: '6', is_hidden: true, points: 3.0 }
            ]
          }
        }
      ]
    }
  ]);

  // Step 3: Proctoring & Security
  const [proctoringLevel, setProctoringLevel] = useState<string>('STANDARD');
  const [cameraRequired, setCameraRequired] = useState<boolean>(true);
  const [micRequired, setMicRequired] = useState<boolean>(false);
  const [fullscreenRequired, setFullscreenRequired] = useState<boolean>(true);
  const [tabDetection, setTabDetection] = useState<boolean>(true);
  const [warningLimit, setWarningLimit] = useState<number>(3);
  const [autoSuspension, setAutoSuspension] = useState<boolean>(true);

  const addSection = () => {
    setSections((prev) => [
      ...prev,
      {
        title: `Section ${prev.length + 1}`,
        description: 'New assessment section.',
        duration_minutes: 30,
        section_order: prev.length + 1,
        questions: []
      }
    ]);
  };

  const removeSection = (index: number) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveAssessment = async () => {
    setIsSaving(true);
    try {
      await api.createAssessment({
        title,
        description,
        duration_minutes: duration,
        passing_percentage: passingPercentage,
        difficulty,
        negative_marking: negativeMarking,
        negative_marking_value: negativeValue,
        proctoring_level: proctoringLevel,
        camera_required: cameraRequired,
        mic_required: micRequired,
        fullscreen_required: fullscreenRequired,
        tab_switch_detection: tabDetection,
        warning_limit: warningLimit,
        auto_suspend_on_limit: autoSuspension,
        sections
      });
      navigate('/creator/assessments');
    } catch (err: any) {
      alert(err.message || 'Failed to create assessment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 font-semibold">
          <Layers className="w-4 h-4" />
          <span>Assessment Authoring Wizard</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Create New Assessment</h1>
      </div>

      {/* Step Indicators */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { num: 1, label: '1. Basic Configuration' },
          { num: 2, label: '2. Sections & Problems' },
          { num: 3, label: '3. Proctoring & Security' }
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => setStep(s.num)}
            className={`p-3.5 rounded-xl border text-xs font-mono text-left transition ${
              step === s.num
                ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 shadow-md ring-1 ring-brand-500/30'
                : step > s.num
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-400'
                : 'bg-white dark:bg-surface-850 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            <span className="font-bold">{s.label}</span>
          </button>
        ))}
      </div>

      {/* Step 1: Basic Config */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs font-mono shadow-sm">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Assessment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Description &amp; Guidelines</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full p-3 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Total Duration (Minutes)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                min={10}
                max={240}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Passing Score (%)</label>
              <input
                type="number"
                value={passingPercentage}
                onChange={(e) => setPassingPercentage(parseFloat(e.target.value))}
                min={10}
                max={100}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Overall Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={negativeMarking}
                onChange={(e) => setNegativeMarking(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">Enable Negative Marking for MCQ / Aptitude Questions</span>
            </label>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-xs transition shadow-lg shadow-brand-600/30 flex items-center space-x-2"
            >
              <span>Next: Configure Sections</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Sections & Questions */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Assessment Sections ({sections.length})</h3>
            <button
              onClick={addSection}
              className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-brand-700 dark:text-brand-300 border border-slate-300 dark:border-brand-800/50 text-xs font-mono flex items-center space-x-1.5 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Section</span>
            </button>
          </div>

          {sections.map((sec, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <input
                  type="text"
                  value={sec.title}
                  onChange={(e) => {
                    const next = [...sections];
                    next[idx].title = e.target.value;
                    setSections(next);
                  }}
                  className="font-bold text-slate-900 dark:text-white text-sm bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-brand-500 rounded px-1.5 py-0.5 w-2/3"
                />

                <div className="flex items-center space-x-3 text-xs font-mono text-slate-700 dark:text-slate-300">
                  <span>{sec.duration_minutes} Mins</span>
                  {sections.length > 1 && (
                    <button onClick={() => removeSection(idx)} className="text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Questions count */}
              <div className="space-y-2">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Questions in Section ({sec.questions?.length || 0}):
                </div>
                {sec.questions?.map((q: any, qIdx: number) => (
                  <div key={qIdx} className="p-3 rounded-xl bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-brand-700 dark:text-brand-300 font-mono text-[10px] font-bold">{q.type}</span>
                      <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-lg">{q.problem_statement || q.coding_problem?.title}</span>
                    </div>
                    <span className="text-slate-500 dark:text-slate-400 font-mono">{q.points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent font-mono text-xs flex items-center space-x-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 flex items-center space-x-2"
            >
              <span>Next: Proctoring Policies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Proctoring & Finalize */}
      {step === 3 && (
        <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6 text-xs font-mono shadow-sm">
          <div className="flex items-center space-x-2 text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-accent-cyan" />
            <span>Proctoring, Sentinel &amp; Warning Configuration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Proctoring Enforcement Level Preset</label>
              <select
                value={proctoringLevel}
                onChange={(e) => {
                  const lvl = e.target.value;
                  setProctoringLevel(lvl);
                  if (lvl === 'OFF') {
                    setCameraRequired(false);
                    setMicRequired(false);
                    setFullscreenRequired(false);
                    setTabDetection(false);
                    setWarningLimit(5);
                    setAutoSuspension(false);
                  } else if (lvl === 'BASIC') {
                    setCameraRequired(true);
                    setMicRequired(false);
                    setFullscreenRequired(false);
                    setTabDetection(true);
                    setWarningLimit(5);
                    setAutoSuspension(false);
                  } else if (lvl === 'STANDARD') {
                    setCameraRequired(true);
                    setMicRequired(false);
                    setFullscreenRequired(true);
                    setTabDetection(true);
                    setWarningLimit(3);
                    setAutoSuspension(true);
                  } else if (lvl === 'STRICT') {
                    setCameraRequired(true);
                    setMicRequired(true);
                    setFullscreenRequired(true);
                    setTabDetection(true);
                    setWarningLimit(3);
                    setAutoSuspension(true);
                  }
                }}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value="OFF">OFF (Unproctored / Open Book Practice)</option>
                <option value="BASIC">BASIC (Tab Switch Detection Only)</option>
                <option value="STANDARD">STANDARD (Camera + Fullscreen + Tab Switching)</option>
                <option value="STRICT">STRICT (Camera + Mic + Fullscreen + Auto-Suspension)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans font-mono">Warning Threshold Limit</label>
              <select
                value={warningLimit}
                onChange={(e) => setWarningLimit(parseInt(e.target.value))}
                className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
              >
                <option value={1}>1 Warning (Strict Single-Chance)</option>
                <option value={2}>2 Warnings</option>
                <option value={3}>3 Warnings (Standard Industry Default)</option>
                <option value={4}>4 Warnings</option>
                <option value={5}>5 Warnings (Lenient)</option>
                <option value={10}>10 Warnings (Maximum Tolerance)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={cameraRequired}
                onChange={(e) => setCameraRequired(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">Require Live Camera Verification &amp; Face Telemetry</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={fullscreenRequired}
                onChange={(e) => setFullscreenRequired(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">Enforce Locked Fullscreen Window Mode</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tabDetection}
                onChange={(e) => setTabDetection(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">Detect Browser Tab Switching and Window Focus Loss</span>
            </label>

            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoSuspension}
                onChange={(e) => setAutoSuspension(e.target.checked)}
                className="w-4 h-4 text-brand-600 rounded bg-white dark:bg-surface-850 border-slate-300 dark:border-slate-700"
              />
              <span className="text-slate-700 dark:text-slate-300 font-sans text-xs">Auto-suspend attempt when security warning threshold is reached</span>
            </label>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setStep(2)}
              className="px-5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent font-mono text-xs flex items-center space-x-2 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sections</span>
            </button>

            <button
              onClick={handleSaveAssessment}
              disabled={isSaving}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-bold text-xs shadow-xl shadow-brand-600/30 transition flex items-center space-x-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSaving ? 'Creating Assessment...' : 'Publish Assessment to Catalog'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
