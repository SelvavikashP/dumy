import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MonacoCodeEditor } from '../components/MonacoCodeEditor';
import { TestCasePanel } from '../components/TestCasePanel';
import { ProctoringSentinel } from '../components/ProctoringSentinel';
import { WarningModal } from '../components/WarningModal';
import { CodeRunResult } from '../types';
import { 
  Clock, 
  Layers, 
  Send, 
  Flag, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2,
  Code2,
  FileQuestion,
  HelpCircle,
  Maximize2
} from 'lucide-react';

export const AssessmentRoom: React.FC = () => {
  const { id: assessmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState<any | null>(null);
  const [assessment, setAssessment] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Navigation State
  const [activeSectionIdx, setActiveSectionIdx] = useState<number>(0);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);

  // Answer & Code State
  const [answers, setAnswers] = useState<Record<string, { selected_options: string[]; text_answer?: string; is_marked: boolean }>>({});
  const [codingDrafts, setCodingDrafts] = useState<Record<string, { code: string; language: string }>>({});
  const [customInput, setCustomInput] = useState<string>('');
  const [codeRunResult, setCodeRunResult] = useState<CodeRunResult | null>(null);
  const [isExecutingCode, setIsExecutingCode] = useState<boolean>(false);
  const [isSubmittingCode, setIsSubmittingCode] = useState<boolean>(false);

  // Server-Authoritative Timer
  const [timeRemaining, setTimeRemaining] = useState<number>(3600);

  // Proctoring & Warnings
  const [warningCount, setWarningCount] = useState<number>(0);
  const [warningLimit, setWarningLimit] = useState<number>(3);
  const [warningModalOpen, setWarningModalOpen] = useState<boolean>(false);
  const [warningMessage, setWarningMessage] = useState<string>('');
  const [isSuspended, setIsSuspended] = useState<boolean>(false);
  const [isSubmittingTest, setIsSubmittingTest] = useState<boolean>(false);

  // Start / Restore Attempt
  useEffect(() => {
    const init = async () => {
      if (!assessmentId) return;
      try {
        const startResp = await api.startAttempt(assessmentId);
        setAttemptData(startResp);
        setAssessment(startResp.assessment_data);
        setTimeRemaining(startResp.time_remaining_seconds);
        setWarningLimit(startResp.proctoring_config.warning_limit || 3);

        // Fetch restored answers/code
        const state = await api.getAttemptState(startResp.attempt_id);
        setWarningCount(state.warning_count || 0);

        if (state.saved_answers) {
          const restoredAns: any = {};
          for (const [qId, val] of Object.entries(state.saved_answers as Record<string, any>)) {
            restoredAns[qId] = {
              selected_options: val.selected_options || [],
              text_answer: val.text_answer || '',
              is_marked: val.is_marked_for_review || false
            };
          }
          setAnswers(restoredAns);
        }

        if (state.saved_code) {
          setCodingDrafts(state.saved_code);
        }
      } catch (err: any) {
        alert(err.message || 'Failed to start attempt');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [assessmentId]);

  // Server Countdown Timer
  useEffect(() => {
    if (loading || isSuspended) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, isSuspended]);

  const handleAutoSubmit = async () => {
    if (!attemptData?.attempt_id) return;
    try {
      await api.submitAttempt(attemptData.attempt_id);
      navigate(`/assessment/${assessmentId}/result?attempt_id=${attemptData.attempt_id}`);
    } catch (e) {
      console.error(e);
    }
  };

  const currentSection = assessment?.sections?.[activeSectionIdx];
  const currentQuestion = currentSection?.questions?.[activeQuestionIdx];

  // Initialize Code template for coding question
  useEffect(() => {
    if (currentQuestion?.type === 'CODING' && currentQuestion.coding_problem) {
      const pId = currentQuestion.coding_problem.id;
      if (!codingDrafts[pId]) {
        const defaultPy = currentQuestion.coding_problem.default_code?.python || 'import sys\n\ndef solve():\n    pass\n\nif __name__ == "__main__":\n    solve()';
        setCodingDrafts((prev) => ({
          ...prev,
          [pId]: { code: defaultPy, language: 'python' }
        }));
      }
    }
  }, [currentQuestion]);

  // Autosave MCQ answer
  const handleSelectOption = async (optId: string, isMultiple = false) => {
    if (!currentQuestion || !attemptData) return;
    const qId = currentQuestion.id;
    const current = answers[qId]?.selected_options || [];
    let updated: string[];

    if (isMultiple) {
      updated = current.includes(optId) ? current.filter((x) => x !== optId) : [...current, optId];
    } else {
      updated = [optId];
    }

    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...(prev[qId] || {}), selected_options: updated, is_marked: prev[qId]?.is_marked || false }
    }));

    // Autosave to server
    try {
      await api.autosaveAnswer(attemptData.attempt_id, {
        question_id: qId,
        selected_options: updated,
        is_marked_for_review: answers[qId]?.is_marked || false,
        time_spent_seconds: 5
      });
    } catch (e) {
      console.error('Autosave failed:', e);
    }
  };

  // Toggle Mark for Review
  const toggleMarkForReview = async () => {
    if (!currentQuestion || !attemptData) return;
    const qId = currentQuestion.id;
    const isMarked = !answers[qId]?.is_marked;
    setAnswers((prev) => ({
      ...prev,
      [qId]: { ...(prev[qId] || { selected_options: [] }), is_marked: isMarked }
    }));

    try {
      await api.autosaveAnswer(attemptData.attempt_id, {
        question_id: qId,
        selected_options: answers[qId]?.selected_options || [],
        is_marked_for_review: isMarked,
        time_spent_seconds: 1
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Run Code against Sample Test Cases
  const handleRunCode = async () => {
    if (!currentQuestion?.coding_problem) return;
    const cp = currentQuestion.coding_problem;
    const draft = codingDrafts[cp.id] || { code: '', language: 'python' };

    setIsExecutingCode(true);
    setCodeRunResult(null);

    try {
      const res = await api.runCode({
        language: draft.language,
        code: draft.code,
        custom_input: customInput,
        coding_problem_id: cp.id
      });
      setCodeRunResult(res);
    } catch (err: any) {
      alert(err.message || 'Execution failed');
    } finally {
      setIsExecutingCode(false);
    }
  };

  // Submit Code Solution against all Hidden Test Cases
  const handleSubmitCode = async () => {
    if (!currentQuestion?.coding_problem || !attemptData) return;
    const cp = currentQuestion.coding_problem;
    const draft = codingDrafts[cp.id] || { code: '', language: 'python' };

    setIsSubmittingCode(true);
    try {
      const res = await api.submitCode({
        attempt_id: attemptData.attempt_id,
        coding_problem_id: cp.id,
        language: draft.language,
        code: draft.code
      });

      setCodeRunResult({
        status: res.status,
        stdout: `Submission Evaluated: ${res.passed_test_cases} / ${res.total_test_cases} Test Cases Passed. Score Awarded: ${res.score_awarded} pts.`,
        execution_time_ms: res.execution_time_ms,
        memory_used_mb: res.memory_used_mb,
        test_case_results: res.test_results
      });
    } catch (err: any) {
      alert(err.message || 'Submission failed');
    } finally {
      setIsSubmittingCode(false);
    }
  };

  // Warning Trigger handler from Sentinel
  const handleWarningTriggered = (msg: string, activeCount: number, limit: number, suspended: boolean) => {
    setWarningCount(activeCount);
    setWarningLimit(limit);
    setWarningMessage(msg);
    setIsSuspended(suspended);
    setWarningModalOpen(true);
  };

  // Final Assessment Submit
  const handleFinalSubmit = async () => {
    if (!window.confirm('Are you sure you want to finalize and submit your assessment attempt?')) return;
    setIsSubmittingTest(true);
    try {
      await api.submitAttempt(attemptData.attempt_id);
      navigate(`/assessment/${assessmentId}/result?attempt_id=${attemptData.attempt_id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to submit assessment');
    } finally {
      setIsSubmittingTest(false);
    }
  };

  const formatTimer = (secs: number) => {
    const hours = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hours > 0 ? `${hours}:` : ''}${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading || !assessment || !currentQuestion) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#090d16] text-slate-400 font-mono text-xs space-x-2">
        <div className="w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span>Initializing proctored testing environment...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 selection:bg-brand-500 font-sans select-none">
      
      {/* Top Bar: Title & Server-Authoritative Countdown */}
      <header className="h-14 px-4 bg-surface-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 font-bold font-mono text-xs">
            EP
          </div>
          <div>
            <h1 className="text-sm font-bold text-white truncate max-w-sm sm:max-w-md">{assessment.title}</h1>
            <span className="text-[11px] text-slate-400 font-mono">Section {activeSectionIdx + 1}: {currentSection?.title}</span>
          </div>
        </div>

        {/* Center: Server-Authoritative Timer */}
        <div className="flex items-center space-x-4">
          <div
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold border shadow-inner ${
              timeRemaining < 300
                ? 'bg-rose-950/60 border-rose-600/60 text-rose-300 animate-pulse'
                : 'bg-surface-850 border-slate-700 text-white'
            }`}
          >
            <Clock className="w-4 h-4 text-brand-400" />
            <span>{formatTimer(timeRemaining)}</span>
          </div>

          {/* Warning Badge */}
          <div
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-xl text-xs font-mono border ${
              warningCount > 0
                ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
                : 'bg-surface-850 border-slate-800 text-slate-400'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warnings: {warningCount} / {warningLimit}</span>
          </div>
        </div>

        {/* Right Submit */}
        <button
          onClick={handleFinalSubmit}
          disabled={isSubmittingTest}
          className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center space-x-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Finish &amp; Submit</span>
        </button>
      </header>

      {/* Main Split Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar: Sections, Palette & Sentinel */}
        <aside className="w-64 bg-surface-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 p-3 space-y-3 overflow-y-auto">
          <div className="space-y-4">
            {/* Sections Selector */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block mb-1.5">
                Assessment Sections
              </label>
              <div className="space-y-1">
                {assessment.sections.map((sec: any, sIdx: number) => (
                  <button
                    key={sIdx}
                    onClick={() => {
                      setActiveSectionIdx(sIdx);
                      setActiveQuestionIdx(0);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition truncate flex items-center justify-between ${
                      activeSectionIdx === sIdx
                        ? 'bg-brand-600/20 text-brand-300 border border-brand-500/30 font-bold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    <span className="truncate">{sec.title}</span>
                    <span className="text-[10px] font-mono text-slate-500">({sec.questions.length})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Question Palette */}
            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold block mb-1.5">
                Question Palette
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {currentSection?.questions.map((q: any, qIdx: number) => {
                  const isAnswered = (answers[q.id]?.selected_options?.length || 0) > 0 || (codingDrafts[q.coding_problem?.id]?.code?.length || 0) > 50;
                  const isMarked = answers[q.id]?.is_marked;
                  const isCurrent = activeQuestionIdx === qIdx;

                  return (
                    <button
                      key={qIdx}
                      onClick={() => setActiveQuestionIdx(qIdx)}
                      className={`h-9 rounded-lg font-mono text-xs font-bold transition flex items-center justify-center relative ${
                        isCurrent
                          ? 'ring-2 ring-brand-400 bg-brand-600 text-white'
                          : isMarked
                          ? 'bg-purple-950/80 border border-purple-500 text-purple-300'
                          : isAnswered
                          ? 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300'
                          : 'bg-surface-850 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{qIdx + 1}</span>
                      {isMarked && <span className="w-1.5 h-1.5 rounded-full bg-purple-400 absolute top-1 right-1" />}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-3 px-1">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>Answered</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-purple-400" />
                  <span>Marked</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Unvisited</span>
                </span>
              </div>
            </div>
          </div>

          {/* Proctoring Sentinel Floating Dock */}
          <div className="pt-2">
            <ProctoringSentinel
              attemptId={attemptData.attempt_id}
              cameraRequired={attemptData.proctoring_config?.camera_required}
              micRequired={attemptData.proctoring_config?.microphone_required}
              fullscreenRequired={attemptData.proctoring_config?.fullscreen_required}
              tabDetectionEnabled={attemptData.proctoring_config?.tab_detection_enabled}
              onWarningTriggered={handleWarningTriggered}
            />
          </div>
        </aside>

        {/* Center Workspace */}
        <main className="flex-1 flex flex-col overflow-hidden bg-[#0e131f]">
          
          {/* Question Header */}
          <div className="p-4 border-b border-slate-800 bg-surface-900/60 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center space-x-3">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-800/40 font-mono font-bold text-xs">
                Question {activeQuestionIdx + 1} of {currentSection?.questions.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">{currentQuestion.points} Points</span>
              {currentQuestion.negative_points > 0 && (
                <span className="text-xs text-rose-400 font-mono">(-{currentQuestion.negative_points} Neg)</span>
              )}
            </div>

            <button
              onClick={toggleMarkForReview}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-mono border transition ${
                answers[currentQuestion.id]?.is_marked
                  ? 'bg-purple-950 text-purple-300 border-purple-500'
                  : 'bg-surface-850 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <Flag className="w-3 h-3" />
              <span>{answers[currentQuestion.id]?.is_marked ? 'Marked for Review' : 'Mark for Review'}</span>
            </button>
          </div>

          {/* MCQ / Aptitude View */}
          {currentQuestion.type !== 'CODING' && currentQuestion.type !== 'PROGRAMMING_CHALLENGE' ? (
            <div className="flex-1 p-6 overflow-y-auto max-w-4xl mx-auto w-full space-y-6">
              <div className="p-6 rounded-2xl glass-panel border border-slate-800 space-y-4">
                <div className="text-sm sm:text-base text-slate-100 font-sans leading-relaxed whitespace-pre-wrap">
                  {currentQuestion.problem_statement}
                </div>

                {/* Options List */}
                <div className="space-y-3 pt-4">
                  {currentQuestion.options?.map((opt: any, optIdx: number) => {
                    const isSelected = answers[currentQuestion.id]?.selected_options?.includes(opt.id);
                    const isMultiple = currentQuestion.type === 'MCQ_MULTIPLE';

                    return (
                      <div
                        key={opt.id || optIdx}
                        onClick={() => handleSelectOption(opt.id, isMultiple)}
                        className={`p-4 rounded-xl border text-sm cursor-pointer transition flex items-center space-x-3.5 ${
                          isSelected
                            ? 'bg-brand-950/60 border-brand-500 text-white font-medium shadow-md shadow-brand-500/10'
                            : 'bg-surface-850 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-${isMultiple ? 'md' : 'full'} flex items-center justify-center text-xs font-mono font-bold border ${
                            isSelected
                              ? 'bg-brand-500 border-brand-500 text-white'
                              : 'bg-surface-900 border-slate-700 text-slate-400'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </div>
                        <span className="flex-1">{opt.option_text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* Split Coding Workspace */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Problem Statement Left Pane */}
              <div className="w-full md:w-1/2 p-5 border-r border-slate-800 overflow-y-auto space-y-4 text-xs font-sans">
                <h2 className="text-lg font-bold text-white leading-tight">
                  {currentQuestion.coding_problem?.title}
                </h2>

                <div className="flex items-center space-x-2 font-mono text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {currentQuestion.coding_problem?.difficulty}
                  </span>
                  <span className="text-slate-400">
                    Time Limit: {currentQuestion.coding_problem?.time_limit_seconds}s
                  </span>
                </div>

                <div className="text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans">
                  {currentQuestion.coding_problem?.statement}
                </div>

                {currentQuestion.coding_problem?.input_format && (
                  <div>
                    <h4 className="font-bold text-white font-mono uppercase text-[11px] mb-1">Input Format</h4>
                    <pre className="p-2.5 bg-surface-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs whitespace-pre-wrap">
                      {currentQuestion.coding_problem.input_format}
                    </pre>
                  </div>
                )}

                {currentQuestion.coding_problem?.output_format && (
                  <div>
                    <h4 className="font-bold text-white font-mono uppercase text-[11px] mb-1">Output Format</h4>
                    <pre className="p-2.5 bg-surface-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs whitespace-pre-wrap">
                      {currentQuestion.coding_problem.output_format}
                    </pre>
                  </div>
                )}

                {currentQuestion.coding_problem?.constraints && (
                  <div>
                    <h4 className="font-bold text-white font-mono uppercase text-[11px] mb-1">Constraints</h4>
                    <pre className="p-2.5 bg-surface-900 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs whitespace-pre-wrap">
                      {currentQuestion.coding_problem.constraints}
                    </pre>
                  </div>
                )}
              </div>

              {/* Monaco Editor & TestCasePanel Right Pane */}
              <div className="w-full md:w-1/2 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-hidden p-2">
                  <MonacoCodeEditor
                    language={codingDrafts[currentQuestion.coding_problem?.id]?.language || 'python'}
                    code={codingDrafts[currentQuestion.coding_problem?.id]?.code || ''}
                    onChange={(val) => {
                      const pId = currentQuestion.coding_problem?.id;
                      setCodingDrafts((prev) => ({
                        ...prev,
                        [pId]: { ...prev[pId], code: val }
                      }));
                    }}
                    onLanguageChange={(lang) => {
                      const pId = currentQuestion.coding_problem?.id;
                      setCodingDrafts((prev) => ({
                        ...prev,
                        [pId]: { ...prev[pId], language: lang }
                      }));
                    }}
                    onRun={handleRunCode}
                    onSubmit={handleSubmitCode}
                    onReset={() => {
                      const pId = currentQuestion.coding_problem?.id;
                      const defaultPy = currentQuestion.coding_problem?.default_code?.python || '';
                      setCodingDrafts((prev) => ({
                        ...prev,
                        [pId]: { code: defaultPy, language: 'python' }
                      }));
                    }}
                    isExecuting={isExecutingCode}
                    isSubmitting={isSubmittingCode}
                  />
                </div>

                <div className="h-60 p-2 border-t border-slate-800 overflow-hidden">
                  <TestCasePanel
                    sampleTestCases={currentQuestion.coding_problem?.sample_test_cases || []}
                    customInput={customInput}
                    onCustomInputChange={setCustomInput}
                    runResult={codeRunResult}
                    isExecuting={isExecutingCode || isSubmittingCode}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Pagination Toolbar */}
          <div className="p-3 bg-surface-900 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
            <button
              onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
              disabled={activeQuestionIdx === 0}
              className="px-4 py-1.5 rounded-xl bg-surface-850 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 disabled:opacity-30 transition flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400 font-mono">
              {activeQuestionIdx + 1} / {currentSection?.questions.length}
            </span>

            <button
              onClick={() => setActiveQuestionIdx((prev) => Math.min((currentSection?.questions.length || 1) - 1, prev + 1))}
              disabled={activeQuestionIdx >= (currentSection?.questions.length || 1) - 1}
              className="px-4 py-1.5 rounded-xl bg-surface-850 hover:bg-slate-800 text-slate-300 font-mono text-xs border border-slate-700 disabled:opacity-30 transition flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </main>
      </div>

      {/* Proctoring Warning Dialog */}
      <WarningModal
        isOpen={warningModalOpen}
        message={warningMessage}
        warningNumber={warningCount}
        warningLimit={warningLimit}
        isSuspended={isSuspended}
        onAcknowledge={() => {
          setWarningModalOpen(false);
          if (isSuspended) {
            navigate(`/assessment/${assessmentId}/suspended?attempt_id=${attemptData.attempt_id}`);
          }
        }}
      />
    </div>
  );
};
