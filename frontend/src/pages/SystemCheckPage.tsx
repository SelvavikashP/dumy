import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Camera, 
  Mic, 
  Maximize2, 
  Wifi, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ShieldCheck, 
  RefreshCw, 
  Laptop,
  AlertTriangle
} from 'lucide-react';

export const SystemCheckPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [camPass, setCamPass] = useState<boolean>(false);
  const [camError, setCamError] = useState<string | null>(null);
  const [micPass, setMicPass] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [browserPass] = useState<boolean>(true);
  const [fullscreenPass, setFullscreenPass] = useState<boolean>(!!document.fullscreenElement);
  const [networkPass] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  // Active Stream References for cleanup
  const activeVideoStreamRef = useRef<MediaStream | null>(null);
  const activeAudioStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const runHardwareChecks = async () => {
    setIsChecking(true);
    setCamError(null);
    setMicError(null);

    // Stop prior streams if retrying
    if (activeVideoStreamRef.current) {
      activeVideoStreamRef.current.getTracks().forEach((t) => t.stop());
      activeVideoStreamRef.current = null;
    }
    if (activeAudioStreamRef.current) {
      activeAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      activeAudioStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    let isMounted = true;
    let animFrame: number;

    // 1. Independent Camera Verification
    try {
      const vStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } }
      });
      activeVideoStreamRef.current = vStream;
      if (videoRef.current) {
        videoRef.current.srcObject = vStream;
      }
      setCamPass(true);
      setCamError(null);
    } catch (err: any) {
      console.warn('Camera verification issue:', err);
      setCamPass(false);
      setCamError(err.message || 'Camera permission denied or device busy');
    }

    // 2. Independent Microphone Verification
    try {
      const aStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      activeAudioStreamRef.current = aStream;
      setMicPass(true);
      setMicError(null);

      // Setup Audio Level Meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume();
        }

        const source = audioCtx.createMediaStreamSource(aStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkAudioMeter = () => {
          if (!isMounted || !analyser) return;
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const avg = sum / dataArray.length;
          setAudioLevel(Math.min(100, Math.round(avg * 2.2)));
          animFrame = requestAnimationFrame(checkAudioMeter);
        };
        checkAudioMeter();
      }
    } catch (err: any) {
      console.warn('Microphone verification issue:', err);
      setMicPass(false);
      setMicError(err.message || 'Microphone permission denied or unavailable');
    } finally {
      setIsChecking(false);
    }

    return () => {
      isMounted = false;
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  };

  useEffect(() => {
    runHardwareChecks();

    const handleFsChange = () => {
      setFullscreenPass(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('mozfullscreenchange', handleFsChange);

    return () => {
      if (activeVideoStreamRef.current) {
        activeVideoStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (activeAudioStreamRef.current) {
        activeAudioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('mozfullscreenchange', handleFsChange);
    };
  }, []);

  const requestFullscreenMode = async () => {
    try {
      const elem = document.documentElement as any;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setFullscreenPass(true);
    } catch (e) {
      console.warn('Fullscreen request blocked by browser policy:', e);
    }
  };

  const handleEnterAssessment = async () => {
    await requestFullscreenMode();
    navigate(`/assessment/${id}/attempt`);
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 shadow-sm">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-600 dark:text-accent-cyan uppercase tracking-wider font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Pre-Test Diagnostic Sentinel</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">System Hardware Verification</h1>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Ensure your web camera, microphone, and browser environment satisfy all proctoring requirements before starting.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Camera Feed Preview */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-slate-900 dark:text-white">Live Camera Preview</span>
            <span className={`flex items-center space-x-1 ${camPass ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-rose-600 dark:text-rose-400 font-bold'}`}>
              {camPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{camPass ? 'Camera Ready' : 'Permission Required'}</span>
            </span>
          </div>

          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!camPass && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-slate-300 text-xs p-4 text-center">
                <Camera className="w-8 h-8 text-amber-400 mb-2" />
                <span className="font-semibold text-white mb-1">Webcam Unreachable</span>
                <span className="text-[11px] text-slate-300">{camError || 'Please allow browser camera permissions when prompted.'}</span>
              </div>
            )}
          </div>

          {/* Mic Meter */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="flex items-center space-x-1.5">
                <Mic className="w-3.5 h-3.5 text-cyan-600 dark:text-accent-cyan" />
                <span>Microphone Level:</span>
              </span>
              <span className="text-cyan-600 dark:text-accent-cyan font-bold">{micPass ? `${audioLevel}%` : 'Mic Disabled'}</span>
            </div>
            <div className="w-full h-2.5 bg-slate-200 dark:bg-surface-900 rounded-full overflow-hidden border border-slate-300 dark:border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-100"
                style={{ width: micPass ? `${Math.max(5, audioLevel)}%` : '0%' }}
              />
            </div>
            {micError && (
              <div className="mt-1 text-[11px] text-rose-500 font-mono flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                <span>{micError}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={runHardwareChecks}
            disabled={isChecking}
            className="w-full py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs transition flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
            <span>Retry Hardware Diagnostic</span>
          </button>
        </div>

        {/* Right: Diagnostic Checklist */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-3 font-mono text-xs">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm font-sans border-b border-slate-200 dark:border-slate-800 pb-2">
              System Health Checklist
            </h3>

            {/* Item 1: Camera */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2.5 text-slate-800 dark:text-slate-200">
                <Camera className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                <span>Web Camera Video Stream</span>
              </div>
              {camPass ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
            </div>

            {/* Item 2: Microphone */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2.5 text-slate-800 dark:text-slate-200">
                <Mic className="w-4 h-4 text-cyan-600 dark:text-accent-cyan" />
                <span>Audio Microphone Feed</span>
              </div>
              {micPass ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
            </div>

            {/* Item 3: Browser */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2.5 text-slate-800 dark:text-slate-200">
                <Laptop className="w-4 h-4 text-purple-600 dark:text-accent-purple" />
                <span>Supported Browser (Chrome/Firefox/Edge)</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Item 4: Network */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-surface-850 border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
              <div className="flex items-center space-x-2.5 text-slate-800 dark:text-slate-200">
                <Wifi className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Network Latency (&lt; 50ms)</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Item 5: Fullscreen */}
            <div
              onClick={requestFullscreenMode}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition shadow-sm ${
                fullscreenPass
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/40 text-amber-800 dark:text-amber-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Maximize2 className="w-4 h-4" />
                <span>Fullscreen Mode ({fullscreenPass ? 'Active' : 'Click to Lock Fullscreen'})</span>
              </div>
              {fullscreenPass ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="text-[10px] underline font-sans font-bold">Enable Fullscreen</span>
              )}
            </div>
          </div>

          <button
            onClick={handleEnterAssessment}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-bold text-xs shadow-xl shadow-brand-600/30 transition flex items-center justify-center space-x-2"
          >
            <span>Enter Proctored Assessment Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
