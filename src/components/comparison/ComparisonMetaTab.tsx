import React from 'react';
import { Layers, Palette } from 'lucide-react';
import type { UIComponent } from '../../types';
import type { computeTokenDiff } from '../../utils/diffUtils';

export interface ComparisonMetaTabProps {
  compA: UIComponent;
  compB: UIComponent;
  tokensDiff: ReturnType<typeof computeTokenDiff>;
}

/** Pestaña "Tokens y Metadatos": tokens compartidos/exclusivos y matriz de metadatos. */
export function ComparisonMetaTab({ compA, compB, tokensDiff }: ComparisonMetaTabProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Tokens Comparison Card */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <Palette className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Tokens de Diseño Empleados
          </h3>
        </div>

        {/* Shared Tokens */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Tokens Compartidos por Ambos:
            </span>
            <span className="rounded-full bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
              {tokensDiff.shared.length}
            </span>
          </div>
          {tokensDiff.shared.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tokensDiff.shared.map((token) => (
                <span
                  key={token}
                  className="rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 text-[11px] font-mono font-medium text-indigo-600 dark:text-indigo-400"
                >
                  {token}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">
              No comparten tokens exactos de diseño.
            </p>
          )}
        </div>

        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Tokens Only A */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Tokens Exclusivos de {compA?.name}:
            </span>
            <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
              {tokensDiff.onlyA.length}
            </span>
          </div>
          {tokensDiff.onlyA.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tokensDiff.onlyA.map((token) => (
                <span
                  key={token}
                  className="rounded-md bg-zinc-100 dark:bg-zinc-800/80 px-2 py-0.5 text-[11px] font-mono text-zinc-700 dark:text-zinc-300"
                >
                  {token}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">Ninguno exclusivo.</p>
          )}
        </div>

        <div className="h-px bg-zinc-100 dark:bg-zinc-800" />

        {/* Tokens Only B */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              Tokens Exclusivos de {compB?.name}:
            </span>
            <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              {tokensDiff.onlyB.length}
            </span>
          </div>
          {tokensDiff.onlyB.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {tokensDiff.onlyB.map((token) => (
                <span
                  key={token}
                  className="rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400"
                >
                  {token}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">Ninguno exclusivo.</p>
          )}
        </div>
      </div>

      {/* Architecture & Metadatos Comparados */}
      <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <Layers className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            Arquitectura y Metadatos
          </h3>
        </div>

        <div className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs">
          {/* Categoría */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-zinc-500">Categoría:</span>
            <div className="flex items-center gap-2 font-mono">
              <span className="rounded bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 text-indigo-600 dark:text-indigo-400">
                {compA?.category}
              </span>
              <span className="text-zinc-400">vs</span>
              <span className="rounded bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 text-emerald-600 dark:text-emerald-400">
                {compB?.category}
              </span>
            </div>
          </div>

          {/* Versión */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-zinc-500">Versión:</span>
            <div className="flex items-center gap-2 font-mono">
              <span>v{compA?.version || '1.0.0'}</span>
              <span className="text-zinc-400">vs</span>
              <span>v{compB?.version || '1.0.0'}</span>
            </div>
          </div>

          {/* Variantes totales */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-zinc-500">Variantes disponibles:</span>
            <div className="flex items-center gap-2 font-mono">
              <span>{compA?.variants?.length || 0}</span>
              <span className="text-zinc-400">vs</span>
              <span>{compB?.variants?.length || 0}</span>
            </div>
          </div>

          {/* Líneas de código */}
          <div className="py-2.5 flex items-center justify-between">
            <span className="text-zinc-500">Líneas de código (TSX):</span>
            <div className="flex items-center gap-2 font-mono">
              <span>{compA?.sourceCode?.split('\n').length || 0}</span>
              <span className="text-zinc-400">vs</span>
              <span>{compB?.sourceCode?.split('\n').length || 0}</span>
            </div>
          </div>

          {/* Palabras clave (Tags) */}
          <div className="py-2.5 space-y-2">
            <span className="text-zinc-500">Palabras clave asociadas:</span>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-indigo-500">
                  {compA?.name}
                </span>
                <div className="flex flex-wrap gap-1">
                  {compA?.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-600 dark:text-zinc-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase text-emerald-500">
                  {compB?.name}
                </span>
                <div className="flex flex-wrap gap-1">
                  {compB?.tags?.map((t) => (
                    <span
                      key={t}
                      className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] text-zinc-600 dark:text-zinc-300"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
