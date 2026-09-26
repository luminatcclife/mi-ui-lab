import React from 'react';
import type { DetectedDependency } from '../../utils/dependencyDetector';
import { Copy, Check } from 'lucide-react';

export interface InspectorTsxTabProps {
  generatedTsxCode: string;
  missingDependencies: DetectedDependency[];
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
  isSavingDrawerOpen: boolean;
  setIsSavingDrawerOpen: (open: boolean) => void;
}

/** Pestaña "Código TSX" del Inspector: el componente generado, listo para copiar. */
export function InspectorTsxTab({ generatedTsxCode, copiedKey, copyToClipboard }: InspectorTsxTabProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-zinc-600 dark:text-zinc-300">Componente React listo para un proyecto con Vite o Next.js.</p>
        <button
          type="button"
          onClick={() => copyToClipboard(generatedTsxCode, 'tsx-code')}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
        >
          {copiedKey === 'tsx-code' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copiedKey === 'tsx-code' ? 'Copiado' : 'Copiar TSX'}
        </button>
      </div>

      <pre className="max-h-[520px] overflow-auto rounded-xl bg-zinc-900 dark:bg-black p-5 font-mono text-sm leading-6 text-zinc-50">
        {generatedTsxCode}
      </pre>
    </div>
  );
}
