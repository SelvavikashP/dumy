import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  FileQuestion, 
  Plus, 
  Search, 
  Filter, 
  Code2, 
  CheckCircle2, 
  Tag, 
  Layers, 
  X, 
  Sparkles 
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Add Question Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [qType, setQType] = useState<string>('MCQ_SINGLE');
  const [topic, setTopic] = useState<string>('Data Structures');
  const [difficulty, setDifficulty] = useState<string>('MEDIUM');
  const [statement, setStatement] = useState<string>('');
  const [explanation, setExplanation] = useState<string>('');
  const [points, setPoints] = useState<number>(2.0);
  const [options, setOptions] = useState<any[]>([
    { option_text: '', is_correct: true, explanation: '' },
    { option_text: '', is_correct: false, explanation: '' },
    { option_text: '', is_correct: false, explanation: '' },
    { option_text: '', is_correct: false, explanation: '' },
  ]);

  const loadQuestions = async () => {
    try {
      const data = await api.listQuestions({
        type: typeFilter || undefined,
        difficulty: difficultyFilter || undefined
      });
      setQuestions(data);
    } catch (e) {
      console.error('Failed to load questions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuestions();
  }, [typeFilter, difficultyFilter]);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createQuestion({
        type: qType,
        topic,
        skill: topic,
        difficulty,
        problem_statement: statement,
        explanation,
        points,
        negative_points: 0.5,
        options: qType !== 'CODING' ? options : []
      });
      setShowAddModal(false);
      setStatement('');
      setExplanation('');
      loadQuestions();
    } catch (err: any) {
      alert(err.message || 'Failed to create question');
    }
  };

  const filtered = questions.filter(
    (q) =>
      q.problem_statement.toLowerCase().includes(search.toLowerCase()) ||
      (q.topic && q.topic.toLowerCase().includes(search.toLowerCase())) ||
      (q.coding_problem && q.coding_problem.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 font-semibold">
            <FileQuestion className="w-4 h-4" />
            <span>Master Problem Repository</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Question Bank</h1>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/creator/coding"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-brand-700 dark:text-brand-300 border border-brand-300 dark:border-brand-800/40 text-xs font-semibold transition flex items-center space-x-1.5 shadow-sm"
          >
            <Code2 className="w-4 h-4" />
            <span>Coding Problem Studio</span>
          </Link>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions by keyword or topic..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-3 w-full sm:w-auto font-mono text-xs">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white dark:bg-surface-850 text-slate-900 dark:text-slate-200 rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="">All Question Types</option>
            <option value="APTITUDE">Aptitude</option>
            <option value="MCQ_SINGLE">MCQ (Single Correct)</option>
            <option value="MCQ_MULTIPLE">MCQ (Multiple Correct)</option>
            <option value="CODING">Coding Problems</option>
          </select>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-white dark:bg-surface-850 text-slate-900 dark:text-slate-200 rounded-xl px-3 py-2 border border-slate-300 dark:border-slate-700 focus:outline-none focus:border-brand-500 shadow-sm"
          >
            <option value="">All Difficulties</option>
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs">Loading question bank...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs">No questions found matching criteria.</div>
        ) : (
          filtered.map((q) => (
            <div
              key={q.id}
              className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase bg-brand-50 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800/40">
                    {q.type}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {q.topic || 'General'}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                    {q.difficulty} &bull; {q.points} pts
                  </span>
                </div>

                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  Source: {q.source || 'MANUAL'}
                </span>
              </div>

              <p className="text-sm text-slate-900 dark:text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                {q.problem_statement}
              </p>

              {/* Options Preview for MCQs */}
              {q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  {q.options.map((opt: any, optIdx: number) => (
                    <div
                      key={optIdx}
                      className={`p-2.5 rounded-xl border text-xs font-sans flex items-center space-x-2 ${
                        opt.is_correct
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 font-medium'
                          : 'bg-white dark:bg-surface-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono ${
                          opt.is_correct ? 'bg-emerald-500 text-white dark:text-slate-950 font-bold' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </div>
                      <span>{opt.option_text}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Coding Problem Info */}
              {q.coding_problem && (
                <div className="p-3 bg-slate-50 dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Code2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span className="font-bold text-slate-900 dark:text-white">{q.coding_problem.title}</span>
                  </div>
                  <span>{q.coding_problem.test_cases?.length || 0} Test Cases</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in font-sans">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Question to Bank</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Question Type</label>
                  <select
                    value={qType}
                    onChange={(e) => setQType(e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm"
                  >
                    <option value="APTITUDE">Aptitude</option>
                    <option value="MCQ_SINGLE">MCQ (Single Correct)</option>
                    <option value="MCQ_MULTIPLE">MCQ (Multiple Correct)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Topic / Category</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    required
                    placeholder="e.g. Probability"
                    className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 shadow-sm font-sans"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Difficulty</label>
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

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Problem Statement / Question</label>
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  rows={3}
                  required
                  placeholder="Enter full question text or mathematical word problem..."
                  className="w-full p-3 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>

              {/* Options */}
              <div className="space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 font-semibold font-sans">Answer Options (Select correct option)</label>
                {options.map((opt, optIdx) => (
                  <div key={optIdx} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_option"
                      checked={opt.is_correct}
                      onChange={() => {
                        const next = options.map((o, i) => ({ ...o, is_correct: i === optIdx }));
                        setOptions(next);
                      }}
                      className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                    />
                    <input
                      type="text"
                      value={opt.option_text}
                      onChange={(e) => {
                        const next = [...options];
                        next[optIdx].option_text = e.target.value;
                        setOptions(next);
                      }}
                      required
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)} text...`}
                      className="flex-1 p-2 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none focus:border-brand-500 shadow-sm"
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1 font-sans">Explanation / Solution Steps</label>
                <textarea
                  value={explanation}
                  onChange={(e) => setExplanation(e.target.value)}
                  rows={2}
                  placeholder="Explanation displayed during result review..."
                  className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-sans text-xs focus:outline-none focus:border-brand-500 shadow-sm"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-sans text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-xs transition shadow-lg shadow-brand-600/30"
                >
                  Add to Question Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
