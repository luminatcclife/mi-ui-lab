import React, { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Layers,
  FileCode2,
  Sliders,
  Eye,
} from 'lucide-react';
import { motion } from 'motion/react';
import { UIComponent } from '../types';
import { computeLineDiff, computePropDiff, computeTokenDiff } from '../utils/diffUtils';
import type { CodeTarget } from './comparison/types';
import { ComparisonPreviewTab } from './comparison/ComparisonPreviewTab';
import { ComparisonCodeTab } from './comparison/ComparisonCodeTab';
import { ComparisonMetaTab } from './comparison/ComparisonMetaTab';

interface ComparisonViewProps {
  components: UIComponent[];
  initialComponentAId?: string;
  initialComponentBId?: string;
  onSelectComponentForPlayground?: (id: string) => void;
  onToast: (msg: string) => void;
}

type ComparisonTab = 'preview-props' | 'code-diff' | 'meta-matrix';


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

  // Code Diff controls
  const [codeTarget, setCodeTarget] = useState<CodeTarget>('source');

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
          <ComparisonPreviewTab
              onToast={onToast}
              onSelectComponentForPlayground={onSelectComponentForPlayground}
            compA={compA}
            compB={compB}
            activeVariantA={activeVariantA}
            activeVariantB={activeVariantB}
            setVariantAId={setVariantAId}
            setVariantBId={setVariantBId}
            propDiffResult={propDiffResult}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 2: CODE DIFF (SIDE-BY-SIDE / UNIFIED) */}
        {/* ======================================================== */}
        {activeTab === 'code-diff' && (
          <ComparisonCodeTab
              onToast={onToast}
            compA={compA}
            compB={compB}
            codeTarget={codeTarget}
            setCodeTarget={setCodeTarget}
            codeTextA={codeTextA}
            codeTextB={codeTextB}
            lineDiffResult={lineDiffResult}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 3: TOKENS & METADATA MATRIX */}
        {/* ======================================================== */}
        {activeTab === 'meta-matrix' && (
          <ComparisonMetaTab
            compA={compA}
            compB={compB}
            tokensDiff={tokensDiff}
          />
        )}
      </div>
    </div>
  );
}
