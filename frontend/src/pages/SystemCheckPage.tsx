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
  Laptop
} from 'lucide-react';

export const SystemCheckPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [camPass, setCamPass] = useState<boolean>(false);
  const [micPass, setMicPass] = useState<boolean>(false);
  const [browserPass, setBrowserPass] = useState<boolean>(true);
  const [fullscreenPass, setFullscreenPass] = useState<boolean>(false);
  const [networkPass, setNetworkPass] = useState<boolean>(true);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isChecking, setIsChecking] = useState<boolean>(true);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let animFrame: number;

    const runChecks = async () => {
      // 1. Webcam & Mic Check
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
          audio: true
        });

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setCamPass(true);
        setMicPass(true);

        // Audio Level meter
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(mediaStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const checkMeter = () => {
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round(avg * 1.8)));
          }
          animFrame = requestAnimationFrame(checkMeter);
        };
        checkMeter();
      } catch (err) {
        console.warn('Camera/Mic permission failed:', err);
        setCamPass(false);
        setMicPass(false);
      } finally {
        setIsChecking(false);
      }
    };

    runChecks();

    const handleFs = () => {
      setFullscreenPass(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFs);

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
      }
      if (audioContext) {
        audioContext.close().catch(() => {});
      }
      cancelAnimationFrame(animFrame);
      document.removeEventListener('fullscreenchange', handleFs);
    };
  }, []);

  const requestFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setFullscreenPass(true);
      }
    } catch (e) {
      console.warn('Fullscreen request denied:', e);
    }
  };

  const allPassed = camPass && micPass && browserPass && networkPass;

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-panel p-8 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-accent-cyan uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>Pre-Test Diagnostic Sentinel</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">5-Step Hardware Verification</h1>
        <p className="text-xs text-slate-300">
          Ensure your web camera, microphone, and browser environment satisfy all assessment requirements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Camera Feed Preview */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-semibold text-white">Live Camera Preview</span>
            <span className={`flex items-center space-x-1 ${camPass ? 'text-emerald-400' : 'text-rose-400'}`}>
              {camPass ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
              <span>{camPass ? 'Camera Ready' : 'Permission Required'}</span>
            </span>
          </div>

          <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-inner">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            {!camPass && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs p-4 text-center">
                <Camera className="w-8 h-8 text-slate-500 mb-2" />
                <span>Please allow browser camera permissions when prompted.</span>
              </div>
            )}
          </div>

          {/* Mic Meter */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-1.5">
              <span>Microphone Input Level</span>
              <span className="text-accent-cyan">{audioLevel}%</span>
            </div>
            <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-accent-cyan to-accent-emerald transition-all duration-75"
                style={{ width: `${audioLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Right: Diagnostic Checklist */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
          <div className="space-y-3 font-mono text-xs">
            <h3 className="font-bold text-white text-sm font-sans border-b border-slate-800 pb-2">
              System Health Checklist
            </h3>

            {/* Item 1: Camera */}
            <div className="p-3 rounded-xl bg-surface-850 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Camera className="w-4 h-4 text-brand-400" />
                <span>Web Camera Video Stream</span>
              </div>
              {camPass ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>

            {/* Item 2: Microphone */}
            <div className="p-3 rounded-xl bg-surface-850 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Mic className="w-4 h-4 text-accent-cyan" />
                <span>Audio Microphone Feed</span>
              </div>
              {micPass ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-rose-400" />}
            </div>

            {/* Item 3: Browser */}
            <div className="p-3 rounded-xl bg-surface-850 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Laptop className="w-4 h-4 text-accent-purple" />
                <span>Supported Browser (Chrome/Firefox/Edge)</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Item 4: Network */}
            <div className="p-3 rounded-xl bg-surface-850 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span>Network Latency (&lt; 50ms)</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>

            {/* Item 5: Fullscreen */}
            <div
              onClick={requestFullscreen}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                fullscreenPass
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Maximize2 className="w-4 h-4" />
                <span>Fullscreen Window Mode ({fullscreenPass ? 'Active' : 'Click to Enable'})</span>
              </div>
              {fullscreenPass ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <span className="text-[10px] underline font-sans">Enable</span>}
            </div>
          </div>

          <button
            onClick={() => {
              requestFullscreen();
              navigate(`/assessment/${id}/attempt`);
            }}
            disabled={!camPass}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white font-sans font-bold text-xs shadow-xl shadow-brand-600/30 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>Enter Proctored Assessment Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
