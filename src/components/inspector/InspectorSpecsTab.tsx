import React from 'react';
import { Layers, Copy, Check, Sliders } from 'lucide-react';
import type { ElementTechSheet, TailwindCategorizedTokens } from '../../utils/elementInspector';

/** Grupos en los que se muestran las clases Tailwind de la ficha técnica. */
const TOKEN_CATEGORIES: Array<{
  key: keyof TailwindCategorizedTokens;
  label: string;
  badgeColor: string;
}> = [
  { key: 'colors', label: 'Colores & Superficie', badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
  { key: 'spacing', label: 'Espaciado & Medidas', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  { key: 'typography', label: 'Tipografía', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  { key: 'borders', label: 'Bordes & Radios', badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { key: 'layout', label: 'Layout & Flex/Grid', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { key: 'effects', label: 'Efectos & Sombras', badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  { key: 'interactive', label: 'Estados (hover/focus)', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { key: 'others', label: 'Otras clases', badgeColor: 'bg-zinc-700/40 text-zinc-300 border-zinc-600' },
];

export interface InspectorSpecsTabProps {
  techSheet: ElementTechSheet | null;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

/** Pestaña "Ficha Técnica & Tokens" del Inspector: clases categorizadas, estilos computados y estructura. */
export function InspectorSpecsTab({ techSheet, copiedKey, copyToClipboard }: InspectorSpecsTabProps) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-5 sm:p-6 gap-6">
      {techSheet ? (
        <>
          {/* Top Meta Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-zinc-800 border border-zinc-700 font-mono text-xs px-2.5 py-1 text-zinc-200 font-semibold">
                &lt;{techSheet.tagName}&gt;
              </span>
              {techSheet.id && (
                <span className="text-xs font-mono text-indigo-400">#{techSheet.id}</span>
              )}
              <span className="text-xs text-zinc-400">
                • {techSheet.totalClassesCount} clases Tailwind
              </span>
              <span className="text-xs text-zinc-500">• {techSheet.analyzedAt}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(JSON.stringify(techSheet, null, 2), 'json-sheet')
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'json-sheet' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>Copiar JSON</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  copyToClipboard(techSheet.rawClassNames.join(' '), 'all-classes')
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              >
                {copiedKey === 'all-classes' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>Copiar Clases</span>
              </button>
            </div>
          </div>

          {/* Section 1: Filtered Computed Styles */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                Estilos Computados en Pantalla (window.getComputedStyle)
              </h3>
              <span className="text-2xs text-zinc-500">Valores reales en runtime</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Color de Texto</span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0"
                    style={{ backgroundColor: techSheet.computedStyles.color }}
                  />
                  <span className="font-mono text-xs text-zinc-200 truncate">
                    {techSheet.computedStyles.color}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Fondo (Background)</span>
                <div className="flex items-center gap-2">
                  <span
                    className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0"
                    style={{ backgroundColor: techSheet.computedStyles.backgroundColor }}
                  />
                  <span className="font-mono text-xs text-zinc-200 truncate">
                    {techSheet.computedStyles.backgroundColor}
                  </span>
                </div>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Tipografía / Tamaño</span>
                <span className="font-mono text-xs text-zinc-200 truncate block">
                  {techSheet.computedStyles.fontSize} ({techSheet.computedStyles.fontWeight})
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Dimensiones Reales</span>
                <span className="font-mono text-xs text-zinc-200 block">
                  {techSheet.computedStyles.dimensions.width}px × {techSheet.computedStyles.dimensions.height}px
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Radio de Borde</span>
                <span className="font-mono text-xs text-zinc-200 truncate block">
                  {techSheet.computedStyles.borderRadius}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Relleno (Padding)</span>
                <span className="font-mono text-xs text-zinc-200 truncate block">
                  {techSheet.computedStyles.padding}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Fuente (Font Family)</span>
                <span className="font-mono text-xs text-zinc-200 truncate block">
                  {techSheet.computedStyles.fontFamily}
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                <span className="text-2xs text-zinc-400 block mb-1">Sombra (Box Shadow)</span>
                <span
                  className="font-mono text-xs text-zinc-200 truncate block"
                  title={techSheet.computedStyles.boxShadow}
                >
                  {techSheet.computedStyles.boxShadow.length > 25
                    ? techSheet.computedStyles.boxShadow.slice(0, 25) + '...'
                    : techSheet.computedStyles.boxShadow}
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Categorized Tailwind Tokens */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-indigo-400" />
                Tokens de Diseño Tailwind Clasificados
              </h3>
              <span className="text-2xs text-zinc-500">
                Haz clic en cualquier token para copiar
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {TOKEN_CATEGORIES.map((cat) => {
                const tokens = techSheet.tailwindTokens[cat.key];
                if (!tokens || tokens.length === 0) return null;
                return (
                  <div
                    key={cat.key}
                    className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-zinc-300">
                        {cat.label}
                      </span>
                      <span className="text-2xs text-zinc-500">
                        {tokens.length} {tokens.length === 1 ? 'clase' : 'clases'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {tokens.map((token, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => copyToClipboard(token, `token-${token}`)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${cat.badgeColor}`}
                          title="Clic para copiar token"
                        >
                          <span>{token}</span>
                          {copiedKey === `token-${token}` ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3 opacity-40 hover:opacity-100" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center text-zinc-500 text-xs">
          Ingresa código o analiza un elemento para visualizar su ficha técnica.
        </div>
      )}
    </div>
  );
}
