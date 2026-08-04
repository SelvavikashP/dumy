import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Lock } from 'lucide-react';

interface WarningModalProps {
  isOpen: boolean;
  message: string;
  warningNumber: number;
  warningLimit: number;
  isSuspended: boolean;
  onAcknowledge: () => void;
}

export const WarningModal: React.FC<WarningModalProps> = ({
  isOpen,
  message,
  warningNumber,
  warningLimit,
  isSuspended,
  onAcknowledge
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl transition-all duration-300 ${
          isSuspended
            ? 'bg-gradient-to-b from-rose-950/90 to-surface-900 border-rose-600/50 glow-rose'
            : 'bg-gradient-to-b from-amber-950/90 to-surface-900 border-amber-600/50'
        }`}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isSuspended ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isSuspended ? <Lock className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6 animate-bounce" />}
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              {isSuspended ? 'Session Suspended' : `Security Warning ${warningNumber} of ${warningLimit}`}
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              {isSuspended ? 'Proctoring Security Threshold Exceeded' : 'Automated Sentinel Notice'}
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-900/80 border border-slate-800 mb-6 text-sm text-slate-200 leading-relaxed font-sans">
          {message}
        </div>

        {/* Warning Indicator dots */}
        {!isSuspended && (
          <div className="flex items-center justify-between mb-6 px-2">
            <span className="text-xs text-slate-400 font-mono">Allowed Threshold:</span>
            <div className="flex items-center space-x-1.5">
              {Array.from({ length: warningLimit }).map((_, idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx < warningNumber
                      ? 'bg-rose-500 shadow-sm shadow-rose-500/50 scale-110'
                      : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        <button
          onClick={onAcknowledge}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition shadow-lg ${
            isSuspended
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
          }`}
        >
          {isSuspended ? 'View Suspension Summary' : 'I Understand & Return to Assessment'}
        </button>
      </div>
    </div>
  );
};
