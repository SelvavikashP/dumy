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
  AlertCircle, 
  Bell, 
  RotateCw, 
  Users, 
  X 
} from 'lucide-react';
import { AIGeneratorModal } from './AIGeneratorModal';

export const AssessmentsList: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAIModal, setShowAIModal] = useState<boolean>(false);

  // Invite & Reminder Modal State
  const [activeModalAsm, setActiveModalAsm] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'INVITE' | 'REMINDERS'>('INVITE');
  const [inviteEmails, setInviteEmails] = useState<string>('candidate@example.com');
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingInvs, setLoadingInvs] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<boolean>(false);

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

  const loadInvitations = async (asmId: string) => {
    setLoadingInvs(true);
    try {
      const list = await api.listAssessmentInvitations(asmId);
      setInvitations(list);
    } catch (e) {
      console.error('Failed to load invitations:', e);
    } finally {
      setLoadingInvs(false);
    }
  };

  const handleOpenModal = (asm: any, initialTab: 'INVITE' | 'REMINDERS' = 'INVITE') => {
    setActiveModalAsm(asm);
    setActiveTab(initialTab);
    setActionSuccess(null);
    setActionError(null);
    loadInvitations(asm.id);
  };

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
    if (!activeModalAsm) return;
    setActionError(null);
    setActionSuccess(null);
    try {
      const emailsList = inviteEmails.split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
      const res = await api.inviteCandidates(activeModalAsm.id, emailsList);
      setActionSuccess(res.message || `Successfully sent invitations to ${emailsList.length} candidate(s)!`);
      loadInvitations(activeModalAsm.id);
      setTimeout(() => {
        setActionSuccess(null);
      }, 4000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to send invites');
    }
  };

  const handleBulkRemind = async () => {
    if (!activeModalAsm) return;
    setSendingReminder(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await api.sendAssessmentReminders(activeModalAsm.id);
      setActionSuccess(res.message || 'Reminders dispatched successfully!');
      loadInvitations(activeModalAsm.id);
    } catch (e: any) {
      setActionError(e.message || 'Failed to send reminders');
    } finally {
      setSendingReminder(false);
    }
  };

  const handleSingleRemind = async (invitationId: string, email: string) => {
    if (!activeModalAsm) return;
    try {
      const res = await api.remindCandidate(activeModalAsm.id, invitationId);
      setActionSuccess(res.message || `Reminder sent to ${email}`);
      loadInvitations(activeModalAsm.id);
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (e: any) {
      setActionError(e.message || 'Failed to send reminder');
    }
  };

  const filtered = assessments.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      (a.description && a.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-brand-600 dark:text-brand-400 uppercase tracking-wider mb-1 font-semibold">
            <Layers className="w-4 h-4" />
            <span>Assessment Catalog</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Assessments &amp; Tests</h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-brand-500 hover:from-cyan-400 hover:to-brand-400 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center space-x-1.5"
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
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assessments..."
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition shadow-sm ${
              statusFilter === '' ? 'bg-brand-600 text-white font-bold' : 'bg-white dark:bg-surface-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('PUBLISHED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition shadow-sm ${
              statusFilter === 'PUBLISHED' ? 'bg-emerald-600 text-white font-bold' : 'bg-white dark:bg-surface-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setStatusFilter('DRAFT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition shadow-sm ${
              statusFilter === 'DRAFT' ? 'bg-amber-600 text-white font-bold' : 'bg-white dark:bg-surface-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-transparent'
            }`}
          >
            Drafts
          </button>
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 text-xs">
            Loading assessments catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 text-xs">
            No assessments found matching your filters.
          </div>
        ) : (
          filtered.map((asm) => (
            <div
              key={asm.id}
              className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between shadow-sm"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{asm.title}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono uppercase border ${
                      asm.status === 'PUBLISHED'
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                        : 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/30 text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {asm.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {asm.description || 'No description provided.'}
                </p>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-surface-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
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
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/creator/live-monitoring`}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-surface-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-emerald-600 dark:text-accent-emerald border border-slate-200 dark:border-slate-700 transition"
                    title="Live Surveillance"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </Link>
                  <Link
                    to={`/creator/results`}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-surface-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-200 dark:border-slate-700 transition"
                    title="Results & Analytics"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => handleOpenModal(asm, 'INVITE')}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-surface-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-cyan-600 dark:text-accent-cyan border border-slate-200 dark:border-slate-700 transition"
                    title="Invite Candidates & Send Reminders"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenModal(asm, 'REMINDERS')}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-surface-850 hover:bg-slate-200 dark:hover:bg-slate-800 text-amber-600 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition"
                    title="Candidate Reminders & History"
                  >
                    <Bell className="w-3.5 h-3.5" />
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

      {/* Invite Candidates & Reminders Modal */}
      {activeModalAsm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 font-sans">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeModalAsm.title}</h3>
              </div>
              <button onClick={() => setActiveModalAsm(null)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-mono">
              <button
                onClick={() => setActiveTab('INVITE')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                  activeTab === 'INVITE' ? 'bg-brand-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Invite Candidates</span>
              </button>
              <button
                onClick={() => setActiveTab('REMINDERS')}
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition ${
                  activeTab === 'REMINDERS' ? 'bg-amber-600 text-white font-bold' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Candidate Reminders ({invitations.length})</span>
              </button>
            </div>

            {actionSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2 font-mono">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span>{actionSuccess}</span>
              </div>
            )}

            {actionError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2 font-mono">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{actionError}</span>
              </div>
            )}

            {activeTab === 'INVITE' ? (
              <form onSubmit={handleSendInvites} className="space-y-4 text-xs font-mono">
                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                  Invited candidates will automatically receive an invitation email via Gmail SMTP with their unique access link, duration specifications, and proctoring rules.
                </p>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Candidate Email Addresses (comma/newline separated)
                  </label>
                  <textarea
                    value={inviteEmails}
                    onChange={(e) => setInviteEmails(e.target.value)}
                    rows={4}
                    required
                    placeholder="candidate1@example.com, candidate2@example.com"
                    className="w-full p-2.5 bg-white dark:bg-surface-850 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 font-mono text-xs shadow-sm"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModalAsm(null)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-sans text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-sans font-semibold text-xs transition shadow-lg shadow-brand-600/30 flex items-center space-x-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Invitations via Gmail</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 dark:text-slate-400 text-xs font-sans">
                    Send instant reminders to all candidates with pending tests.
                  </span>
                  <button
                    onClick={handleBulkRemind}
                    disabled={sendingReminder || invitations.length === 0}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-sans font-semibold text-xs transition shadow disabled:opacity-50 flex items-center space-x-1.5"
                  >
                    <Bell className={`w-3.5 h-3.5 ${sendingReminder ? 'animate-bounce' : ''}`} />
                    <span>{sendingReminder ? 'Sending Reminders...' : 'Send Reminders to All'}</span>
                  </button>
                </div>

                {loadingInvs ? (
                  <div className="py-8 text-center text-slate-500">Loading invitations list...</div>
                ) : invitations.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 font-sans">
                    No candidates invited yet. Switch to the 'Invite Candidates' tab to send invitations.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-surface-850/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate">{inv.email}</span>
                            {inv.candidate_name && (
                              <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">({inv.candidate_name})</span>
                            )}
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-200 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300">
                              {inv.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            Reminders sent: <strong className="text-slate-700 dark:text-slate-300">{inv.reminder_count || 0}</strong>
                            {inv.last_reminder_sent_at && (
                              <span> • Last: {new Date(inv.last_reminder_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleSingleRemind(inv.id, inv.email)}
                          className="px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-surface-900 hover:bg-amber-100 dark:hover:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 text-[11px] font-sans font-semibold transition flex items-center space-x-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Remind</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
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
