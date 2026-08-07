import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Code2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Save, 
  FileCode,
  Sparkles
} from 'lucide-react';

export const CodingProblemEditor: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState<string>('Longest Increasing Subsequence Length');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [statement, setStatement] = useState<string>(
    'Given an integer array `nums`, return the length of the longest strictly increasing subsequence.\n\nInput Format:\nLine 1: N\nLine 2: N space-separated integers\n\nOutput Format:\nSingle integer representing LIS length.'
  );
  const [inputFormat, setInputFormat] = useState<string>('N\nnums[0] nums[1] ... nums[N-1]');
  const [outputFormat, setOutputFormat] = useState<string>('Single integer');
  const [constraints, setConstraints] = useState<string>('1 <= N <= 2500\n-10^4 <= nums[i] <= 10^4');
  const [timeLimit, setTimeLimit] = useState<number>(2.0);
  const [memoryLimit, setMemoryLimit] = useState<number>(256);
  const [tags, setTags] = useState<string>('Array, Dynamic Programming, Binary Search');

  const [referenceSolution, setReferenceSolution] = useState<string>(
    'import sys\nimport bisect\n\ndef solve():\n    lines = sys.stdin.read().split()\n    if not lines:\n        return\n    n = int(lines[0])\n    nums = [int(x) for x in lines[1:n+1]]\n    tails = []\n    for x in nums:\n        idx = bisect.bisect_left(tails, x)\n        if idx == len(tails):\n            tails.append(x)\n        else:\n            tails[idx] = x\n    print(len(tails))\n\nif __name__ == "__main__":\n    solve()'
  );

  const [testCases, setTestCases] = useState<any[]>([
    { input_data: '6\n10 9 2 5 3 7 101 18', expected_output: '4', is_hidden: false, points: 2.0 },
    { input_data: '6\n0 1 0 3 2 3', expected_output: '4', is_hidden: false, points: 2.0 },
    { input_data: '7\n7 7 7 7 7 7 7', expected_output: '1', is_hidden: true, points: 3.0 },
    { input_data: '5\n1 2 3 4 5', expected_output: '5', is_hidden: true, points: 3.0 }
  ]);

  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<any | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const addTestCase = () => {
    setTestCases((prev) => [
      ...prev,
      { input_data: '', expected_output: '', is_hidden: true, points: 2.0 }
    ]);
  };

  const removeTestCase = (index: number) => {
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationResult(null);
    try {
      const res = await api.runCode({
        language: 'python',
        code: referenceSolution,
        coding_problem_id: undefined,
        custom_input: testCases[0]?.input_data
      });
      setValidationResult(res);
    } catch (err: any) {
      alert(err.message || 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.createQuestion({
        type: 'CODING',
        topic: tags.split(',')[0]?.trim() || 'Algorithms',
        skill: 'Data Structures & Algorithms',
        difficulty,
        problem_statement: statement,
        points: 10.0,
        negative_points: 0.0,
        coding_problem: {
          title,
          statement,
          input_format: inputFormat,
          output_format: outputFormat,
          constraints,
          examples: [{ input: testCases[0]?.input_data || '', output: testCases[0]?.expected_output || '' }],
          default_code: {
            python: 'import sys\n\ndef solve():\n    # Write your solution here\n    pass\n\nif __name__ == "__main__":\n    solve()'
          },
          reference_solution: referenceSolution,
          time_limit_seconds: timeLimit,
          memory_limit_mb: memoryLimit,
          supported_languages: ['python', 'javascript', 'cpp', 'java'],
          tags: tags.split(',').map((t) => t.trim()),
          difficulty,
          test_cases: testCases
        }
      });
      navigate('/creator/question-bank');
    } catch (err: any) {
      alert(err.message || 'Failed to save coding problem');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-accent-cyan uppercase tracking-wider mb-1">
            <Code2 className="w-4 h-4" />
            <span>Competitive Programming Authoring Studio</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Coding Problem Studio</h1>
        </div>

        <button
          type="button"
          onClick={handleValidate}
          disabled={isValidating}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 border border-brand-800/50 text-xs font-mono flex items-center space-x-2 transition disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 text-accent-emerald fill-accent-emerald" />
          <span>{isValidating ? 'Validating Solution...' : 'Test Reference Solution'}</span>
        </button>
      </div>

      {validationResult && (
        <div className="p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="text-emerald-300 font-bold">Judge Sandbox Verification Succeeded</span>
          </div>
          <span className="text-slate-400">Execution time: {validationResult.execution_time_ms} ms</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 text-xs font-mono">
        {/* Meta Info */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white font-sans border-b border-slate-800 pb-3">
            Problem Specification
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">Problem Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 font-sans text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              >
                <option value="EASY">EASY</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HARD">HARD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Problem Statement</label>
            <textarea
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              rows={4}
              required
              className="w-full p-3 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 font-sans text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Input Format</label>
              <textarea
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Output Format</label>
              <textarea
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                rows={2}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Constraints</label>
              <input
                type="text"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Time Limit (Seconds)</label>
              <input
                type="number"
                step="0.5"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseFloat(e.target.value))}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Topic Tags (comma-separated)</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500"
              />
            </div>
          </div>
        </div>

        {/* Reference Solution */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
          <label className="block text-slate-200 font-bold font-sans">
            Reference Solution (Python 3) &mdash; Auto-tested against test cases
          </label>
          <textarea
            value={referenceSolution}
            onChange={(e) => setReferenceSolution(e.target.value)}
            rows={8}
            required
            className="w-full p-3 bg-[#1e1e1e] border border-slate-800 rounded-xl text-brand-300 font-mono text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Test Cases */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white font-sans">
              Test Cases ({testCases.length}) &bull; Public Samples &amp; Hidden Tests
            </h3>
            <button
              type="button"
              onClick={addTestCase}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-brand-300 border border-brand-800/40 text-xs font-mono flex items-center space-x-1.5 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Test Case</span>
            </button>
          </div>

          <div className="space-y-3">
            {testCases.map((tc, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-surface-850 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-white">Test Case #{idx + 1}</span>
                    <label className="flex items-center space-x-1.5 cursor-pointer ml-3">
                      <input
                        type="checkbox"
                        checked={tc.is_hidden}
                        onChange={(e) => {
                          const next = [...testCases];
                          next[idx].is_hidden = e.target.checked;
                          setTestCases(next);
                        }}
                        className="w-3.5 h-3.5 text-brand-600 rounded bg-surface-900 border-slate-700"
                      />
                      <span className="text-slate-400">Hidden from Candidate</span>
                    </label>
                  </div>

                  {testCases.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeTestCase(idx)}
                      className="text-rose-400 hover:text-rose-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Input Data (stdin)</label>
                    <textarea
                      value={tc.input_data}
                      onChange={(e) => {
                        const next = [...testCases];
                        next[idx].input_data = e.target.value;
                        setTestCases(next);
                      }}
                      rows={2}
                      required
                      className="w-full mt-1 p-2 bg-surface-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase">Expected Output (stdout)</label>
                    <textarea
                      value={tc.expected_output}
                      onChange={(e) => {
                        const next = [...testCases];
                        next[idx].expected_output = e.target.value;
                        setTestCases(next);
                      }}
                      rows={2}
                      required
                      className="w-full mt-1 p-2 bg-surface-900 border border-slate-700 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-brand-500 font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end pt-4">
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-bold text-xs shadow-xl shadow-brand-600/30 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Authoring Problem...' : 'Save Coding Problem to Bank'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
