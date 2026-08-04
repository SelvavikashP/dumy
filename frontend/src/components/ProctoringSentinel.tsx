import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Maximize2, ShieldAlert, Wifi, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

interface ProctoringSentinelProps {
  attemptId: string;
  cameraRequired: boolean;
  micRequired: boolean;
  fullscreenRequired: boolean;
  tabDetectionEnabled: boolean;
  onWarningTriggered: (warningMsg: string, activeCount: number, limit: number, isSuspended: boolean) => void;
}

export const ProctoringSentinel: React.FC<ProctoringSentinelProps> = ({
  attemptId,
  cameraRequired,
  micRequired,
  fullscreenRequired,
  tabDetectionEnabled,
  onWarningTriggered
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const isHandlingViolationRef = useRef<boolean>(false);

  // Initialize Media Streams (Webcam + Mic)
  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrame: number;

    const setupMedia = async () => {
      if (!cameraRequired && !micRequired) return;
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: cameraRequired ? { width: { ideal: 320 }, height: { ideal: 240 } } : false,
          audio: micRequired
        });

        if (videoRef.current && cameraRequired) {
          videoRef.current.srcObject = mediaStream;
        }
        setStreamActive(true);

        // Audio Level Analyzer if mic required
        if (micRequired) {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(mediaStream);
          analyser = audioContext.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const checkAudio = () => {
            if (analyser) {
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round(avg * 1.5)));

              // Report high ambient speech signal
              if (avg > 85 && !isHandlingViolationRef.current) {
                reportViolation('SUSPICIOUS_AUDIO', 'MEDIUM', { volume: avg });
              }
            }
            animFrame = requestAnimationFrame(checkAudio);
          };
          checkAudio();
        }
      } catch (err: any) {
        console.warn('Camera / Microphone permission denied or unavailable:', err);
        setCameraError(err.message || 'Media stream unavailable');
      }
    };

    setupMedia();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
      cancelAnimationFrame(animFrame);
    };
  }, [cameraRequired, micRequired]);

  // Violation reporting function
  const reportViolation = async (eventType: string, severity = 'MEDIUM', metadata: any = {}) => {
    if (isHandlingViolationRef.current) return;
    isHandlingViolationRef.current = true;
    setTimeout(() => { isHandlingViolationRef.current = false; }, 3000); // 3s debounce

    try {
      const res = await api.reportProctoringEvent({
        attempt_id: attemptId,
        event_type: eventType,
        severity,
        confidence: 0.95,
        metadata
      });

      if (res.warning_issued || res.is_suspended) {
        onWarningTriggered(
          res.message || 'Security requirement violation detected.',
          res.active_warnings,
          res.warning_limit,
          res.is_suspended
        );
      }
    } catch (err) {
      console.error('Failed to report proctoring event:', err);
    }
  };

  // Browser Lock Listeners (Fullscreen, Tab Visibility, Clipboard)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullscreen(active);
      if (!active && fullscreenRequired) {
        reportViolation('FULLSCREEN_EXIT', 'HIGH', { timestamp: new Date().toISOString() });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && tabDetectionEnabled) {
        reportViolation('TAB_SWITCH', 'MEDIUM', { timestamp: new Date().toISOString() });
      }
    };

    const handleWindowBlur = () => {
      if (tabDetectionEnabled) {
        reportViolation('WINDOW_BLUR', 'LOW', { timestamp: new Date().toISOString() });
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      reportViolation('COPY', 'LOW', { action: 'copy_blocked' });
    };

    const handlePaste = (e: ClipboardEvent) => {
      // Allow code editor paste or track as event
      reportViolation('PASTE', 'LOW', { action: 'paste_tracked' });
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
    };
  }, [attemptId, fullscreenRequired, tabDetectionEnabled]);

  const requestFullscreenMode = () => {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div className="bg-surface-850/90 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col space-y-2.5">
      {/* Sentinel Title Bar */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5 font-semibold text-brand-300">
          <ShieldAlert className="w-4 h-4 text-brand-400" />
          <span>Proctoring Sentinel</span>
        </div>
        <div className="flex items-center space-x-1 text-[10px] text-accent-emerald font-mono">
          <span className="w-2 h-2 rounded-full bg-accent-emerald animate-pulse" />
          <span>ACTIVE</span>
        </div>
      </div>

      {/* Webcam Preview Box */}
      {cameraRequired && (
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-slate-700/80 shadow-inner">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
            style={{ transform: 'scaleX(-1)' }}
          />

          {!streamActive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-400 p-2 text-center text-[11px]">
              <Camera className="w-5 h-5 text-slate-500 mb-1" />
              <span>{cameraError || 'Initializing Camera Feed...'}</span>
            </div>
          )}

          <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur text-[9px] font-mono text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>REC &bull; LIVE</span>
          </div>
        </div>
      )}

      {/* Status Signals Grid */}
      <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/40 text-slate-300">
          <Camera className="w-3.5 h-3.5 text-brand-400" />
          <span>Cam: {streamActive ? 'Online' : 'Pending'}</span>
        </div>

        <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/40 text-slate-300">
          <Mic className="w-3.5 h-3.5 text-accent-cyan" />
          <div className="flex items-center space-x-1 flex-1">
            <span>Mic:</span>
            <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-accent-cyan transition-all duration-100"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        </div>

        {fullscreenRequired && (
          <div
            onClick={!isFullscreen ? requestFullscreenMode : undefined}
            className={`col-span-2 flex items-center justify-between px-2 py-1 rounded border text-[11px] cursor-pointer transition ${
              isFullscreen
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800/50 text-amber-300 animate-pulse'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Fullscreen: {isFullscreen ? 'Locked' : 'Click to Re-lock'}</span>
            </div>
            {!isFullscreen && <span className="text-[10px] underline font-sans">Lock</span>}
          </div>
        )}
      </div>
    </div>
  );
};
