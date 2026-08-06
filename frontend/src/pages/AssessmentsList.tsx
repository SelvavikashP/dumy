import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  Layers, 
  Plus, 
  Search, 
  Eye, 
  BarChart3, 
  Mail, 
  Clock, 
  ShieldCheck, 
  Send,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { AIGeneratorModal } from './AIGeneratorModal';

export const AssessmentsList: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAIModal, setShowAIModal] = useState<boolean>(false);

  // Invite Modal State
  const [inviteModalAsm, setInviteModalAsm] = useState<any | null>(null);
  const [inviteEmails, setInviteEmails] = useState<string>('candidate@example.com');
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

  const loadAssessments = async () => {
    try {
      const data = await api.listAssessments(statusFilter || undefined);
      setAssessments(data);
    } catch (e) {
      console.error('Failed to load assessments:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, [statusFilter]);

  const handlePublish = async (asmId: string) => {
    try {
      await api.publishAssessment(asmId);
      loadAssessments();
    } catch (e: any) {
      alert(e.message || 'Failed to publish');
    }
  };

  const handleSendInvites = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteModalAsm) return;
    try {
      const emailsList = inviteEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
      await api.inviteCandidates(inviteModalAsm.id, emailsList);
      setInviteSuccess(`Successfully sent invitations to ${emailsList.length} candidate(s)!`);
      setTimeout(() => {
        setInviteSuccess(null);
        setInviteModalAsm(null);
      }, 2000);
    } catch (e: any) {
      alert(e.message || 'Failed to send invites');
    }
  };

  const filtered = assessments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-400 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            <span>Assessment Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Assessments &amp; Tests</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-cyan to-brand-500 hover:from-cyan-400 hover:to-brand-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Exam Wizard</span>
          </button>

          <Link
            to="/creator/assessments/create"
            className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>New Assessment</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments..."
            className="w-full pl-9 pr-4 py-2 bg-surface-850 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              statusFilter === '' ? 'bg-brand-600 text-white' : 'bg-surface-850 text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('PUBLISHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              statusFilter === 'PUBLISHED' ? 'bg-emerald-600 text-white' : 'bg-surface-850 text-slate-400 hover:text-white'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition ${
              statusFilter === 'DRAFT' ? 'bg-amber-600 text-white' : 'bg-surface-850 text-slate-400 hover:text-white'
            }`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            Loading assessments catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            No assessments found matching your filters.
          </div>
        ) : (
          filtered.map((asm) => (
            <div
              key={asm.id}
              className="glass-panel p-6 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-bold text-white leading-tight">{asm.title}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                      asm.status === 'PUBLISHED'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    }`}
                  >
                    {asm.status}
                  </span>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {asm.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-300 bg-surface-900/80 p-3 rounded-xl border border-slate-800 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    <span>{asm.duration_minutes} Minutes</span>
                  </div>
                  <div>
                    <span>Passing: {asm.passing_percentage}%</span>
                  </div>
                  <div>
                    <span>{asm.sections?.length || 0} Sections</span>
                  </div>
                  <div>
                    <span>Proctor: {asm.proctoring_level}</span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/creator/live-monitoring`}
                    className="p-2 rounded-lg bg-surface-850 hover:bg-slate-800 text-accent-emerald border border-slate-700 transition"
                    title="Live Surveillance"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/creator/results`}
                    className="p-2 rounded-lg bg-surface-850 hover:bg-slate-800 text-brand-400 border border-slate-700 transition"
                    title="Results & Analytics"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setInviteModalAsm(asm)}
                    className="p-2 rounded-lg bg-surface-850 hover:bg-slate-800 text-accent-cyan border border-slate-700 transition"
                    title="Invite Candidates"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                </div>

                {asm.status === 'DRAFT' && (
                  <button
                    onClick={() => handlePublish(asm.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition text-xs shadow"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invite Candidates Modal */}
      {inviteModalAsm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl glass-panel border border-slate-700 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h3 className="text-base font-bold text-white">Invite Candidates</h3>
              <button onClick={() => setInviteModalAsm(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-3">
              Assessment: <strong className="text-white">{inviteModalAsm.title}</strong>
            </p>

            {inviteSuccess && (
              <div className="p-3 mb-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
                <span>{inviteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSendInvites} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Candidate Email Addresses (comma/newline separated)</label>
                <textarea
                  value={inviteEmails}
                  onChange={(e) => setInviteEmails(e.target.value)}
                  rows={4}
                  required
                  placeholder="candidate1@example.com, candidate2@example.com"
                  className="w-full p-2.5 bg-surface-850 border border-slate-700 rounded-xl text-slate-100 focus:outline-none focus:border-brand-500 font-mono text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalAsm(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white font-sans text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-xs transition shadow-lg shadow-brand-600/30 flex items-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Invites</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        onCreated={() => {
          setShowAIModal(false);
          loadAssessments();
        }}
      />
    </div>
  );
};
