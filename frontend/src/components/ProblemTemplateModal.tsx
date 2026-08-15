import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Code2, 
  Search, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Tag, 
  ChevronRight, 
  X,
  FileCode,
  SlidersHorizontal
} from 'lucide-react';

interface ProblemTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateDetail: any) => void;
}

export const ProblemTemplateModal: React.FC<ProblemTemplateModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [templateDetail, setTemplateDetail] = useState<any | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        const data = await api.getCodingTemplates();
        setTemplates(data);
        if (data.length > 0) {
          setSelectedTemplateId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load coding templates:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, [isOpen]);

  useEffect(() => {
    if (!selectedTemplateId) {
      setTemplateDetail(null);
      return;
    }
    const fetchDetail = async () => {
      setDetailLoading(true);
      try {
        const detail = await api.getCodingTemplate(selectedTemplateId);
        setTemplateDetail(detail);
      } catch (err) {
        console.error('Failed to fetch template detail:', err);
      } finally {
        setDetailLoading(false);
      }
    };
    fetchDetail();
  }, [selectedTemplateId]);

  if (!isOpen) return null;

  const categories = ['ALL', 'Arrays & Hashing', 'Stack & Strings', 'Sliding Window', 'Searching', 'Intervals & Sorting', 'Dynamic Programming', 'Linked Lists & Pointers'];

  const filteredTemplates = templates.filter((t) => {
    const matchesCat = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'ALL' || t.difficulty === selectedDifficulty;
    const matchesSearch = searchQuery === '' || 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.tags && t.tags.some((tag: string) => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    return matchesCat && matchesDiff && matchesSearch;
  });

  const handleApply = () => {
    if (templateDetail) {
      onSelectTemplate(templateDetail);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 rounded-2xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan p-0.5 flex items-center justify-center shadow-lg shadow-brand-500/20">
              <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Code2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
                <span>Standard Algorithmic Problem Templates</span>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-500/20 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-500/30">
                  DSA Library
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pre-built challenges with verified test cases, constraints, and starter solutions across languages.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search problems, topics, tags (e.g., Two Sum, DP, Stack)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:border-brand-500 shadow-sm"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex items-center space-x-1 font-mono">
            {['ALL', 'EASY', 'MEDIUM', 'HARD'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                  selectedDifficulty === diff
                    ? diff === 'EASY'
                      ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                      : diff === 'MEDIUM'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                      : diff === 'HARD'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                      : 'bg-brand-600 text-white'
                    : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700/40'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Category Pills */}
        <div className="px-6 py-2 border-b border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950/40 flex items-center space-x-2 overflow-x-auto scrollbar-none text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full whitespace-nowrap text-[11px] transition ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white font-medium shadow-sm'
                  : 'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 border border-slate-200 dark:border-transparent'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Main Content Split: List & Preview */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Problem List */}
          <div className="md:col-span-5 border-r border-slate-200 dark:border-slate-800 overflow-y-auto p-4 space-y-2 bg-slate-50 dark:bg-slate-900/50">
            {loading ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">Loading templates...</div>
            ) : filteredTemplates.length === 0 ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 font-mono text-xs">No matching templates found</div>
            ) : (
              filteredTemplates.map((item) => {
                const isSelected = selectedTemplateId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedTemplateId(item.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500/60 shadow-md ring-1 ring-brand-500/30'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className={`text-xs font-bold leading-snug ${isSelected ? 'text-brand-700 dark:text-brand-300' : 'text-slate-900 dark:text-slate-200'}`}>
                        {item.title}
                      </h4>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold shrink-0 ${
                          item.difficulty === 'EASY'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                            : item.difficulty === 'MEDIUM'
                            ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20'
                            : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20'
                        }`}
                      >
                        {item.difficulty}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span className="truncate">{item.category}</span>
                      <span>{item.test_case_count} Test Cases</span>
                    </div>

                    {item.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tg: string) => (
                          <span key={tg} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                            {tg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Problem Preview */}
          <div className="md:col-span-7 flex flex-col h-full bg-white dark:bg-slate-950/30 overflow-hidden">
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                Loading problem specification...
              </div>
            ) : !templateDetail ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 dark:text-slate-400 font-mono text-xs">
                Select a problem template to preview
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Title & Metadata Header */}
                <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 mb-1 font-semibold">
                    <Layers className="w-4 h-4" />
                    <span>{templateDetail.category}</span>
                    <span>&bull;</span>
                    <span>{templateDetail.time_limit_sec}s limit</span>
                    <span>&bull;</span>
                    <span>{templateDetail.memory_limit_mb}MB RAM</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{templateDetail.title}</h3>
                </div>

                {/* Problem Statement */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">Problem Statement</h4>
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs leading-relaxed whitespace-pre-wrap font-sans shadow-sm">
                    {templateDetail.statement}
                  </div>
                </div>

                {/* I/O & Constraints */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">Input Format</span>
                    <pre className="text-slate-800 dark:text-slate-300 text-[11px] whitespace-pre-wrap">{templateDetail.input_format}</pre>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">Output Format</span>
                    <pre className="text-slate-800 dark:text-slate-300 text-[11px] whitespace-pre-wrap">{templateDetail.output_format}</pre>
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block mb-1">Constraints</span>
                    <pre className="text-slate-800 dark:text-slate-300 text-[11px] whitespace-pre-wrap">{templateDetail.constraints}</pre>
                  </div>
                </div>

                {/* Test Cases Preview */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider font-mono">
                    Preconfigured Test Cases ({templateDetail.test_cases.length})
                  </h4>
                  <div className="space-y-2">
                    {templateDetail.test_cases.map((tc: any, i: number) => (
                      <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs font-mono space-y-1.5 shadow-sm">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                          <span>Case #{i + 1} {tc.is_hidden ? '(Hidden Edge Case)' : '(Public Sample)'}</span>
                          <span className="text-cyan-600 dark:text-accent-cyan font-bold">{tc.points} pts</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Input:</span>
                            <pre className="text-slate-800 dark:text-slate-300 bg-slate-200/60 dark:bg-slate-950 p-1.5 rounded">{tc.input_data}</pre>
                          </div>
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 text-[10px] block">Expected Output:</span>
                            <pre className="text-emerald-700 dark:text-emerald-400 bg-slate-200/60 dark:bg-slate-950 p-1.5 rounded font-bold">{tc.expected_output}</pre>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Footer Action Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center justify-between">
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                {templateDetail ? `Ready to import "${templateDetail.title}"` : 'Select a template'}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-transparent text-xs font-medium transition shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!templateDetail}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-brand-600/30 transition duration-150 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Import Into Problem Editor</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
