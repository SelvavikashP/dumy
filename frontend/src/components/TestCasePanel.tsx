import React, { useState } from 'react';
import { CodeRunResult } from '../types';
import { CheckCircle2, XCircle, Clock, Cpu, Terminal, AlertCircle } from 'lucide-react';

interface TestCasePanelProps {
  sampleTestCases: Array<{ id?: string; input_data: string; expected_output: string }>;
  customInput: string;
  onCustomInputChange: (val: string) => void;
  runResult: CodeRunResult | null;
  isExecuting?: boolean;
}

export const TestCasePanel: React.FC<TestCasePanelProps> = ({
  sampleTestCases,
  customInput,
  onCustomInputChange,
  runResult,
  isExecuting = false
}) => {
  const [selectedTab, setSelectedTab] = useState<number>(0); // 0..N-1 for samples, -1 for custom

  return (
    <div className="flex flex-col h-full bg-[#18181b] rounded-xl border border-slate-800 text-xs overflow-hidden">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#202024] border-b border-slate-800">
        <div className="flex items-center space-x-1.5 overflow-x-auto">
          {sampleTestCases.map((_, idx) => {
            const tcResult = runResult?.test_case_results?.[idx];
            return (
              <button
                key={idx}
                onClick={() => setSelectedTab(idx)}
                className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-mono transition ${
                  selectedTab === idx
                    ? 'bg-slate-700 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>Case {idx + 1}</span>
                {tcResult && (
                  tcResult.passed ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent-emerald" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  )
                )}
              </button>
            );
          })}

          <button
            onClick={() => setSelectedTab(-1)}
            className={`px-3 py-1 rounded-lg font-mono transition ${
              selectedTab === -1
                ? 'bg-slate-700 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Custom Input
          </button>
        </div>

        {/* Execution Metrics if available */}
        {runResult && (
          <div className="flex items-center space-x-3 text-[11px] font-mono text-slate-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-brand-400" />
              <span>{runResult.execution_time_ms} ms</span>
            </span>
            <span className="flex items-center space-x-1">
              <Cpu className="w-3 h-3 text-accent-cyan" />
              <span>{runResult.memory_used_mb} MB</span>
            </span>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3 overflow-y-auto space-y-3 font-mono">
        {/* Loading Spinner */}
        {isExecuting && (
          <div className="flex items-center justify-center py-8 text-slate-400 space-x-2">
            <div className="w-4 h-4 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
            <span>Executing inside isolated judge sandbox...</span>
          </div>
        )}

        {/* Status Alert if evaluated */}
        {!isExecuting && runResult && (
          <div
            className={`p-2.5 rounded-lg border flex items-center justify-between ${
              runResult.status === 'SUCCESS' || runResult.status === 'ACCEPTED'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              {runResult.status === 'SUCCESS' || runResult.status === 'ACCEPTED' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span className="font-semibold">{runResult.status.replace(/_/g, ' ')}</span>
            </div>
            {runResult.sample_tests_total ? (
              <span>
                {runResult.sample_tests_passed} / {runResult.sample_tests_total} Cases Passed
              </span>
            ) : null}
          </div>
        )}

        {/* Compilation or Runtime Error */}
        {!isExecuting && runResult?.stderr && (
          <div className="p-3 bg-red-950/30 border border-red-800/40 rounded-lg text-red-300 text-xs whitespace-pre-wrap">
            <div className="font-semibold mb-1 text-red-400 flex items-center space-x-1">
              <Terminal className="w-3.5 h-3.5" />
              <span>Standard Error / Traceback:</span>
            </div>
            {runResult.stderr}
          </div>
        )}

        {/* Tab Specific Content */}
        {!isExecuting && selectedTab >= 0 && selectedTab < sampleTestCases.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase">Input Data</label>
              <pre className="mt-1 p-2.5 bg-[#121214] border border-slate-800 rounded-lg text-slate-200 whitespace-pre-wrap">
                {sampleTestCases[selectedTab].input_data}
              </pre>
            </div>
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase">Expected Output</label>
              <pre className="mt-1 p-2.5 bg-[#121214] border border-slate-800 rounded-lg text-slate-200 whitespace-pre-wrap">
                {sampleTestCases[selectedTab].expected_output}
              </pre>
            </div>

            {runResult?.test_case_results?.[selectedTab] && (
              <div className="md:col-span-2">
                <label className="text-[11px] text-slate-400 font-semibold uppercase">Actual Output</label>
                <pre
                  className={`mt-1 p-2.5 rounded-lg border whitespace-pre-wrap ${
                    runResult.test_case_results[selectedTab].passed
                      ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                      : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                  }`}
                >
                  {runResult.test_case_results[selectedTab].actual_output || '(Empty Output)'}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Custom Input Tab */}
        {!isExecuting && selectedTab === -1 && (
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-400 font-semibold uppercase">Custom Standard Input</label>
              <textarea
                value={customInput}
                onChange={(e) => onCustomInputChange(e.target.value)}
                placeholder="Enter custom stdin lines here..."
                rows={4}
                className="mt-1 w-full p-2.5 bg-[#121214] border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-brand-500 font-mono text-xs"
              />
            </div>
            {runResult?.stdout && (
              <div>
                <label className="text-[11px] text-slate-400 font-semibold uppercase">Standard Output</label>
                <pre className="mt-1 p-2.5 bg-[#121214] border border-slate-800 rounded-lg text-slate-200 whitespace-pre-wrap">
                  {runResult.stdout}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
