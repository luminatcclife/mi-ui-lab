import React from 'react';
import { Copy, Check } from 'lucide-react';
import type { ElementTechSheet, TailwindCategorizedTokens } from '../../utils/elementInspector';

/** Grupos en los que se muestran las clases Tailwind de la ficha técnica. */
const TOKEN_CATEGORIES: Array<{ key: keyof TailwindCategorizedTokens; label: string }> = [
  { key: 'colors', label: 'Color y superficie' },
  { key: 'spacing', label: 'Espaciado y medidas' },
  { key: 'typography', label: 'Tipografía' },
  { key: 'borders', label: 'Bordes y radios' },
  { key: 'layout', label: 'Layout (flex y grid)' },
  { key: 'effects', label: 'Efectos y sombras' },
  { key: 'interactive', label: 'Estados (hover, focus)' },
  { key: 'others', label: 'Otras clases' },
];

export interface InspectorSpecsTabProps {
  techSheet: ElementTechSheet | null;
  copiedKey: string | null;
  copyToClipboard: (text: string, key: string) => void;
}

const smallBtn =
  'inline-flex min-h-9 items-center gap-1.5 rounded-full border border-zinc-500 dark:border-zinc-400 px-3.5 text-sm text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer';

/** Pestaña "Ficha técnica" del Inspector: estilos calculados y clases agrupadas. */
export function InspectorSpecsTab({ techSheet, copiedKey, copyToClipboard }: InspectorSpecsTabProps) {
  if (!techSheet) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-400 dark:border-zinc-600 p-8 text-center text-base text-zinc-600 dark:text-zinc-300">
        Pega HTML y pulsa «Analizar y previsualizar» para ver su ficha técnica.
      </div>
    );
  }

  const { computedStyles: cs } = techSheet;
  const styles: Array<{ label: string; value: string; swatch?: string }> = [
    { label: 'Color de texto', value: cs.color, swatch: cs.color },
    { label: 'Fondo', value: cs.backgroundColor, swatch: cs.backgroundColor },
    { label: 'Tamaño y peso', value: `${cs.fontSize} (${cs.fontWeight})` },
    { label: 'Medidas', value: `${cs.dimensions.width}px × ${cs.dimensions.height}px` },
    { label: 'Radio', value: cs.borderRadius },
    { label: 'Relleno', value: cs.padding },
    { label: 'Fuente', value: cs.fontFamily },
    { label: 'Sombra', value: cs.boxShadow },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-base text-zinc-600 dark:text-zinc-300">
          <code className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">&lt;{techSheet.tagName}&gt;</code>
          {techSheet.id && <code className="font-mono"> #{techSheet.id}</code>} · {techSheet.totalClassesCount} clases · {techSheet.analyzedAt}
        </p>
        <div className="flex gap-2">
          <button type="button" onClick={() => copyToClipboard(JSON.stringify(techSheet, null, 2), 'json-sheet')} className={smallBtn}>
            {copiedKey === 'json-sheet' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar JSON
          </button>
          <button type="button" onClick={() => copyToClipboard(techSheet.rawClassNames.join(' '), 'all-classes')} className={smallBtn}>
            {copiedKey === 'all-classes' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copiar clases
          </button>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-[22px] leading-7">Estilos calculados</h3>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Valores reales en el navegador</span>
        </div>
        <dl className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {styles.map((s) => (
            <div key={s.label} className="flex min-w-0 flex-col gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
              <dt className="text-sm text-zinc-600 dark:text-zinc-300">{s.label}</dt>
              <dd className="flex min-w-0 items-center gap-2">
                {s.swatch && (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-zinc-500 dark:border-zinc-400" style={{ backgroundColor: s.swatch }} />
                )}
                <span className="truncate font-mono text-[13px]" title={s.value}>
                  {s.value}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="font-display text-[22px] leading-7">Clases por grupo</h3>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">Pulsa una clase para copiarla</span>
        </div>
        <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800">
          {TOKEN_CATEGORIES.map((cat) => {
            const tokens = techSheet.tailwindTokens[cat.key];
            if (!tokens || tokens.length === 0) return null;
            return (
              <div key={cat.key} className="flex flex-col gap-2 px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold">{cat.label}</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                    {tokens.length} {tokens.length === 1 ? 'clase' : 'clases'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {tokens.map((token, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => copyToClipboard(token, `token-${token}`)}
                      title="Copiar clase"
                      className="inline-flex items-center gap-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 px-3 py-1 font-mono text-[13px] text-zinc-900 dark:text-zinc-50 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                    >
                      {token}
                      {copiedKey === `token-${token}` && <Check className="h-3 w-3" />}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
