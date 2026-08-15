import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CertificateModal } from '../components/CertificateModal';
import { 
  Layers, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight, 
  Play, 
  Award,
  AlertCircle,
  FileCheck,
  UserCheck,
  Mail,
  ShieldCheck,
  RotateCw,
  X,
  FileBadge
} from 'lucide-react';

export const AttenderDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isVerified, setIsVerified] = useState<boolean>(true);

  // Certificate Modal state
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [certModalOpen, setCertModalOpen] = useState<boolean>(false);
  const [certLoadingId, setCertLoadingId] = useState<string | null>(null);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifySuccess, setVerifySuccess] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState<number>(0);

  useEffect(() => {
    let timer: any;
    if (resendCooldown > 0) {
      timer = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.listAssignedAssessments();
        setAssessments(data);
        const profile = await api.getProfile();
        if (profile) {
          setIsVerified(profile.is_verified ?? true);
        }
      } catch (e) {
        console.error('Failed to load assigned assessments:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleOpenVerifyModal = async () => {
    setShowVerifyModal(true);
    setVerifyError(null);
    setVerifySuccess(null);
    setOtpCode('');
    if (user?.email && resendCooldown === 0) {
      try {
        await api.sendVerificationOTP(user.email);
        setResendCooldown(60);
        setVerifySuccess(`Verification OTP sent to ${user.email}`);
      } catch (e: any) {
        setVerifyError(e.message || 'Failed to send OTP');
      }
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email || otpCode.length < 6) return;
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      await api.verifyEmailOTP(user.email, otpCode);
      setIsVerified(true);
      setVerifySuccess('Email successfully verified!');
      setTimeout(() => setShowVerifyModal(false), 1500);
    } catch (e: any) {
      setVerifyError(e.message || 'Invalid or expired OTP');
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResend = async () => {
    if (!user?.email || resendCooldown > 0) return;
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      await api.sendVerificationOTP(user.email);
      setResendCooldown(60);
      setVerifySuccess(`Fresh verification code sent to ${user.email}`);
    } catch (e: any) {
      setVerifyError(e.message || 'Failed to resend OTP');
    } finally {
      setVerifyLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-8 font-sans">
      {/* Candidate Profile Header */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-accent-cyan p-0.5 shadow-xl shadow-brand-500/20">
            <div className="w-full h-full bg-white dark:bg-surface-900 rounded-[14px] flex items-center justify-center font-extrabold text-xl text-slate-900 dark:text-white">
              {user?.full_name?.charAt(0) || 'C'}
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.full_name}</h1>
              {isVerified ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>Verified Candidate</span>
                </span>
              ) : (
                <button
                  onClick={handleOpenVerifyModal}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 hover:bg-amber-200 dark:hover:bg-amber-500/30 transition flex items-center space-x-1"
                >
                  <Mail className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span>Verify Email (OTP)</span>
                </button>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-surface-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
            Assigned Exams: <strong className="text-slate-900 dark:text-white">{assessments.length}</strong>
          </div>
        </div>
      </div>

      {/* Assigned Assessments Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center space-x-2">
            <Layers className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <span>Assigned Proctored Assessments</span>
          </h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400 text-xs font-mono">
            Loading your assigned assessments...
          </div>
        ) : assessments.length === 0 ? (
          <div className="py-16 text-center glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <CheckCircle2 className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Pending Assessments</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mx-auto">
              You are all caught up! New recruitment invitations and reminders will appear here and be sent to your Gmail.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assessments.map((asm) => {
              const attempt = asm.latest_attempt;
              const isCompleted = attempt?.status === 'COMPLETED';
              const isSuspended = attempt?.status === 'SUSPENDED';
              const isActive = attempt?.status === 'ACTIVE';

              return (
                <div
                  key={asm.id}
                  className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between shadow-sm"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-tight">{asm.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {asm.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                      {asm.description || 'Comprehensive proctored assessment.'}
                    </p>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-surface-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-5">
                      <div className="flex items-center space-x-1.5">
                        <Clock className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
                        <span>{asm.duration_minutes} Mins</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-600 dark:text-accent-cyan" />
                        <span>Proctor: {asm.proctoring_level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status & Entry Action */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                    <div>
                      {isCompleted && (
                        <div className="flex items-center space-x-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Completed ({attempt.score} pts &bull; {attempt.percentage}%)</span>
                        </div>
                      )}
                      {isSuspended && (
                        <div className="flex items-center space-x-1.5 text-xs text-rose-600 dark:text-rose-400 font-mono font-semibold">
                          <AlertCircle className="w-4 h-4" />
                          <span>Session Suspended</span>
                        </div>
                      )}
                      {!isCompleted && !isSuspended && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          {isActive ? 'Session in progress' : 'Ready to begin'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      {isCompleted ? (
                        <>
                          <button
                            type="button"
                            onClick={async () => {
                              setCertLoadingId(attempt.id);
                              try {
                                const cert = await api.getCertificate(attempt.id);
                                setSelectedCert(cert);
                                setCertModalOpen(true);
                              } catch (e) {
                                alert('Certificate not available for this attempt.');
                              } finally {
                                setCertLoadingId(null);
                              }
                            }}
                            disabled={certLoadingId === attempt.id}
                            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-gradient-to-r dark:from-amber-500/20 dark:to-amber-600/20 hover:bg-amber-100 dark:hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40 font-medium text-xs font-mono transition flex items-center space-x-1.5 shadow-sm"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                            <span>{certLoadingId === attempt.id ? 'Loading...' : 'Certificate'}</span>
                          </button>
                          <Link
                            to={`/assessment/${asm.id}/result?attempt_id=${attempt.id}`}
                            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-medium text-xs font-sans transition border border-slate-200 dark:border-transparent"
                          >
                            View Scorecard
                          </Link>
                        </>
                      ) : isSuspended ? (
                        <Link
                          to={`/assessment/${asm.id}/reattempt?attempt_id=${attempt.id}`}
                          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs font-sans transition"
                        >
                          Request Reattempt
                        </Link>
                      ) : (
                        <Link
                          to={`/assessment/${asm.id}/instructions`}
                          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-brand-600/30 transition flex items-center space-x-1.5"
                        >
                          <span>{isActive ? 'Resume Test' : 'Start Assessment'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Official Certificate Modal */}
      {selectedCert && (
        <CertificateModal
          isOpen={certModalOpen}
          onClose={() => setCertModalOpen(false)}
          certificate={selectedCert}
        />
      )}

      {/* Verification OTP Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-sans">Email Verification</h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {verifyError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                <span>{verifyError}</span>
              </div>
            )}

            {verifySuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span>{verifySuccess}</span>
              </div>
            )}

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              <div className="bg-slate-50 dark:bg-surface-850 p-3 rounded-xl text-center border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Enter the 6-digit code sent to</span>
                <div className="font-bold text-slate-900 dark:text-white text-xs mt-0.5">{user?.email}</div>
              </div>

              <div className="flex justify-center">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  placeholder="• • • • • •"
                  className="w-44 py-2.5 bg-white dark:bg-surface-900 border-2 border-brand-500 rounded-xl text-center text-xl font-bold tracking-[6px] text-cyan-600 dark:text-cyan-300 focus:outline-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                disabled={verifyLoading || otpCode.length < 6}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-sans font-semibold text-xs shadow-lg transition disabled:opacity-50"
              >
                {verifyLoading ? 'Verifying...' : 'Confirm Verification Code'}
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || verifyLoading}
                  className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 disabled:text-slate-400 dark:disabled:text-slate-600 flex items-center space-x-1"
                >
                  <RotateCw className={`w-3 h-3 ${verifyLoading ? 'animate-spin' : ''}`} />
                  <span>{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code via Gmail'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVerifyModal(false)}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
