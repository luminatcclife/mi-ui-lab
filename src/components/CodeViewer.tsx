import React, { useState } from 'react';
import { Check, Copy, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface CodeViewerProps {
  code: string;
  language?: string;
  title?: string;
  onCopySuccess?: (msg: string) => void;
}

export function CodeViewer({
  code,
  language = 'tsx',
  title,
  onCopySuccess,
}: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      if (onCopySuccess) {
        onCopySuccess('¡Código copiado al portapapeles!');
      }
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className={`relative rounded-2xl border bg-zinc-900 dark:bg-zinc-950 overflow-hidden transition-all duration-300 ${
        copied
          ? 'border-emerald-500/50 ring-1 ring-emerald-500/30'
          : 'border-zinc-800'
      }`}
    >
      {/* Animated Top Accent Glow Line on Copy */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="absolute top-0 left-0 right-0 h-0.5 bg-emerald-400 origin-left z-20"
          />
        )}
      </AnimatePresence>

      {/* Top Bar */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
            <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          </div>
          {title && (
            <span className="font-mono text-zinc-400 text-[11px] ml-2 font-medium">
              {title}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="uppercase text-[10px] tracking-wider text-zinc-500 font-mono">
            {language}
          </span>
          <motion.button
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={handleCopy}
            id="btn-copy-code"
            className={`relative inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-medium transition-all duration-200 cursor-pointer overflow-hidden ${
              copied
                ? 'border-emerald-500/60 bg-emerald-500/15 text-emerald-300'
                : 'border-zinc-700 bg-zinc-800/90 text-zinc-200 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="copied-state"
                  initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                  animate={{ scale: 1, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0.5, opacity: 0, rotate: 20 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-400 stroke-[2.5]" />
                  <span className="text-emerald-300 font-semibold">¡Copiado!</span>
                </motion.span>
              ) : (
                <motion.span
                  key="copy-state"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="inline-flex items-center gap-1.5"
                >
                  <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Copiar código</span>
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>

      {/* Floating in-block 'Copied!' toast alert */}
      <AnimatePresence>
        {copied && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 450, damping: 26 }}
            className="absolute top-11 right-4 z-20 pointer-events-none flex items-center gap-2.5 rounded-xl border border-emerald-500/40 bg-zinc-900/95 px-3.5 py-2 text-xs text-emerald-300 shadow-2xl backdrop-blur-md ring-1 ring-emerald-500/20"
          >
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 600, damping: 20, delay: 0.05 }}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
            >
              <Check className="h-3 w-3 stroke-[3]" />
            </motion.span>
            <div className="flex flex-col">
              <span className="font-semibold text-emerald-300 leading-tight flex items-center gap-1">
                ¡Código copiado al portapapeles!
                <Sparkles className="h-3 w-3 text-emerald-400 inline" />
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {lines.length} {lines.length === 1 ? 'línea' : 'líneas'} listas para usar en tu proyecto
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Code Area */}
      <div className="overflow-x-auto p-4 max-h-[600px] text-xs font-mono leading-relaxed select-text">
        <table className="border-collapse w-full">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-zinc-900/40">
                <td className="w-10 select-none pr-4 text-right text-zinc-600 text-[11px] align-top font-mono">
                  {idx + 1}
                </td>
                <td className="text-zinc-200 whitespace-pre">
                  {colorizeLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Lightweight syntax colorizer for JSX/TSX keywords without bloated dependencies
function colorizeLine(line: string): React.ReactNode {
  if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
    return <span className="text-zinc-500 italic">{line}</span>;
  }
  if (line.includes('import ') || line.includes('export ') || line.includes('from ')) {
    return <span className="text-indigo-400">{line}</span>;
  }
  if (line.includes('interface ') || line.includes('type ')) {
    return <span className="text-sky-400">{line}</span>;
  }
  if (line.includes('return ') || line.includes('function ') || line.includes('const ')) {
    return <span className="text-violet-300">{line}</span>;
  }
  if (line.includes('<') && line.includes('>')) {
    return <span className="text-zinc-100">{line}</span>;
  }
  return line;
}
