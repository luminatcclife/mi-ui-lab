import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Check,
  Copy,
  Layers,
  FileCode2,
  Sliders,
  Sparkles,
  Palette,
  Tag,
  GitCommit,
  Maximize2,
  Minimize2,
  Eye,
  Columns2,
  Split,
  Search,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { AccentColor, UIComponent, ViewportMode } from '../types';
import { InteractiveComponentRenderer } from './InteractiveComponentRenderer';
import {
  computeLineDiff,
  computePropDiff,
  computeTokenDiff,
  PropDiffStatus,
} from '../utils/diffUtils';

interface ComparisonViewProps {
  components: UIComponent[];
  initialComponentAId?: string;
  initialComponentBId?: string;
  onSelectComponentForPlayground?: (id: string) => void;
  onToast: (msg: string) => void;
}

type ComparisonTab = 'preview-props' | 'code-diff' | 'meta-matrix';
type CodeTarget = 'source' | 'usage';
type CodeDiffViewMode = 'split' | 'unified';

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

export function ComparisonView({
  components,
  initialComponentAId,
  initialComponentBId,
  onSelectComponentForPlayground,
  onToast,
}: ComparisonViewProps) {
  // Select initial components
  const [compAId, setCompAId] = useState<string>(() => {
    if (initialComponentAId && components.some((c) => c.id === initialComponentAId)) {
      return initialComponentAId;
    }
    return components[0]?.id || '';
  });

  const [compBId, setCompBId] = useState<string>(() => {
    if (initialComponentBId && components.some((c) => c.id === initialComponentBId)) {
      return initialComponentBId;
    }
    // Pick another component by default if available
    const other = components.find((c) => c.id !== (initialComponentAId || components[0]?.id));
    return other?.id || components[1]?.id || components[0]?.id || '';
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<ComparisonTab>('preview-props');

  // Variant selections for each side
  const [variantAId, setVariantAId] = useState<string>('');
  const [variantBId, setVariantBId] = useState<string>('');

  // Accent colors for each side
  const [accentColorA, setAccentColorA] = useState<AccentColor>('indigo');
  const [accentColorB, setAccentColorB] = useState<AccentColor>('emerald');

  // Prop filter state
  const [propFilterStatus, setPropFilterStatus] = useState<string>('all');
  const [propSearchQuery, setPropSearchQuery] = useState<string>('');

  // Code Diff controls
  const [codeTarget, setCodeTarget] = useState<CodeTarget>('source');
  const [diffViewMode, setDiffViewMode] = useState<CodeDiffViewMode>('split');
  const [onlyDiffLines, setOnlyDiffLines] = useState<boolean>(false);
  const [copiedA, setCopiedA] = useState(false);
  const [copiedB, setCopiedB] = useState(false);

  // Active components resolution
  const compA = useMemo(
    () => components.find((c) => c.id === compAId) || components[0],
    [components, compAId],
  );
  const compB = useMemo(
    () => components.find((c) => c.id === compBId) || components[1] || components[0],
    [components, compBId],
  );

  // Active variants
  const activeVariantA = useMemo(() => {
    if (!compA) return undefined;
    return compA.variants.find((v) => v.id === variantAId) || compA.variants[0];
  }, [compA, variantAId]);

  const activeVariantB = useMemo(() => {
    if (!compB) return undefined;
    return compB.variants.find((v) => v.id === variantBId) || compB.variants[0];
  }, [compB, variantBId]);

  // Swap components A and B
  const handleSwap = () => {
    const tempA = compAId;
    const tempB = compBId;
    setCompAId(tempB);
    setCompBId(tempA);
    setVariantAId('');
    setVariantBId('');
    onToast('Componentes intercambiados de lado');
  };

  // Code Diff computation
  const codeTextA = useMemo(() => {
    if (!compA) return '';
    return codeTarget === 'source'
      ? compA.sourceCode
      : activeVariantA?.codeSnippet || compA.usageSnippet;
  }, [compA, activeVariantA, codeTarget]);

  const codeTextB = useMemo(() => {
    if (!compB) return '';
    return codeTarget === 'source'
      ? compB.sourceCode
      : activeVariantB?.codeSnippet || compB.usageSnippet;
  }, [compB, activeVariantB, codeTarget]);

  const lineDiffResult = useMemo(() => {
    return computeLineDiff(codeTextA, codeTextB);
  }, [codeTextA, codeTextB]);

  // Props Diff computation
  const propDiffResult = useMemo(() => {
    if (!compA || !compB) {
      return {
        items: [],
        stats: { total: 0, identical: 0, different: 0, onlyA: 0, onlyB: 0 },
      };
    }
    return computePropDiff(
      compA.props,
      compB.props,
      activeVariantA?.props || {},
      activeVariantB?.props || {},
    );
  }, [compA, compB, activeVariantA, activeVariantB]);

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

  // Tokens Diff
  const tokensDiff = useMemo(() => {
    return computeTokenDiff(compA?.tokensUsed || [], compB?.tokensUsed || []);
  }, [compA, compB]);

  // Quick preset pairs
  const presets = [
    { label: 'Botón vs Interruptor', a: 'primary-button', b: 'toggle-switch' },
    { label: 'Tarjeta vs Callout', a: 'accent-card', b: 'notification-callout' },
    { label: 'AccentCard vs Stepper', a: 'accent-card', b: 'step-progress-card' },
    { label: 'Input vs Segmented', a: 'input-field', b: 'segmented-control' },
    { label: 'Badge vs Botón', a: 'status-badge', b: 'primary-button' },
  ].filter(
    (p) =>
      components.some((c) => c.id === p.a) && components.some((c) => c.id === p.b),
  );

  return (
    <div
      id="comparison-view-container"
      className="flex flex-1 flex-col overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
    >
      {/* Top Header & Component Selector Bar */}
      <div className="sticky top-0 z-20 border-b border-zinc-200 dark:border-zinc-800/90 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-4 py-3 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Row 1: Selectors and Swap button */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
            {/* Component A Selector */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                A
              </span>
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="select-component-a"
                  className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                >
                  Pieza Base (Izquierda)
                </label>
                <select
                  id="select-component-a"
                  value={compAId}
                  onChange={(e) => {
                    setCompAId(e.target.value);
                    setVariantAId('');
                  }}
                  className="w-full mt-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none cursor-pointer"
                >
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category} · v{c.version || '1.0.0'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Swap Button (⇄) */}
            <div className="flex items-center justify-center shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                id="btn-swap-comparison-components"
                onClick={handleSwap}
                title="Intercambiar pieza A y pieza B"
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 shadow-xs hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <ArrowLeftRight className="h-3.5 w-3.5" />
                <span className="text-[11px]">Intercambiar</span>
              </motion.button>
            </div>

            {/* Component B Selector */}
            <div className="flex-1 flex items-center gap-2 min-w-0">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                B
              </span>
              <div className="flex-1 min-w-0">
                <label
                  htmlFor="select-component-b"
                  className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                >
                  Pieza a Comparar (Derecha)
                </label>
                <select
                  id="select-component-b"
                  value={compBId}
                  onChange={(e) => {
                    setCompBId(e.target.value);
                    setVariantBId('');
                  }}
                  className="w-full mt-0.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/90 px-3 py-1.5 text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:border-emerald-500 focus:outline-none cursor-pointer"
                >
                  {components.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.category} · v{c.version || '1.0.0'})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Row 2: Preset suggestions and quick stats overview */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            {/* Quick Presets */}
            {presets.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="text-[11px] font-medium text-zinc-400">
                  Comparaciones sugeridas:
                </span>
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setCompAId(preset.a);
                      setCompBId(preset.b);
                      setVariantAId('');
                      setVariantBId('');
                      onToast(`Comparando ${preset.label}`);
                    }}
                    className="rounded-lg bg-zinc-100 dark:bg-zinc-800/70 hover:bg-zinc-200 dark:hover:bg-zinc-700/80 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Summary Pill Bar */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 px-2 py-0.5 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                <FileCode2 className="h-3 w-3" />
                <span>Similitud de código: {lineDiffResult.stats.similarityPercent}%</span>
              </span>

              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                <Sliders className="h-3 w-3 text-zinc-500" />
                <span>
                  Props: {propDiffResult.stats.identical} comunes ·{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {propDiffResult.stats.different} distintas
                  </strong>
                </span>
              </span>
            </div>
          </div>

          {/* Row 3: Tab Navigation */}
          <div className="flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 -mb-3 pt-1">
            <button
              type="button"
              id="tab-btn-compare-preview"
              onClick={() => setActiveTab('preview-props')}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'preview-props'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Renderizado y Propiedades</span>
              <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] font-normal">
                {propDiffResult.stats.total}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-compare-code"
              onClick={() => setActiveTab('code-diff')}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'code-diff'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <FileCode2 className="h-3.5 w-3.5" />
              <span>Diferencias de Código TSX</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 text-[10px] font-mono">
                +{lineDiffResult.stats.addedCount} / -{lineDiffResult.stats.removedCount}
              </span>
            </button>

            <button
              type="button"
              id="tab-btn-compare-meta"
              onClick={() => setActiveTab('meta-matrix')}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'meta-matrix'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Tokens y Metadatos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: RENDERED PREVIEW & PROPS DIFF TABLE */}
        {/* ======================================================== */}
        {activeTab === 'preview-props' && (
          <div className="space-y-6">
            {/* Side-by-side rendered components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Component A */}
              <div
                id="compare-pane-a"
                className="flex flex-col rounded-3xl border border-indigo-200 dark:border-indigo-900/40 bg-white dark:bg-zinc-900/60 shadow-lg overflow-hidden transition-all"
              >
                {/* Pane Header A */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-600 text-white font-bold text-[10px]">
                      A
                    </span>
                    <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                      {compA?.name}
                    </span>
                    <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
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
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    Variante:
                  </span>
                  {compA?.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantAId(v.id)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                        (activeVariantA?.id || compA.variants[0]?.id) === v.id
                          ? 'bg-indigo-600 text-white font-semibold shadow-xs'
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
                <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-white dark:bg-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
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
                className="flex flex-col rounded-3xl border border-emerald-200 dark:border-emerald-900/40 bg-white dark:bg-zinc-900/60 shadow-lg overflow-hidden transition-all"
              >
                {/* Pane Header B */}
                <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-emerald-50/50 dark:bg-emerald-950/20 px-4 py-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-600 text-white font-bold text-[10px]">
                      B
                    </span>
                    <span className="font-mono font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                      {compB?.name}
                    </span>
                    <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.2 text-[10px] font-mono text-zinc-600 dark:text-zinc-400">
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
                <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/40 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    Variante:
                  </span>
                  {compB?.variants.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariantBId(v.id)}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                        (activeVariantB?.id || compB.variants[0]?.id) === v.id
                          ? 'bg-emerald-600 text-white font-semibold shadow-xs'
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
                <div className="border-t border-zinc-200 dark:border-zinc-800 px-4 py-2 bg-white dark:bg-zinc-900 flex items-center justify-between text-[11px] text-zinc-500">
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
              className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-5 sm:p-6 shadow-xl"
            >
              {/* Header and filters */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-indigo-500" />
                    <span>Comparativa Detallada de Propiedades (Props)</span>
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Resalta diferencias en tipos, valores por defecto y valores en ejecución entre {compA?.name} y {compB?.name}.
                  </p>
                </div>

                {/* Filter and search */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar propiedad..."
                      value={propSearchQuery}
                      onChange={(e) => setPropSearchQuery(e.target.value)}
                      className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 pl-8 pr-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <select
                    value={propFilterStatus}
                    onChange={(e) => setPropFilterStatus(e.target.value)}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
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
                <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-950/80 text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
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
                                <span className="inline-block w-fit rounded bg-rose-500/10 border border-rose-500/30 px-1 py-0.2 text-[9px] text-rose-500 font-sans">
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
                                  <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono text-violet-600 dark:text-violet-300">
                                    {item.propA.type}
                                  </span>
                                  {item.propA.defaultValue && (
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      def: {item.propA.defaultValue}
                                    </span>
                                  )}
                                </div>
                                {item.renderedValueA !== undefined && (
                                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                    <span className="text-zinc-400 text-[10px]">Render: </span>
                                    <code className="font-semibold text-zinc-800 dark:text-zinc-200">
                                      {String(item.renderedValueA)}
                                    </code>
                                  </div>
                                )}
                                <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                                  {item.propA.description}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 italic">
                                No presente en {compA?.name}
                              </span>
                            )}
                          </td>

                          {/* Diff Status Badge */}
                          <td className="px-4 py-3 align-top text-center">
                            {item.status === 'identical' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                <span>Idéntica</span>
                              </span>
                            )}

                            {item.status === 'different' && (
                              <div className="inline-flex flex-col items-center gap-1">
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                                  <AlertCircle className="h-3 w-3" />
                                  <span>Diferente</span>
                                </span>
                                {item.differences.map((diff, i) => (
                                  <span
                                    key={i}
                                    className="text-[10px] text-amber-700 dark:text-amber-300 max-w-[140px] leading-tight"
                                  >
                                    {diff}
                                  </span>
                                ))}
                              </div>
                            )}

                            {item.status === 'only_a' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                                <MinusCircle className="h-3 w-3" />
                                <span>Solo en A</span>
                              </span>
                            )}

                            {item.status === 'only_b' && (
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
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
                                  <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                                    {item.propB.type}
                                  </span>
                                  {item.propB.defaultValue && (
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      def: {item.propB.defaultValue}
                                    </span>
                                  )}
                                </div>
                                {item.renderedValueB !== undefined && (
                                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">
                                    <span className="text-zinc-400 text-[10px]">Render: </span>
                                    <code className="font-semibold text-zinc-800 dark:text-zinc-200">
                                      {String(item.renderedValueB)}
                                    </code>
                                  </div>
                                )}
                                <p className="text-[11px] text-zinc-500 leading-snug line-clamp-2">
                                  {item.propB.description}
                                </p>
                              </div>
                            ) : (
                              <span className="text-xs text-zinc-400 italic">
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
                <div className="p-8 text-center text-xs text-zinc-400 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-2xl">
                  No se encontraron propiedades que coincidan con el filtro actual.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: CODE DIFF (SIDE-BY-SIDE / UNIFIED) */}
        {/* ======================================================== */}
        {activeTab === 'code-diff' && (
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
        )}

        {/* ======================================================== */}
        {/* TAB 3: TOKENS & METADATA MATRIX */}
        {/* ======================================================== */}
        {activeTab === 'meta-matrix' && (
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
        )}
      </div>
    </div>
  );
}
