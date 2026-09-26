import React, { useState, useMemo } from 'react';
import { ArrowLeftRight } from 'lucide-react';
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

  const selectClass =
    'h-11 w-full rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 text-base text-zinc-900 dark:text-zinc-50 cursor-pointer';
  const tabs = [
    { key: 'preview-props' as const, id: 'tab-btn-compare-preview', label: 'Vista y props', meta: `${propDiffResult.stats.total}` },
    {
      key: 'code-diff' as const,
      id: 'tab-btn-compare-code',
      label: 'Código',
      meta: `+${lineDiffResult.stats.addedCount} / −${lineDiffResult.stats.removedCount}`,
    },
    { key: 'meta-matrix' as const, id: 'tab-btn-compare-meta', label: 'Tokens y metadatos', meta: '' },
  ];

  return (
    <section id="comparison-view-container" className="flex flex-col gap-8 text-zinc-900 dark:text-zinc-50">
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <span className="mono-label text-xs text-zinc-600 dark:text-zinc-300">Comparar</span>
          <h1 className="font-display text-[40px] leading-[46px]">
            {compA?.name} <span className="text-zinc-500 dark:text-zinc-400">y</span> {compB?.name}
          </h1>
        </div>

        <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <label className="flex flex-col gap-2">
            <span className="text-base font-semibold">Pieza A</span>
            <select
              id="select-component-a"
              value={compAId}
              onChange={(e) => {
                setCompAId(e.target.value);
                setVariantAId('');
              }}
              className={selectClass}
            >
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category} · v{c.version || '1.0.0'})
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            id="btn-swap-comparison-components"
            onClick={handleSwap}
            title="Intercambiar A y B"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <ArrowLeftRight className="h-4 w-4" />
            Intercambiar
          </button>

          <label className="flex flex-col gap-2">
            <span className="text-base font-semibold">Pieza B</span>
            <select
              id="select-component-b"
              value={compBId}
              onChange={(e) => {
                setCompBId(e.target.value);
                setVariantBId('');
              }}
              className={selectClass}
            >
              {components.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.category} · v{c.version || '1.0.0'})
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {presets.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm text-zinc-600 dark:text-zinc-300">Prueba con:</span>
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
                  className="rounded-full border border-zinc-500 dark:border-zinc-400 px-3 py-1 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Código <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{lineDiffResult.stats.similarityPercent}%</strong> igual · Props:{' '}
            {propDiffResult.stats.identical} comunes, <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{propDiffResult.stats.different} distintas</strong>
          </p>
        </div>
      </header>

      <div>
        <div role="tablist" aria-label="Qué comparar" className="flex gap-6 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map((t) => {
            const active = activeTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                id={t.id}
                aria-selected={active}
                onClick={() => setActiveTab(t.key)}
                className={`-mb-px inline-flex min-h-11 items-center gap-2 whitespace-nowrap border-b-2 text-base transition-colors cursor-pointer ${
                  active
                    ? 'border-indigo-600 dark:border-indigo-400 font-semibold text-zinc-900 dark:text-zinc-50'
                    : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                {t.label}
                {t.meta && <span className="font-mono text-sm font-normal text-zinc-600 dark:text-zinc-300">{t.meta}</span>}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-6 pt-8">
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
    </section>
  );
}
