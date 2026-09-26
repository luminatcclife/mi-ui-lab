import { useState, useMemo } from 'react';
import {
  Sliders,
  Search,
  AlertCircle,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { InteractiveComponentRenderer } from '../InteractiveComponentRenderer';
import type { AccentColor, ComponentVariant, UIComponent } from '../../types';
import type { PropDiffResult } from '../../utils/diffUtils';

/** Tonos disponibles en la vista previa de cada lado. */
const accentColors: AccentColor[] = [
  'indigo',
  'emerald',
  'violet',
  'amber',
  'rose',
  'cyan',
  'zinc',
];

const colorDotBg: Record<AccentColor, string> = {
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  violet: 'bg-violet-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  zinc: 'bg-zinc-500',
};

export interface ComparisonPreviewTabProps {
  compA: UIComponent;
  compB: UIComponent;
  activeVariantA: ComponentVariant | undefined;
  activeVariantB: ComponentVariant | undefined;
  setVariantAId: (id: string) => void;
  setVariantBId: (id: string) => void;
  propDiffResult: PropDiffResult;
  onToast: (msg: string) => void;
  onSelectComponentForPlayground?: (id: string) => void;
}

/** Pestaña "Renderizado y Propiedades": las dos piezas en vivo y la tabla de diferencias de props. */
export function ComparisonPreviewTab({ compA, compB, activeVariantA, activeVariantB, setVariantAId, setVariantBId, propDiffResult, onToast, onSelectComponentForPlayground }: ComparisonPreviewTabProps) {
  const [accentColorA, setAccentColorA] = useState<AccentColor>('indigo');
  const [accentColorB, setAccentColorB] = useState<AccentColor>('emerald');
  const [propFilterStatus, setPropFilterStatus] = useState<string>('all');
  const [propSearchQuery, setPropSearchQuery] = useState<string>('');

  // Filtered props list
  const filteredProps = useMemo(() => {
    return propDiffResult.items.filter((item) => {
      // Filter status
      if (propFilterStatus === 'diffs' && item.status === 'identical') return false;
      if (propFilterStatus === 'identical' && item.status !== 'identical') return false;
      if (propFilterStatus === 'only_a' && item.status !== 'only_a') return false;
      if (propFilterStatus === 'only_b' && item.status !== 'only_b') return false;

      // Filter search
      if (propSearchQuery) {
        const q = propSearchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesType =
          item.propA?.type.toLowerCase().includes(q) ||
          item.propB?.type.toLowerCase().includes(q);
        const matchesDiff = item.differences.some((d) =>
          d.toLowerCase().includes(q),
        );
        if (!matchesName && !matchesType && !matchesDiff) return false;
      }
      return true;
    });
  }, [propDiffResult, propFilterStatus, propSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Side-by-side rendered components */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Component A */}
        <div
          id="compare-pane-a"
          className="flex flex-col rounded-[20px] border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-zinc-900/60 overflow-hidden transition-all"
        >
          {/* Pane Header A */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-white font-semibold text-sm">
                A
              </span>
              <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {compA?.name}
              </span>
              <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                v{compA?.version || '1.0.0'}
              </span>
            </div>

            {/* Accent Color picker A */}
            <div className="flex items-center gap-1">
              {accentColors.slice(0, 5).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAccentColorA(col)}
                  title={`Tono ${col}`}
                  className={`h-4 w-4 rounded-full ${colorDotBg[col]} cursor-pointer transition-transform ${
                    accentColorA === col
                      ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 scale-115'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Variants selector A */}
          <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-sm uppercase font-semibold text-zinc-600 dark:text-zinc-400">
              Variante:
            </span>
            {compA?.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantAId(v.id)}
                className={`rounded-md px-2 py-0.5 text-[13px] font-medium transition-colors cursor-pointer ${
                  (activeVariantA?.id || compA.variants[0]?.id) === v.id
                    ? 'bg-indigo-600 text-white font-semibold'
                    : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>

          {/* Live Canvas Stage A */}
          <div className="flex-1 min-h-[260px] p-6 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50/60 dark:bg-zinc-950">
            <InteractiveComponentRenderer
              component={compA}
              activeVariantProps={activeVariantA?.props || {}}
              accentColor={accentColorA}
              onToast={onToast}
              compact
            />
          </div>

          {/* Footer info A */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-white dark:bg-zinc-900 flex items-center justify-between text-[13px] text-zinc-600 dark:text-zinc-400">
            <span>{compA?.props?.length || 0} props documentadas</span>
            {onSelectComponentForPlayground && (
              <button
                type="button"
                onClick={() => onSelectComponentForPlayground(compA.id)}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Abrir en Playground →
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Component B */}
        <div
          id="compare-pane-b"
          className="flex flex-col rounded-[20px] border border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-zinc-900/60 overflow-hidden transition-all"
        >
          {/* Pane Header B */}
          <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white font-semibold text-sm">
                B
              </span>
              <span className="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                {compB?.name}
              </span>
              <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 text-sm font-mono text-zinc-600 dark:text-zinc-400">
                v{compB?.version || '1.0.0'}
              </span>
            </div>

            {/* Accent Color picker B */}
            <div className="flex items-center gap-1">
              {accentColors.slice(0, 5).map((col) => (
                <button
                  key={col}
                  type="button"
                  onClick={() => setAccentColorB(col)}
                  title={`Tono ${col}`}
                  className={`h-4 w-4 rounded-full ${colorDotBg[col]} cursor-pointer transition-transform ${
                    accentColorB === col
                      ? 'ring-2 ring-emerald-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 scale-115'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Variants selector B */}
          <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-sm uppercase font-semibold text-zinc-600 dark:text-zinc-400">
              Variante:
            </span>
            {compB?.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => setVariantBId(v.id)}
                className={`rounded-md px-2 py-0.5 text-[13px] font-medium transition-colors cursor-pointer ${
                  (activeVariantB?.id || compB.variants[0]?.id) === v.id
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>

          {/* Live Canvas Stage B */}
          <div className="flex-1 min-h-[260px] p-6 flex items-center justify-center bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50/60 dark:bg-zinc-950">
            <InteractiveComponentRenderer
              component={compB}
              activeVariantProps={activeVariantB?.props || {}}
              accentColor={accentColorB}
              onToast={onToast}
              compact
            />
          </div>

          {/* Footer info B */}
          <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-white dark:bg-zinc-900 flex items-center justify-between text-[13px] text-zinc-600 dark:text-zinc-400">
            <span>{compB?.props?.length || 0} props documentadas</span>
            {onSelectComponentForPlayground && (
              <button
                type="button"
                onClick={() => onSelectComponentForPlayground(compB.id)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium cursor-pointer"
              >
                Abrir en Playground →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Properties Diff Section */}
      <div
        id="props-diff-section"
        className="rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6"
      >
        {/* Header and filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="font-display text-[22px] leading-7 text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <span>Props, una a una</span>
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
              Resalta diferencias en tipos, valores por defecto y valores en ejecución entre {compA?.name} y {compB?.name}.
            </p>
          </div>

          {/* Filter and search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-600 dark:text-zinc-400" />
              <input
                type="text"
                placeholder="Buscar propiedad..."
                value={propSearchQuery}
                onChange={(e) => setPropSearchQuery(e.target.value)}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-8 pr-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={propFilterStatus}
              onChange={(e) => setPropFilterStatus(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
            >
              <option value="all">Todas ({propDiffResult.stats.total})</option>
              <option value="diffs">
                Solo diferencias ({propDiffResult.stats.different + propDiffResult.stats.onlyA + propDiffResult.stats.onlyB})
              </option>
              <option value="identical">Solo idénticas ({propDiffResult.stats.identical})</option>
              <option value="only_a">Solo en A ({propDiffResult.stats.onlyA})</option>
              <option value="only_b">Solo en B ({propDiffResult.stats.onlyB})</option>
            </select>
          </div>
        </div>

        {/* Props Diff Table */}
        {filteredProps.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 text-zinc-500 dark:text-zinc-400 font-mono text-[13px]">
                  <th className="px-4 py-3 font-semibold">Propiedad</th>
                  <th className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                    {compA?.name} (A)
                  </th>
                  <th className="px-4 py-3 font-semibold text-center">Estado Diff</th>
                  <th className="px-4 py-3 font-semibold text-emerald-600 dark:text-emerald-400">
                    {compB?.name} (B)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80">
                {filteredProps.map((item) => (
                  <tr
                    key={item.name}
                    className={`transition-colors ${
                      item.status === 'different'
                        ? 'bg-amber-500/5 hover:bg-amber-500/10'
                        : item.status === 'only_a'
                        ? 'bg-indigo-500/5 hover:bg-indigo-500/10'
                        : item.status === 'only_b'
                        ? 'bg-emerald-500/5 hover:bg-emerald-500/10'
                        : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Prop Name */}
                    <td className="px-4 py-3 align-top font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                      <div className="flex flex-col gap-1">
                        <span className="text-indigo-600 dark:text-indigo-400">
                          {item.name}
                        </span>
                        {(item.propA?.required || item.propB?.required) && (
                          <span className="inline-block w-fit rounded bg-rose-500/10 border border-rose-500/30 px-1 py-0.2 text-sm text-rose-500 font-sans">
                            {item.propA?.required && item.propB?.required
                              ? 'Requerido en ambos'
                              : item.propA?.required
                              ? 'Requerido en A'
                              : 'Requerido en B'}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Component A Value & Type */}
                    <td className="px-4 py-3 align-top">
                      {item.propA ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[13px] font-mono text-violet-600 dark:text-violet-300">
                              {item.propA.type}
                            </span>
                            {item.propA.defaultValue && (
                              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                                def: {item.propA.defaultValue}
                              </span>
                            )}
                          </div>
                          {item.renderedValueA !== undefined && (
                            <div className="text-[13px] text-zinc-600 dark:text-zinc-400">
                              <span className="text-zinc-600 dark:text-zinc-400 text-sm">Render: </span>
                              <code className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {String(item.renderedValueA)}
                              </code>
                            </div>
                          )}
                          <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug line-clamp-2">
                            {item.propA.description}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                          No presente en {compA?.name}
                        </span>
                      )}
                    </td>

                    {/* Diff Status Badge */}
                    <td className="px-4 py-3 align-top text-center">
                      {item.status === 'identical' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-[13px] font-medium text-zinc-600 dark:text-zinc-400">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          <span>Idéntica</span>
                        </span>
                      )}

                      {item.status === 'different' && (
                        <div className="inline-flex flex-col items-center gap-1">
                          <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[13px] font-semibold text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" />
                            <span>Diferente</span>
                          </span>
                          {item.differences.map((diff, i) => (
                            <span
                              key={i}
                              className="text-sm text-amber-700 dark:text-amber-300 max-w-[140px] leading-tight"
                            >
                              {diff}
                            </span>
                          ))}
                        </div>
                      )}

                      {item.status === 'only_a' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 text-[13px] font-semibold text-indigo-600 dark:text-indigo-400">
                          <MinusCircle className="h-3 w-3" />
                          <span>Solo en A</span>
                        </span>
                      )}

                      {item.status === 'only_b' && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <PlusCircle className="h-3 w-3" />
                          <span>Solo en B</span>
                        </span>
                      )}
                    </td>

                    {/* Component B Value & Type */}
                    <td className="px-4 py-3 align-top">
                      {item.propB ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[13px] font-mono text-emerald-600 dark:text-emerald-400">
                              {item.propB.type}
                            </span>
                            {item.propB.defaultValue && (
                              <span className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                                def: {item.propB.defaultValue}
                              </span>
                            )}
                          </div>
                          {item.renderedValueB !== undefined && (
                            <div className="text-[13px] text-zinc-600 dark:text-zinc-400">
                              <span className="text-zinc-600 dark:text-zinc-400 text-sm">Render: </span>
                              <code className="font-semibold text-zinc-800 dark:text-zinc-200">
                                {String(item.renderedValueB)}
                              </code>
                            </div>
                          )}
                          <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-snug line-clamp-2">
                            {item.propB.description}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-600 dark:text-zinc-400 italic">
                          No presente en {compB?.name}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-zinc-600 dark:text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl">
            No se encontraron propiedades que coincidan con el filtro actual.
          </div>
        )}
      </div>
    </div>
  );
}
