import React from 'react';
import { Copy, Check } from 'lucide-react';
import type { CopyHandler, ExportFormat } from './types';
import type { PaletteShade } from '../../utils/colorPaletteGenerator';

export interface PaletteExportTabProps {
  exportFormat: ExportFormat;
  setExportFormat: (format: ExportFormat) => void;
  formattedCode: string;
  primaryShade: PaletteShade;
  tokenPrefix: string;
  copiedKey: string | null;
  handleCopy: CopyHandler;
}

/** Pestaña "Exportar Tokens Tailwind": código listo para copiar en varios formatos. */
export function PaletteExportTab({ exportFormat, setExportFormat, formattedCode, primaryShade, tokenPrefix, copiedKey, handleCopy }: PaletteExportTabProps) {
  return (
    <div className="space-y-5">
      {/* Format selection buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExportFormat('tailwind-v4')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              exportFormat === 'tailwind-v4'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Tailwind v4 (@theme)
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('tailwind-v3')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              exportFormat === 'tailwind-v3'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Tailwind v3 (config)
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('css-vars')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              exportFormat === 'css-vars'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Variables CSS (:root)
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('ts-theme')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              exportFormat === 'ts-theme'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            TypeScript Theme Object
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('classes')}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
              exportFormat === 'classes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Cheat Sheet Clases
          </button>
        </div>

        {/* Copy full formatted code button */}
        <button
          type="button"
          id="btn-copy-all-tailwind-tokens"
          onClick={() =>
            handleCopy(
              formattedCode,
              'all-code',
              '¡Tokens de Tailwind copiados al portapapeles!',
            )
          }
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          {copiedKey === 'all-code' ? (
            <Check className="h-3.5 w-3.5 text-white" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copiedKey === 'all-code' ? '¡Copiado!' : 'Copiar Código'}</span>
        </button>
      </div>

      {/* Code display block */}
      <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-200 p-4 font-mono text-xs overflow-x-auto shadow-inner">
        <pre className="leading-relaxed whitespace-pre font-mono">
          {formattedCode}
        </pre>
      </div>
    </div>
  );
}
