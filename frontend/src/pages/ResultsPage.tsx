import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CandidateResult } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Award, 
  Download, 
  Search, 
  AlertTriangle,
  UserCheck,
  UserX,
  Code2
} from 'lucide-react';

export const ResultsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAsmId, setSelectedAsmId] = useState<string>('');
  const [results, setResults] = useState<CandidateResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      try {
        const list = await api.listAssessments();
        setAssessments(list);
        if (list.length > 0) {
          setSelectedAsmId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const loadResults = async (asmId: string) => {
    if (!asmId) return;
    setLoading(true);
    try {
      const data = await api.getAssessmentResults(asmId);
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAsmId) {
      loadResults(selectedAsmId);
    }
  }, [selectedAsmId]);

  const handleVerdictChange = async (attemptId: string, verdict: string) => {
    try {
      await api.updateVerdict(attemptId, verdict);
      loadResults(selectedAsmId);
    } catch (e: any) {
      alert(e.message || 'Failed to update verdict');
    }
  };

  const exportCSV = () => {
    if (!results.length) return;
    const headers = ['Candidate Name', 'Email', 'Total Score', 'Max Score', 'Percentage', 'Passed', 'Aptitude Score', 'MCQ Score', 'Coding Score', 'Warnings', 'Suspended', 'Verdict'];
    const rows = results.map((r) => [
      `"${r.candidate_name}"`,
      `"${r.candidate_email}"`,
      r.total_score,
      r.max_score,
      `${r.percentage}%`,
      r.passed ? 'YES' : 'NO',
      r.aptitude_score,
      r.mcq_score,
      r.coding_score,
      r.warnings_count,
      r.is_suspended ? 'YES' : 'NO',
      r.recruiter_verdict
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `assessment_results_${selectedAsmId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const avgScore = results.length
    ? (results.reduce((acc, r) => acc + r.percentage, 0) / results.length).toFixed(1)
    : '0.0';
  const passedCount = results.filter((r) => r.passed).length;
  const shortlistedCount = results.filter((r) => r.recruiter_verdict === 'SHORTLISTED').length;

  const filtered = results.filter(
    (r) =>
      r.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
      r.candidate_email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 font-semibold">
            <BarChart3 className="w-4 h-4" />
            <span>Assessment Analytics &amp; Scoring</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Candidate Results &amp; Roster</h1>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={selectedAsmId}
            onChange={(e) => setSelectedAsmId(e.target.value)}
            className="bg-white dark:bg-surface-850 text-slate-900 dark:text-slate-200 rounded-xl px-3.5 py-2 text-xs border border-slate-300 dark:border-slate-700 font-mono focus:outline-none focus:border-brand-500 shadow-sm"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.title}
              </option>
            ))}
          </select>

          <button
            onClick={exportCSV}
            disabled={!results.length}
            className="px-4 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-mono flex items-center space-x-1.5 transition shadow-sm disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Candidates Attempted</span>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">{results.length}</div>
        </div>
        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Average Score</span>
          <div className="mt-2 text-2xl font-bold text-brand-600 dark:text-brand-300 font-mono">{avgScore}%</div>
        </div>
        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Passed Assessment</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{passedCount}</div>
        </div>
        <div className="p-4 rounded-xl glass-card border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase font-semibold">Shortlisted Candidates</span>
          <div className="mt-2 text-2xl font-bold text-cyan-600 dark:text-accent-cyan font-mono">{shortlistedCount}</div>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by candidate name or email..."
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
        />
      </div>

      {/* Results Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-surface-850/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-mono uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 font-semibold">Candidate</th>
                <th className="py-3.5 px-4 font-semibold">Total Score</th>
                <th className="py-3.5 px-4 font-semibold">Section Breakdown</th>
                <th className="py-3.5 px-4 font-semibold">Proctoring Risk</th>
                <th className="py-3.5 px-4 font-semibold">Recruiter Verdict</th>
                <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                    Loading results...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 dark:text-slate-400 font-mono">
                    No results recorded for this assessment yet.
                  </td>
                </tr>
              ) : (
                filtered.map((res) => (
                  <tr key={res.attempt_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white text-sm">{res.candidate_name}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{res.candidate_email}</div>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <div className="text-base font-bold text-slate-900 dark:text-white">
                        {res.total_score} <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ {res.max_score}</span>
                      </div>
                      <div className="text-xs font-semibold">
                        <span className={res.passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                          {res.percentage}% &bull; {res.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      <div className="space-y-0.5">
                        <div>Aptitude: {res.aptitude_score} pts</div>
                        <div>MCQs: {res.mcq_score} pts</div>
                        <div className="text-cyan-600 dark:text-accent-cyan font-bold">Coding: {res.coding_score} pts</div>
                      </div>
                    </td>

                    <td className="py-4 px-4 font-mono">
                      <div className="flex items-center space-x-1.5">
                        <AlertTriangle className={`w-3.5 h-3.5 ${res.warnings_count > 0 ? 'text-amber-500 dark:text-amber-400' : 'text-slate-400 dark:text-slate-500'}`} />
                        <span className="text-xs text-slate-700 dark:text-slate-300">{res.warnings_count} Warnings</span>
                      </div>
                      {res.is_suspended && (
                        <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-0.5">
                          [SUSPENDED]
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold font-mono uppercase border ${
                          res.recruiter_verdict === 'SHORTLISTED'
                            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                            : res.recruiter_verdict === 'REJECTED'
                            ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-400'
                            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {res.recruiter_verdict}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleVerdictChange(res.attempt_id, 'SHORTLISTED')}
                          className="px-2.5 py-1 rounded bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/40 text-xs font-medium transition"
                        >
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleVerdictChange(res.attempt_id, 'REJECTED')}
                          className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800/40 text-xs font-medium transition"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
