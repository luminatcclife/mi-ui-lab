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

/** Pestaña "Código React TSX" del Inspector: el componente generado y sus dependencias pendientes. */
export function InspectorTsxTab({ generatedTsxCode, missingDependencies, copiedKey, copyToClipboard, isSavingDrawerOpen, setIsSavingDrawerOpen }: InspectorTsxTabProps) {
  return (
    <div className="flex-1 flex flex-col p-5 overflow-y-auto gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-zinc-200">
            Componente React (TypeScript / TSX)
          </h3>
          <p className="text-2xs text-zinc-400">
            Transformación limpia y lista para integrar en cualquier proyecto Vite/Next.js
          </p>
        </div>
        <button
          type="button"
          onClick={() => copyToClipboard(generatedTsxCode, 'tsx-code')}
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-medium transition-colors shadow-xs cursor-pointer"
        >
          {copiedKey === 'tsx-code' ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          <span>Copiar Código TSX</span>
        </button>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 font-mono text-xs text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre">
        {generatedTsxCode}
      </div>
    </div>
  );
}
