import React from 'react';
import Editor from '@monaco-editor/react';
import { useTheme } from '../context/ThemeContext';
import { Play, Send, RotateCcw, CheckCircle2, Code2 } from 'lucide-react';

interface MonacoCodeEditorProps {
  language: string;
  code: string;
  onChange: (value: string) => void;
  onLanguageChange: (lang: string) => void;
  onRun: () => void;
  onSubmit: () => void;
  onReset: () => void;
  isExecuting?: boolean;
  isSubmitting?: boolean;
  supportedLanguages?: string[];
  isAutoSaved?: boolean;
}

export const MonacoCodeEditor: React.FC<MonacoCodeEditorProps> = ({
  language,
  code,
  onChange,
  onLanguageChange,
  onRun,
  onSubmit,
  onReset,
  isExecuting = false,
  isSubmitting = false,
  supportedLanguages = ['python', 'javascript', 'cpp', 'java', 'go', 'rust'],
  isAutoSaved = true
}) => {
  const [fontSize, setFontSize] = React.useState<number>(14);
  const { theme } = useTheme();

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] dark:bg-[#1e1e1e] light:bg-[#f8fafc] rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 overflow-hidden shadow-2xl transition-colors duration-200">
      {/* Editor Header Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#252526] dark:bg-[#252526] light:bg-[#f1f5f9] border-b border-[#333333] dark:border-[#333333] light:border-slate-200 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 font-mono text-slate-300 dark:text-slate-300 light:text-slate-700">
            <Code2 className="w-4 h-4 text-brand-400" />
            <span className="font-semibold">Code Editor</span>
          </div>

          {/* Language Selector */}
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-[#333333] dark:bg-[#333333] light:bg-white text-slate-200 dark:text-slate-200 light:text-slate-800 rounded-lg px-2.5 py-1 text-xs border border-[#444444] dark:border-[#444444] light:border-slate-300 focus:outline-none focus:border-brand-500 font-mono shadow-sm"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang} value={lang}>
                {lang.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Autosave badge */}
          <div className="flex items-center space-x-1 text-[11px] text-slate-400 font-mono">
            <CheckCircle2 className="w-3 h-3 text-accent-emerald" />
            <span>{isAutoSaved ? 'Autosaved' : 'Saving...'}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2">
          {/* Font size */}
          <div className="hidden sm:flex items-center space-x-1 font-mono text-slate-400 text-[11px]">
            <button
              onClick={() => setFontSize((f) => Math.max(11, f - 1))}
              className="px-2 py-0.5 rounded bg-[#333333] dark:bg-[#333333] light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#444444] font-bold"
              title="Decrease Font Size"
            >
              -
            </button>
            <span className="px-1">{fontSize}px</span>
            <button
              onClick={() => setFontSize((f) => Math.min(22, f + 1))}
              className="px-2 py-0.5 rounded bg-[#333333] dark:bg-[#333333] light:bg-slate-200 text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-[#444444] font-bold"
              title="Increase Font Size"
            >
              +
            </button>
          </div>

          <button
            onClick={onReset}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Reset to default code"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Run Code Button */}
          <button
            onClick={onRun}
            disabled={isExecuting || isSubmitting}
            className="px-3.5 py-1.5 rounded-lg bg-surface-800 hover:bg-surface-700 text-slate-100 font-mono text-xs border border-slate-700 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Play className="w-3 h-3 text-accent-emerald fill-accent-emerald" />
            <span>{isExecuting ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={isExecuting || isSubmitting}
            className="px-4 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-semibold shadow-md shadow-brand-600/30 flex items-center space-x-1.5 transition disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
            <span>{isSubmitting ? 'Submitting...' : 'Submit Code'}</span>
          </button>
        </div>
      </div>

      {/* Monaco Container */}
      <div className="flex-1 min-h-[300px] w-full">
        <Editor
          height="100%"
          language={language === 'c' || language === 'cpp' ? 'cpp' : language}
          value={code}
          theme={theme === 'dark' ? 'vs-dark' : 'light'}
          onChange={(val) => onChange(val || '')}
          options={{
            fontSize: fontSize,
            fontFamily: 'Fira Code, Menlo, Monaco, Courier New, monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            cursorBlinking: 'smooth',
            smoothScrolling: true,
            padding: { top: 12, bottom: 12 }
          }}
        />
      </div>
    </div>
  );
};
