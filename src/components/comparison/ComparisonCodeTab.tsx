import { useState } from 'react';
import { Check, Copy, Columns2, Split } from 'lucide-react';
import type { UIComponent } from '../../types';
import type { LineDiffResult } from '../../utils/diffUtils';
import type { CodeDiffViewMode, CodeTarget } from './types';

export interface ComparisonCodeTabProps {
  compA: UIComponent;
  compB: UIComponent;
  codeTarget: CodeTarget;
  setCodeTarget: (target: CodeTarget) => void;
  codeTextA: string;
  codeTextB: string;
  lineDiffResult: LineDiffResult;
  onToast: (msg: string) => void;
}

/** Pestaña "Diferencias de Código TSX": diff lado a lado o unificado del código o del snippet de uso. */
export function ComparisonCodeTab({ compA, compB, codeTarget, setCodeTarget, codeTextA, codeTextB, lineDiffResult, onToast }: ComparisonCodeTabProps) {
  const [diffViewMode, setDiffViewMode] = useState<CodeDiffViewMode>('split');
  const [onlyDiffLines, setOnlyDiffLines] = useState<boolean>(false);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  return (
    <div className="space-y-4">
      {/* Toolbar: Source vs Usage, Split vs Unified, Copy */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Source vs Usage Snippet */}
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 p-0.5">
            <button
              type="button"
              onClick={() => setCodeTarget('source')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                codeTarget === 'source'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Código Fuente (.tsx)
            </button>
            <button
              type="button"
              onClick={() => setCodeTarget('usage')}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                codeTarget === 'usage'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              Snippet de Uso (JSX)
            </button>
          </div>

          {/* Split vs Unified Mode */}
          <div className="flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800/80 p-0.5">
            <button
              type="button"
              onClick={() => setDiffViewMode('split')}
              title="Vista dividida lado a lado"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                diffViewMode === 'split'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
              }`}
            >
              <Columns2 className="h-3.5 w-3.5" />
              <span>Dividida (Lado a Lado)</span>
            </button>
            <button
              type="button"
              onClick={() => setDiffViewMode('unified')}
              title="Vista unificada (estilo git diff)"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                diffViewMode === 'unified'
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800'
              }`}
            >
              <Split className="h-3.5 w-3.5" />
              <span>Unificada</span>
            </button>
          </div>

          {/* Only Diff Lines Toggle */}
          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 select-none cursor-pointer pl-2">
            <input
              type="checkbox"
              checked={onlyDiffLines}
              onChange={(e) => setOnlyDiffLines(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5"
            />
            <span>Solo líneas con diferencias</span>
          </label>
        </div>

        {/* Diff Stats & Actions */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md font-semibold">
            +{lineDiffResult.stats.addedCount} añadidos
          </span>
          <span className="text-[11px] font-mono text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md font-semibold">
            -{lineDiffResult.stats.removedCount} eliminados
          </span>
          <span className="text-[11px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            {lineDiffResult.stats.sameCount} comunes
          </span>
        </div>
      </div>

      {/* Split Side-by-Side Code View */}
      {diffViewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Code: Component A */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
            {/* Top Bar Left */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-indigo-600 text-white font-bold text-[9px]">
                  A
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {compA?.name}.tsx
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(codeTextA);
                  setCopiedA(true);
                  onToast(`Código de ${compA?.name} copiado`);
                  setTimeout(() => setCopiedA(false), 2000);
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {copiedA ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar A</span>
                  </>
                )}
              </button>
            </div>

            {/* Lines Left */}
            <div className="overflow-x-auto p-3 max-h-[580px] text-xs font-mono leading-relaxed select-text">
              <table className="border-collapse w-full">
                <tbody>
                  {lineDiffResult.sideBySide
                    .filter((pair) =>
                      onlyDiffLines ? pair.left.type !== 'same' || pair.right.type !== 'same' : true,
                    )
                    .map((pair, idx) => {
                      const line = pair.left;
                      const isRemoved = line.type === 'removed';
                      const isEmpty = line.type === 'empty';
                      return (
                        <tr
                          key={idx}
                          className={`${
                            isRemoved
                              ? 'bg-rose-950/40 text-rose-200 border-l-2 border-rose-500'
                              : isEmpty
                              ? 'bg-zinc-900/20 text-transparent select-none'
                              : 'hover:bg-zinc-900/40 text-zinc-300'
                          }`}
                        >
                          <td className="w-10 select-none pr-3 text-right text-zinc-600 text-[10px] align-top">
                            {line.lineNum ?? ''}
                          </td>
                          <td className="w-4 select-none text-center font-bold text-[10px] text-rose-400">
                            {isRemoved ? '-' : ''}
                          </td>
                          <td className="whitespace-pre overflow-x-hidden">
                            {line.text || (isEmpty ? ' ' : '')}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Code: Component B */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
            {/* Top Bar Right */}
            <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-4 w-4 items-center justify-center rounded bg-emerald-600 text-white font-bold text-[9px]">
                  B
                </span>
                <span className="font-mono text-zinc-200 font-semibold">
                  {compB?.name}.tsx
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(codeTextB);
                  setCopiedB(true);
                  onToast(`Código de ${compB?.name} copiado`);
                  setTimeout(() => setCopiedB(false), 2000);
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                {copiedB ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-400" />
                    <span className="text-emerald-400">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copiar B</span>
                  </>
                )}
              </button>
            </div>

            {/* Lines Right */}
            <div className="overflow-x-auto p-3 max-h-[580px] text-xs font-mono leading-relaxed select-text">
              <table className="border-collapse w-full">
                <tbody>
                  {lineDiffResult.sideBySide
                    .filter((pair) =>
                      onlyDiffLines ? pair.left.type !== 'same' || pair.right.type !== 'same' : true,
                    )
                    .map((pair, idx) => {
                      const line = pair.right;
                      const isAdded = line.type === 'added';
                      const isEmpty = line.type === 'empty';
                      return (
                        <tr
                          key={idx}
                          className={`${
                            isAdded
                              ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                              : isEmpty
                              ? 'bg-zinc-900/20 text-transparent select-none'
                              : 'hover:bg-zinc-900/40 text-zinc-300'
                          }`}
                        >
                          <td className="w-10 select-none pr-3 text-right text-zinc-600 text-[10px] align-top">
                            {line.lineNum ?? ''}
                          </td>
                          <td className="w-4 select-none text-center font-bold text-[10px] text-emerald-400">
                            {isAdded ? '+' : ''}
                          </td>
                          <td className="whitespace-pre overflow-x-hidden">
                            {line.text || (isEmpty ? ' ' : '')}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Unified Git-Style Diff */
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 overflow-hidden shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/80 px-4 py-2 text-xs">
            <span className="font-mono text-zinc-300 text-[11px]">
              diff unificado: a/{compA?.name}.tsx ⟷ b/{compB?.name}.tsx
            </span>
            <span className="text-[11px] font-mono text-zinc-500">
              {lineDiffResult.unified.length} líneas analizadas
            </span>
          </div>

          <div className="overflow-x-auto p-4 max-h-[600px] text-xs font-mono leading-relaxed select-text">
            <table className="border-collapse w-full">
              <tbody>
                {lineDiffResult.unified
                  .filter((line) => (onlyDiffLines ? line.type !== 'same' : true))
                  .map((line, idx) => (
                    <tr
                      key={idx}
                      className={`${
                        line.type === 'added'
                          ? 'bg-emerald-950/40 text-emerald-200 border-l-2 border-emerald-500'
                          : line.type === 'removed'
                          ? 'bg-rose-950/40 text-rose-200 border-l-2 border-rose-500'
                          : 'text-zinc-400 hover:bg-zinc-900/30'
                      }`}
                    >
                      <td className="w-10 select-none pr-2 text-right text-zinc-600 text-[10px]">
                        {line.lineNumA ?? ''}
                      </td>
                      <td className="w-10 select-none pr-2 text-right text-zinc-600 text-[10px]">
                        {line.lineNumB ?? ''}
                      </td>
                      <td className="w-4 select-none text-center font-bold text-[11px]">
                        {line.type === 'added'
                          ? '+'
                          : line.type === 'removed'
                          ? '-'
                          : ' '}
                      </td>
                      <td className="whitespace-pre">{line.text}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
