import React, { useState, useEffect, useRef } from 'react';
import { Copy, Check, Star, Search, ChevronDown, ArrowRight } from 'lucide-react';
import { ACCENT_COLORS, AccentColor, CanvasBackground, UIComponent, ViewportMode, ComponentConfigSnapshot } from '../types';
import { PropValue, PropValues, readOneOf } from '../utils/propValues';

/** Tono de una variante, o `fallback` si no declara uno válido. */
const variantAccent = (props: PropValues | undefined, fallback: AccentColor): AccentColor =>
  readOneOf(props?.accentColor, ACCENT_COLORS, fallback);
import { InteractiveComponentRenderer } from './InteractiveComponentRenderer';
import { LocalHistoryControl } from './LocalHistoryControl';
import { InteractivePropEditor } from './InteractivePropEditor';

interface PlaygroundScreenProps {
  components: UIComponent[];
  selectedId: string;
  onSelectComponent: (id: string) => void;
  viewportMode: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  canvasBg: CanvasBackground;
  onToast: (msg: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  onViewInBiblioteca: (id: string) => void;
}

const accentColors: AccentColor[] = ['indigo', 'emerald', 'violet', 'amber', 'rose', 'cyan', 'zinc'];

const TONE_NAMES: Record<AccentColor, string> = {
  indigo: 'Índigo',
  emerald: 'Esmeralda',
  violet: 'Violeta',
  amber: 'Ámbar',
  rose: 'Rosa',
  cyan: 'Cian',
  zinc: 'Zinc',
};

const VIEWPORTS: ReadonlyArray<readonly [ViewportMode, string]> = [
  ['responsive', 'Adaptable'],
  ['desktop', 'Escritorio'],
  ['tablet', 'Tablet'],
  ['mobile', 'Móvil'],
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

/** Selector liviano: buscar y saltar a otra pieza sin salir del Playground ni volver a Biblioteca. */
function ComponentSwitcher({
  components,
  selectedId,
  onSelectComponent,
}: {
  components: UIComponent[];
  selectedId: string;
  onSelectComponent: (id: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const selected = components.find((c) => c.id === selectedId);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = components.filter((c) =>
    c.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div ref={wrapperRef} className="relative">
      <h1 className="font-display text-[32px] leading-[40px] sm:text-[40px] sm:leading-[46px]">
        <button
          type="button"
          id="playground-switcher-btn"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          title="Cambiar de pieza"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl text-zinc-900 dark:text-zinc-50 hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer"
        >
          {selected?.name || 'Elige una pieza'}
          <ChevronDown className="h-6 w-6 text-zinc-600 dark:text-zinc-300" />
        </button>
      </h1>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg">
          <div className="relative border-b border-zinc-200 dark:border-zinc-800 p-2">
            <Search className="pointer-events-none absolute left-5 top-5 h-4 w-4 text-zinc-600 dark:text-zinc-300" />
            <input
              autoFocus
              type="text"
              aria-label="Buscar pieza"
              placeholder="Buscar pieza…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 pl-9 pr-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500"
            />
          </div>
          <div className="max-h-72 overflow-y-auto p-1">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">Sin resultados</p>
            ) : (
              results.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onSelectComponent(c.id);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                    c.id === selectedId
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="font-mono truncate">{c.name}</span>
                  <span className="text-[10px] text-zinc-400 shrink-0 ml-2">{c.category}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PlaygroundScreen({
  components,
  selectedId,
  onSelectComponent,
  viewportMode,
  onViewportChange,
  canvasBg: _canvasBg,
  onToast,
  isFavorite = false,
  onToggleFavorite,
  onViewInBiblioteca,
}: PlaygroundScreenProps) {
  const component = components.find((c) => c.id === selectedId) || components[0];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(component.variants[0]?.id || 'default');
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [copiedVariant, setCopiedVariant] = useState(false);
  const [propOverrides, setPropOverrides] = useState<PropValues>({});

  const [history, setHistory] = useState<ComponentConfigSnapshot[]>(() => [
    {
      id: `${component.id}-init`,
      timestamp: Date.now(),
      actionLabel: `Carga inicial de ${component.name}`,
      selectedVariantId: component.variants[0]?.id || 'default',
      accentColor: variantAccent(component.variants[0]?.props, 'indigo'),
      propOverrides: {},
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  useEffect(() => {
    const initialVariant = component.variants[0]?.id || 'default';
    const initialColor = variantAccent(component.variants[0]?.props, 'indigo');
    setSelectedVariantId(initialVariant);
    setAccentColor(initialColor);
    setPropOverrides({});
    setHistory([
      {
        id: `${component.id}-init-${Date.now()}`,
        timestamp: Date.now(),
        actionLabel: `Carga inicial de ${component.name}`,
        selectedVariantId: initialVariant,
        accentColor: initialColor,
        propOverrides: {},
      },
    ]);
    setHistoryIndex(0);
  }, [component.id]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const pushSnapshot = (
    newConfig: { selectedVariantId: string; accentColor: AccentColor; propOverrides: PropValues },
    actionLabel: string,
  ) => {
    const newSnapshot: ComponentConfigSnapshot = {
      id: `${component.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      actionLabel,
      ...newConfig,
    };
    setHistory((prev) => {
      const newStack = [...prev.slice(0, historyIndex + 1), newSnapshot];
      return newStack.length > 60 ? newStack.slice(newStack.length - 60) : newStack;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const applySnapshot = (target: ComponentConfigSnapshot) => {
    setSelectedVariantId(target.selectedVariantId);
    setAccentColor(target.accentColor);
    setPropOverrides(target.propOverrides || {});
  };

  const handleUndo = () => {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    const target = history[nextIndex];
    if (!target) return;
    setHistoryIndex(nextIndex);
    applySnapshot(target);
    onToast(`Deshacer: ${history[historyIndex].actionLabel}`);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    const target = history[nextIndex];
    if (!target) return;
    setHistoryIndex(nextIndex);
    applySnapshot(target);
    onToast(`Rehacer: ${target.actionLabel}`);
  };

  const handleJumpTo = (index: number) => {
    if (index < 0 || index >= history.length) return;
    const target = history[index];
    if (!target) return;
    setHistoryIndex(index);
    applySnapshot(target);
    onToast(`Saltado a: ${target.actionLabel}`);
  };

  const handleResetToInitial = () => {
    const initial = history[0];
    if (!initial) return;
    const resetConfig = { selectedVariantId: initial.selectedVariantId, accentColor: initial.accentColor, propOverrides: {} };
    applySnapshot({ ...initial, propOverrides: {} });
    pushSnapshot(resetConfig, 'Restablecido a valores iniciales');
    onToast('Configuración restablecida a valores iniciales');
  };

  const handleClearHistory = () => {
    const current = history[historyIndex] || {
      id: `${component.id}-current`,
      timestamp: Date.now(),
      actionLabel: 'Estado actual guardado',
      selectedVariantId,
      accentColor,
      propOverrides,
    };
    setHistory([current]);
    setHistoryIndex(0);
    onToast('Historial local reiniciado');
  };

  const handleSelectVariant = (variantId: string) => {
    if (variantId === selectedVariantId) return;
    const v = component.variants.find((item) => item.id === variantId);
    const nextColor = variantAccent(v?.props, accentColor);
    setSelectedVariantId(variantId);
    setAccentColor(nextColor);
    pushSnapshot({ selectedVariantId: variantId, accentColor: nextColor, propOverrides }, `Variante: ${v?.name || variantId}`);
  };

  const handleSelectAccentColor = (col: AccentColor) => {
    if (col === accentColor) return;
    setAccentColor(col);
    pushSnapshot({ selectedVariantId, accentColor: col, propOverrides }, `Tono: ${col}`);
  };

  const handlePropChange = (propName: string, value: PropValue, actionLabel: string) => {
    const updatedOverrides = { ...propOverrides, [propName]: value };
    setPropOverrides(updatedOverrides);
    pushSnapshot({ selectedVariantId, accentColor, propOverrides: updatedOverrides }, actionLabel);
  };

  const handleResetProps = () => {
    setPropOverrides({});
    pushSnapshot({ selectedVariantId, accentColor, propOverrides: {} }, 'Props restablecidas a valores base');
    onToast('Props restablecidas a los valores de la variante');
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        if ((e.shiftKey && (e.key === 'z' || e.key === 'Z')) || e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          if (canRedo) handleRedo();
          return;
        }
        if (!e.shiftKey && (e.key === 'z' || e.key === 'Z') && !isTyping) {
          e.preventDefault();
          if (canUndo) handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, historyIndex, history]);

  const activeVariant = component.variants.find((v) => v.id === selectedVariantId) || component.variants[0];

  const viewportWidthClass = {
    responsive: 'w-full',
    desktop: 'max-w-[1024px] w-full',
    tablet: 'max-w-[768px] w-full',
    mobile: 'max-w-[375px] w-full',
  }[viewportMode];

  const handleCopyVariantSnippet = async () => {
    if (!activeVariant?.codeSnippet) return;
    try {
      await navigator.clipboard.writeText(activeVariant.codeSnippet);
      setCopiedVariant(true);
      onToast('Snippet de la variante copiado');
      setTimeout(() => setCopiedVariant(false), 2000);
    } catch {
      onToast('No se pudo copiar al portapapeles');
    }
  };

  const props = { ...(activeVariant?.props || {}), ...propOverrides };

  const overrideCount = Object.keys(propOverrides).length;
  const segmentBtn = (active: boolean) =>
    `min-h-9 rounded-lg px-3.5 text-sm transition-colors cursor-pointer ${
      active
        ? 'bg-white dark:bg-zinc-900 font-semibold text-zinc-900 dark:text-zinc-50 shadow-[var(--app-shadow-card)]'
        : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
    }`;

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 lg:flex-row lg:overflow-hidden">
      {/* Mesa de trabajo */}
      <section className="flex min-w-0 flex-1 flex-col gap-6 px-4 pb-12 pt-8 sm:px-8 lg:overflow-y-auto lg:px-12">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ComponentSwitcher components={components} selectedId={selectedId} onSelectComponent={onSelectComponent} />
            <span className="font-mono text-sm text-zinc-600 dark:text-zinc-300">v{component.version || '1.0.0'}</span>
            {onToggleFavorite && (
              <button
                type="button"
                id="playground-btn-favorite"
                onClick={() => onToggleFavorite(component.id)}
                aria-pressed={isFavorite}
                aria-label={isFavorite ? 'Quitar de favoritas' : 'Añadir a favoritas'}
                className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Star
                  className={`h-5 w-5 ${isFavorite ? 'fill-amber-400 text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400'}`}
                />
              </button>
            )}
            <button
              type="button"
              id="playground-view-in-biblioteca"
              onClick={() => onViewInBiblioteca(component.id)}
              title="Ver props, código, tokens y versiones en Biblioteca"
              className="inline-flex items-center gap-1.5 text-base text-indigo-700 dark:text-indigo-400 underline-offset-2 hover:underline cursor-pointer"
            >
              Ver ficha
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div role="group" aria-label="Tamaño de vista" className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
              {VIEWPORTS.map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  aria-pressed={viewportMode === mode}
                  onClick={() => onViewportChange(mode)}
                  className={segmentBtn(viewportMode === mode)}
                >
                  {label}
                </button>
              ))}
            </div>
            <LocalHistoryControl
              history={history}
              currentIndex={historyIndex}
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onJumpTo={handleJumpTo}
              onResetToInitial={handleResetToInitial}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>

        <div
          id="live-preview-canvas"
          className="flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black bg-[radial-gradient(var(--color-zinc-200)_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(var(--color-zinc-800)_1.2px,transparent_1.2px)] [background-size:20px_20px] p-8"
        >
          <div className={`mx-auto transition-all duration-300 ${viewportWidthClass}`}>
            <InteractiveComponentRenderer
              component={component}
              activeVariantProps={activeVariant?.props || {}}
              propOverrides={propOverrides}
              accentColor={readOneOf(props.accentColor, ACCENT_COLORS, accentColor)}
              onToast={onToast}
              onPropChange={(name, val) => handlePropChange(name, val, `Prop en vivo: ${name}`)}
            />
          </div>
        </div>

        {activeVariant?.codeSnippet && (
          <div className="flex items-start gap-4 rounded-xl bg-zinc-900 dark:bg-black px-5 py-4 text-zinc-50">
            <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-sm leading-6">{activeVariant.codeSnippet}</pre>
            <button
              type="button"
              onClick={handleCopyVariantSnippet}
              className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-zinc-400 px-3.5 text-sm text-zinc-50 hover:bg-white/10 cursor-pointer"
            >
              {copiedVariant ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedVariant ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        )}
      </section>

      {/* Panel de ajustes */}
      <aside className="flex w-full shrink-0 flex-col gap-8 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-8 sm:px-8 lg:w-[380px] lg:overflow-y-auto lg:border-l lg:border-t-0">
        <div className="flex flex-col gap-1">
          <span className="mono-label text-xs text-violet-600 dark:text-violet-400">Props</span>
          <h2 className="font-display text-[22px] leading-7">Ajusta la pieza</h2>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold">Variante</span>
          <div role="group" aria-label="Variante" className="flex flex-col gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
            {component.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={v.id === selectedVariantId}
                onClick={() => handleSelectVariant(v.id)}
                className={`${segmentBtn(v.id === selectedVariantId)} text-left`}
              >
                {v.name}
              </button>
            ))}
          </div>
          {activeVariant?.description && (
            <p className="text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">{activeVariant.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-base font-semibold">Tono</span>
          <div role="group" aria-label="Tono" className="piece-scope flex flex-wrap gap-2">
            {accentColors.map((col) => (
              <button
                key={col}
                type="button"
                onClick={() => handleSelectAccentColor(col)}
                aria-label={TONE_NAMES[col]}
                aria-pressed={accentColor === col}
                title={TONE_NAMES[col]}
                className={`h-9 w-9 rounded-full border-[3px] cursor-pointer ${colorDotBg[col]} ${
                  accentColor === col
                    ? 'border-[#fffdf8] dark:border-[#2a211a] ring-2 ring-[#1d5f80] dark:ring-[#7fb8da]'
                    : 'border-transparent'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-zinc-600 dark:text-zinc-300">{TONE_NAMES[accentColor]}</span>
        </div>

        <div className="flex flex-col gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
          <span className="text-base font-semibold">
            Props en vivo{overrideCount > 0 && <span className="font-normal text-zinc-600 dark:text-zinc-300"> · {overrideCount} cambiada{overrideCount === 1 ? '' : 's'}</span>}
          </span>
          <InteractivePropEditor
            component={component}
            activeVariantProps={activeVariant?.props || {}}
            propOverrides={propOverrides}
            onPropChange={handlePropChange}
            onResetProps={handleResetProps}
          />
        </div>
      </aside>
    </main>
  );
}
