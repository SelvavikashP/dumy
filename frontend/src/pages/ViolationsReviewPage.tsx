import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Activity, 
  Filter, 
  Camera, 
  Image as ImageIcon,
  ZoomIn,
  X,
  Maximize2
} from 'lucide-react';

export const ViolationsReviewPage: React.FC = () => {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAsmId, setSelectedAsmId] = useState<string>('');
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'GALLERY'>('TIMELINE');
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

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

  const loadViolations = async (asmId: string) => {
    if (!asmId) return;
    setLoading(true);
    try {
      const data = await api.listViolations(asmId);
      setViolations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAsmId) {
      loadViolations(selectedAsmId);
    }
  }, [selectedAsmId]);

  const snapshotsList = violations.filter((v) => v.snapshot_url && v.snapshot_url.startsWith('data:image'));

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1 font-semibold">
            <ShieldAlert className="w-4 h-4" />
            <span>Proctoring Incident Center</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Violation &amp; Evidence Intelligence</h1>
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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActiveTab('TIMELINE')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center space-x-2 ${
              activeTab === 'TIMELINE'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                : 'bg-white dark:bg-surface-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Incident Timeline ({violations.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('GALLERY')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition flex items-center space-x-2 ${
              activeTab === 'GALLERY'
                ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                : 'bg-white dark:bg-surface-850 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-800'
            }`}
          >
            <Camera className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <span>Webcam Evidence Gallery ({snapshotsList.length})</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:block">
          Auto-synchronized with Candidate Sentinel
        </div>
      </div>

      {/* Overview Notice */}
      <div className="p-4 rounded-2xl glass-card border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
        <strong className="text-slate-900 dark:text-white">Ethical Proctoring Telemetry:</strong> All automated signals (tab switches, face presence checks, noise levels) are preserved with cryptographic timestamps and visual frames for transparent human review.
      </div>

      {/* Tab 1: Chronological Timeline */}
      {activeTab === 'TIMELINE' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Chronological Signal Feed ({violations.length} Events)</h3>

          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">Loading incident timeline...</div>
          ) : violations.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">
              No proctoring violations or security alerts recorded for this assessment.
            </div>
          ) : (
            <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6">
              {violations.map((ev, idx) => (
                <div key={ev.id || idx} className="ml-6 relative">
                  {/* Node dot */}
                  <div
                    className={`w-3 h-3 rounded-full absolute -left-[31px] top-1.5 border-2 border-white dark:border-surface-900 ${
                      ev.severity === 'CRITICAL' || ev.severity === 'HIGH' ? 'bg-rose-500' : 'bg-amber-400'
                    }`}
                  />

                  <div className="p-4 rounded-xl bg-white dark:bg-surface-850 border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 dark:text-white">{ev.candidate_name}</span>
                        <span className="text-slate-500 dark:text-slate-400">({ev.candidate_email})</span>
                      </div>
                      <span className="text-slate-500 dark:text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 text-[11px] font-mono font-bold">
                          {ev.event_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">
                          Severity: <strong className="text-slate-900 dark:text-white">{ev.severity}</strong> &bull; Confidence: {(ev.confidence * 100).toFixed(0)}%
                        </span>
                      </div>

                      {ev.snapshot_url && (
                        <button
                          onClick={() => setSelectedSnapshot(ev)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-cyan-700 dark:text-cyan-300 text-[11px] font-mono flex items-center space-x-1.5 border border-slate-200 dark:border-slate-700 transition"
                        >
                          <Camera className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                          <span>View Camera Proof</span>
                        </button>
                      )}
                    </div>

                    {ev.warning_issued && (
                      <div className="text-[11px] text-amber-700 dark:text-amber-300 font-mono flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Security Warning Issued to Candidate</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Webcam Evidence Gallery */}
      {activeTab === 'GALLERY' && (
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Visual Evidence Snapshots ({snapshotsList.length})</h3>
            <span className="text-xs font-mono text-slate-500 dark:text-slate-400">Periodic checks &amp; incident triggers</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">Loading webcam snapshots...</div>
          ) : snapshotsList.length === 0 ? (
            <div className="py-12 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">
              No webcam snapshots recorded yet. Camera frames appear here when candidates take proctored tests.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {snapshotsList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  onClick={() => setSelectedSnapshot(item)}
                  className="group relative rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:border-brand-500/60 transition shadow-md"
                >
                  <div className="aspect-video bg-black overflow-hidden relative">
                    <img
                      src={item.snapshot_url}
                      alt="Proctoring Snapshot"
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 text-white text-xs font-mono flex items-center space-x-1.5 shadow-xl">
                        <ZoomIn className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Enlarge Snapshot</span>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur text-[10px] font-mono text-white">
                      {item.event_type.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div className="p-3 text-xs font-mono space-y-1 bg-white dark:bg-slate-900">
                    <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold truncate">
                      <span>{item.candidate_name}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{item.candidate_email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Snapshot Zoom Lightbox Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Webcam Telemetry Evidence</h4>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                  Candidate: <strong className="text-slate-900 dark:text-white">{selectedSnapshot.candidate_name}</strong> ({selectedSnapshot.candidate_email})
                </p>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 aspect-video flex items-center justify-center shadow-inner">
              <img
                src={selectedSnapshot.snapshot_url}
                alt="Enlarged Evidence"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono pt-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/50 font-bold">
                  {selectedSnapshot.event_type.replace(/_/g, ' ')}
                </span>
                <span className="text-slate-600 dark:text-slate-400">
                  Recorded: {new Date(selectedSnapshot.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
