import React, { useEffect, useRef, useState } from 'react';
import { Camera, Mic, Maximize2, ShieldAlert, AlertTriangle, Users, EyeOff } from 'lucide-react';
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
  const [faceCount, setFaceCount] = useState<number>(1);
  const [faceStatusMsg, setFaceStatusMsg] = useState<string>('1 Person Verified');

  const isHandlingViolationRef = useRef<boolean>(false);
  const lastViolationTimeRef = useRef<number>(0);

  // Consecutive Persistence Counters to prevent false positive single-frame glitches
  const consecutiveNoFaceRef = useRef<number>(0);
  const consecutiveMultiFaceRef = useRef<number>(0);

  const activeVideoStreamRef = useRef<MediaStream | null>(null);
  const activeAudioStreamRef = useRef<MediaStream | null>(null);

  // Violation reporting function with 5-second debounce & safe thresholding
  const reportViolation = async (eventType: string, severity = 'MEDIUM', metadata: any = {}) => {
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 5000 || isHandlingViolationRef.current) {
      return;
    }
    lastViolationTimeRef.current = now;
    isHandlingViolationRef.current = true;

    const snapshotBase64 = captureSnapshotFrame();

    try {
      const res = await api.reportProctoringEvent({
        attempt_id: attemptId,
        event_type: eventType,
        severity,
        confidence: 0.95,
        metadata,
        snapshot_url: snapshotBase64 || undefined
      });

      if (res.warning_issued || res.is_suspended) {
        onWarningTriggered(
          res.message || 'Security violation detected during assessment.',
          res.active_warnings,
          res.warning_limit,
          res.is_suspended
        );
      }
    } catch (err) {
      console.error('Failed to report proctoring event:', err);
    } finally {
      setTimeout(() => {
        isHandlingViolationRef.current = false;
      }, 5000);
    }
  };

  // Initialize Media Streams (Webcam + Mic)
  useEffect(() => {
    let isMounted = true;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrame: number;

    const setupMedia = async () => {
      // 1. Camera Stream setup
      if (cameraRequired) {
        try {
          const vStream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 320 }, height: { ideal: 240 } }
          });
          activeVideoStreamRef.current = vStream;
          if (videoRef.current) {
            videoRef.current.srcObject = vStream;
          }
          setStreamActive(true);
          setCameraError(null);
        } catch (err: any) {
          console.warn('Proctoring Sentinel Camera stream error:', err);
          setCameraError(err.message || 'Camera permission denied');
        }
      }

      // 2. Microphone Stream setup & Audio Analyzer
      if (micRequired) {
        try {
          const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          activeAudioStreamRef.current = aStream;

          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            audioContext = new AudioCtx();
            if (audioContext.state === 'suspended') {
              await audioContext.resume();
            }
            const source = audioContext.createMediaStreamSource(aStream);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const checkAudio = () => {
              if (!isMounted || !analyser) return;
              analyser.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const avg = sum / dataArray.length;
              setAudioLevel(Math.min(100, Math.round(avg * 1.8)));

              if (avg > 95) {
                reportViolation('SUSPICIOUS_AUDIO', 'MEDIUM', { volume: avg });
              }
              animFrame = requestAnimationFrame(checkAudio);
            };
            checkAudio();
          }
        } catch (err: any) {
          console.warn('Proctoring Sentinel Microphone error:', err);
        }
      }
    };

    setupMedia();

    return () => {
      isMounted = false;
      if (activeVideoStreamRef.current) {
        activeVideoStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (activeAudioStreamRef.current) {
        activeAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [cameraRequired, micRequired]);

  // Real-time Face & Person Count Detection Loop with 4-Frame Persistence Verification
  useEffect(() => {
    if (!cameraRequired || !streamActive) return;

    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const detectFaces = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || !ctx) return;

      try {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;

        // Skin Tone & Facial Feature Luminance Segmentation
        let skinPixelCount = 0;
        let minX = canvas.width, maxX = 0;
        const columnSkinCounts = new Array(canvas.width).fill(0);

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];

          const isSkin = (r > 60 && g > 40 && b > 20 && Math.max(r, g, b) - Math.min(r, g, b) > 15 && Math.abs(r - g) > 12 && r > g && r > b);
          if (isSkin) {
            skinPixelCount++;
            const pixelIdx = i / 4;
            const x = pixelIdx % canvas.width;
            columnSkinCounts[x]++;
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
          }
        }

        // Count spatial skin clusters across horizontal columns to identify multiple people
        let clusterCount = 0;
        let inCluster = false;
        for (let x = 0; x < canvas.width; x++) {
          if (columnSkinCounts[x] > 18) {
            if (!inCluster) {
              clusterCount++;
              inCluster = true;
            }
          } else {
            inCluster = false;
          }
        }

        if (skinPixelCount < 150) {
          consecutiveNoFaceRef.current += 1;
          consecutiveMultiFaceRef.current = 0;
          setFaceCount(0);
          setFaceStatusMsg('No Person Detected');

          // ONLY trigger warning after 4 consecutive sampling checks (8+ seconds)
          if (consecutiveNoFaceRef.current >= 4) {
            reportViolation('FACE_NOT_DETECTED', 'MEDIUM', { skinPixelCount });
          }
        } else if (clusterCount > 1 && (maxX - minX) > 105) {
          consecutiveMultiFaceRef.current += 1;
          consecutiveNoFaceRef.current = 0;
          setFaceCount(2);
          setFaceStatusMsg('Multiple Persons Detected!');

          // ONLY trigger warning after 4 consecutive sampling checks (8+ seconds)
          if (consecutiveMultiFaceRef.current >= 4) {
            reportViolation('MULTIPLE_FACES', 'HIGH', { clusterCount, span: maxX - minX });
          }
        } else {
          consecutiveNoFaceRef.current = 0;
          consecutiveMultiFaceRef.current = 0;
          setFaceCount(1);
          setFaceStatusMsg('1 Person Verified');
        }
      } catch (e) {
        // Safe canvas read fallback
      }
    };

    const interval = setInterval(detectFaces, 2000);
    return () => clearInterval(interval);
  }, [cameraRequired, streamActive]);

  // Capture compressed video frame as base64 JPEG
  const captureSnapshotFrame = (): string | null => {
    if (!videoRef.current || !streamActive) return null;
    try {
      const video = videoRef.current;
      if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) return null;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/jpeg', 0.65);
    } catch (err) {
      console.warn('Failed to capture canvas snapshot frame:', err);
      return null;
    }
  };

  // Periodic Sentinel Snapshot Check (every 60s)
  useEffect(() => {
    if (!cameraRequired || !streamActive) return;
    const interval = setInterval(async () => {
      const snap = captureSnapshotFrame();
      if (snap) {
        try {
          await api.uploadProctoringSnapshot({
            attempt_id: attemptId,
            snapshot_base64: snap,
            event_type: 'PERIODIC_CHECK',
            confidence: 1.0,
            metadata: { trigger: 'periodic_60s_sentinel', faceCount }
          });
        } catch (e) {
          // background fail safe
        }
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [attemptId, cameraRequired, streamActive, faceCount]);

  // Accurate Tab Switch & Fullscreen Listeners (Excludes false window.blur clicks inside editor)
  useEffect(() => {
    // 2-second grace period on initial mount
    const graceTimer = setTimeout(() => {
      const handleFullscreenChange = () => {
        const active = !!document.fullscreenElement;
        setIsFullscreen(active);
        if (!active && fullscreenRequired) {
          reportViolation('FULLSCREEN_EXIT', 'HIGH', { timestamp: new Date().toISOString() });
        }
      };

      const handleVisibilityChange = () => {
        // ONLY trigger tab switch warning when document is explicitly hidden (tab switched / window minimized)
        if (document.hidden && tabDetectionEnabled) {
          reportViolation('TAB_SWITCH', 'HIGH', { timestamp: new Date().toISOString() });
        }
      };

      const handleCopy = (e: ClipboardEvent) => {
        e.preventDefault();
        reportViolation('COPY', 'LOW', { action: 'copy_blocked' });
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      document.addEventListener('copy', handleCopy);
    }, 2000);

    return () => {
      clearTimeout(graceTimer);
    };
  }, [attemptId, fullscreenRequired, tabDetectionEnabled]);

  const requestFullscreenMode = async () => {
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) await elem.requestFullscreen();
      else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
      else if (elem.mozRequestFullScreen) await elem.mozRequestFullScreen();
      else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
      setIsFullscreen(true);
    } catch (e) {
      console.warn('Fullscreen lock error:', e);
    }
  };

  return (
    <>
      {/* Fullscreen Overlay Banner if Fullscreen Required but Inactive */}
      {fullscreenRequired && !isFullscreen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full glass-panel p-8 rounded-2xl border border-amber-500/40 space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Fullscreen Security Mode Lost</h2>
              <p className="text-xs text-slate-300 mt-2 font-mono">
                Switching windows or exiting fullscreen is prohibited. Click below to re-enable locked fullscreen mode and continue your assessment.
              </p>
            </div>
            <button
              onClick={requestFullscreenMode}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-brand-600 hover:from-amber-400 hover:to-brand-500 text-white font-sans font-bold text-xs shadow-xl transition flex items-center justify-center space-x-2"
            >
              <Maximize2 className="w-4 h-4" />
              <span>Re-Enter Fullscreen Mode Now</span>
            </button>
          </div>
        </div>
      )}

      {/* Sentinel Sidebar Widget */}
      <div className="bg-slate-900 dark:bg-surface-850 border border-slate-800 rounded-xl p-3 shadow-lg flex flex-col space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 font-semibold text-brand-400">
            <ShieldAlert className="w-4 h-4 text-brand-400" />
            <span>Proctoring Sentinel</span>
          </div>
          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
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
              className="w-full h-full object-cover"
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

            {/* Real-time Person Count Indicator Badge */}
            <div className={`absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded backdrop-blur text-[10px] font-mono font-bold flex items-center space-x-1 ${
              faceCount === 1 ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' :
              faceCount > 1 ? 'bg-rose-950/90 text-rose-300 border border-rose-500/60 animate-pulse' :
              'bg-amber-950/90 text-amber-300 border border-amber-500/60'
            }`}>
              {faceCount > 1 ? <Users className="w-3 h-3 text-rose-400" /> : faceCount === 0 ? <EyeOff className="w-3 h-3 text-amber-400" /> : <ShieldAlert className="w-3 h-3 text-emerald-400" />}
              <span>{faceStatusMsg}</span>
            </div>
          </div>
        )}

        {/* Status Signals Grid */}
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
          <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/40 text-slate-300">
            <Camera className="w-3.5 h-3.5 text-brand-400" />
            <span>Cam: {streamActive ? (faceCount > 1 ? 'Multi-Face' : 'Online') : 'Off'}</span>
          </div>

          <div className="flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-800/60 border border-slate-700/40 text-slate-300">
            <Mic className="w-3.5 h-3.5 text-cyan-400" />
            <div className="flex items-center space-x-1 flex-1">
              <span>Mic:</span>
              <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyan-400 transition-all duration-100"
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
              {!isFullscreen && <span className="text-[10px] underline font-sans font-bold">Lock</span>}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
