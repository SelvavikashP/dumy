import React, { useState } from 'react';
import { 
  Award, 
  ShieldCheck, 
  Printer, 
  Share2, 
  CheckCircle2, 
  X, 
  Copy, 
  ExternalLink, 
  QrCode,
  Sparkles
} from 'lucide-react';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificate: {
    certificate_id: string;
    candidate_name: string;
    candidate_email: string;
    assessment_title: string;
    score_percentage: number;
    total_score: number;
    max_score: number;
    passed: boolean;
    issue_date: string;
    verification_url: string;
    verification_hash: string;
    proctoring_integrity_score: number;
    skill_breakdown: Array<{ category: string; score_percentage: number; status: string }>;
    issuer: string;
  };
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  certificate
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${certificate.verification_url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static animate-fadeIn">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden font-sans my-8 print:border-none print:shadow-none print:m-0 print:w-full">
        
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80 print:hidden">
          <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Official Verifiable Credential</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center space-x-1.5 border border-slate-700 transition"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              <span>{copied ? 'Verification Link Copied' : 'Share Link'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-amber-500/20 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Download PDF / Print</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Canvas Area */}
        <div className="p-8 sm:p-12 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white select-none print:p-8 print:bg-white print:text-black">
          
          {/* Certificate Ornamental Border */}
          <div className="border-4 border-amber-500/40 p-6 sm:p-10 rounded-2xl relative bg-slate-900/60 shadow-2xl print:border-amber-700 print:bg-white">
            
            {/* Corner Filigree Accents */}
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400/80 rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400/80 rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400/80 rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400/80 rounded-br-lg" />

            {/* Header Platform Seal */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-xl shadow-amber-500/20 mx-auto">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center print:bg-white">
                  <Award className="w-8 h-8 text-amber-400 print:text-amber-700" />
                </div>
              </div>

              <div>
                <span className="text-[11px] font-mono tracking-[0.3em] uppercase text-amber-400/90 font-bold block">
                  EvalAI Enterprise Certification Authority
                </span>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mt-1 uppercase font-serif print:text-slate-900">
                  Certificate of Achievement
                </h1>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Proctored Technical Assessment &bull; Verified Competency
                </p>
              </div>
            </div>

            {/* Candidate Name Presentation */}
            <div className="text-center my-8 space-y-2">
              <span className="text-xs text-slate-400 font-serif italic">This is proudly presented to</span>
              <div className="text-2xl sm:text-4xl font-bold text-amber-300 font-serif tracking-wide border-b border-amber-500/30 pb-3 max-w-lg mx-auto print:text-amber-800">
                {certificate.candidate_name}
              </div>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed pt-2">
                For successfully qualifying the comprehensive proctored technical assessment for{' '}
                <strong className="text-white print:text-black">{certificate.assessment_title}</strong> with distinguished performance.
              </p>
            </div>

            {/* Performance Metrics Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-8 font-mono text-center">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase block">Final Score</span>
                <strong className="text-base text-amber-400 font-bold print:text-amber-700">
                  {certificate.score_percentage}%
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase block">Total Points</span>
                <strong className="text-base text-white font-bold print:text-black">
                  {certificate.total_score} / {certificate.max_score}
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase block">Integrity Score</span>
                <strong className="text-base text-emerald-400 font-bold print:text-emerald-700">
                  {certificate.proctoring_integrity_score}%
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 print:border-slate-300 print:bg-slate-50">
                <span className="text-[10px] text-slate-400 uppercase block">Status</span>
                <strong className="text-base text-emerald-400 font-bold print:text-emerald-700">
                  QUALIFIED
                </strong>
              </div>
            </div>

            {/* Skill Breakdown */}
            {certificate.skill_breakdown && certificate.skill_breakdown.length > 0 && (
              <div className="my-6 p-4 rounded-xl bg-slate-950/40 border border-slate-800/80 font-mono text-xs print:border-slate-300">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block mb-2">
                  Verified Competency Evaluation
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {certificate.skill_breakdown.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] p-1.5 rounded bg-slate-900/60">
                      <span className="text-slate-300">{s.category}:</span>
                      <span className="text-amber-400 font-bold">{s.score_percentage}% ({s.status})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Verification & Signatures */}
            <div className="border-t border-slate-800 pt-6 mt-6 flex flex-col sm:flex-row items-center justify-between gap-6 print:border-slate-300">
              {/* Verification Serial & Hash */}
              <div className="text-left space-y-1 font-mono text-xs">
                <div className="flex items-center space-x-1.5 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold">Serial: {certificate.certificate_id}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  HMAC Digest: <span className="text-slate-400">{certificate.verification_hash}</span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Issue Date: <span className="text-slate-300">{certificate.issue_date}</span>
                </div>
              </div>

              {/* Hologram Stamp Seal */}
              <div className="flex items-center space-x-6 text-center">
                <div>
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-amber-500/60 flex flex-col items-center justify-center p-1 bg-amber-500/5 mx-auto">
                    <Sparkles className="w-4 h-4 text-amber-400 mb-0.5" />
                    <span className="text-[8px] font-mono uppercase tracking-widest text-amber-400">VERIFIED</span>
                  </div>
                  <span className="text-[10px] font-serif text-slate-400 block mt-1">Platform Registrar</span>
                </div>

                <div className="border-l border-slate-800 pl-6 text-left">
                  <div className="font-serif italic text-amber-300 text-sm">EvalAI Board</div>
                  <div className="text-[10px] text-slate-400 font-mono">Automated Proctor Audit</div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
