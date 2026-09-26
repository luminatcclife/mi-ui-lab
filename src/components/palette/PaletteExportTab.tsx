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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setExportFormat('tailwind-v4')}
            className={`min-h-9 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors cursor-pointer ${
              exportFormat === 'tailwind-v4'
                ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Tailwind v4 (@theme)
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('tailwind-v3')}
            className={`min-h-9 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors cursor-pointer ${
              exportFormat === 'tailwind-v3'
                ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Tailwind v3 (config)
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('css-vars')}
            className={`min-h-9 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors cursor-pointer ${
              exportFormat === 'css-vars'
                ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            Variables CSS (:root)
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('ts-theme')}
            className={`min-h-9 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors cursor-pointer ${
              exportFormat === 'ts-theme'
                ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            TypeScript Theme Object
          </button>

          <button
            type="button"
            onClick={() => setExportFormat('classes')}
            className={`min-h-9 whitespace-nowrap rounded-full border px-3.5 text-sm transition-colors cursor-pointer ${
              exportFormat === 'classes'
                ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
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
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          {copiedKey === 'all-code' ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>{copiedKey === 'all-code' ? '¡Copiado!' : 'Copiar código'}</span>
        </button>
      </div>

      {/* Code display block */}
      <div className="relative overflow-x-auto rounded-xl bg-zinc-900 dark:bg-black p-5 font-mono text-sm text-zinc-50">
        <pre className="leading-relaxed whitespace-pre font-mono">
          {formattedCode}
        </pre>
      </div>
    </div>
  );
}
