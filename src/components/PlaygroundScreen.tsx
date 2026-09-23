import React, { useState, useEffect, useRef } from 'react';
import {
  Copy,
  Check,
  Star,
  Search,
  ChevronDown,
  Sliders,
  Maximize2,
  Monitor,
  Tablet,
  Smartphone,
  ArrowRight,
} from 'lucide-react';
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
      <button
        type="button"
        id="playground-switcher-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer shadow-xs"
      >
        <span className="font-mono">{selected?.name || 'Elegí una pieza'}</span>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-64 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden">
          <div className="relative border-b border-zinc-100 dark:border-zinc-800 p-2">
            <Search className="absolute left-4.5 top-4.5 h-3.5 w-3.5 text-zinc-400" />
            <input
              autoFocus
              type="text"
              placeholder="Buscar pieza..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full rounded-lg bg-zinc-50 dark:bg-zinc-800 pl-7 pr-2 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {results.length === 0 ? (
              <p className="px-3 py-2 text-xs text-zinc-400">Sin resultados</p>
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
  canvasBg,
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
  const [isPropEditorOpen, setIsPropEditorOpen] = useState(false);

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

  const canvasBgClass = {
    dots: 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100/70 dark:bg-zinc-950',
    grid: 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] [background-size:24px_24px] bg-slate-50 dark:bg-zinc-950',
    dark: 'bg-zinc-950 text-zinc-100',
    light: 'bg-white text-zinc-900',
  }[canvasBg];

  const handleCopyVariantSnippet = () => {
    if (activeVariant?.codeSnippet) {
      navigator.clipboard.writeText(activeVariant.codeSnippet);
      setCopiedVariant(true);
      onToast('¡Snippet de la variante copiado al portapapeles!');
      setTimeout(() => setCopiedVariant(false), 2000);
    }
  };

  const props = { ...(activeVariant?.props || {}), ...propOverrides };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Toolbar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <ComponentSwitcher components={components} selectedId={selectedId} onSelectComponent={onSelectComponent} />
          <span className="font-mono text-xs text-zinc-400">v{component.version || '1.0.0'}</span>

          {onToggleFavorite && (
            <button
              type="button"
              id="playground-btn-favorite"
              onClick={() => onToggleFavorite(component.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                isFavorite
                  ? 'border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-amber-500'
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Viewport size */}
          <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl">
            {(
              [
                ['responsive', Maximize2, 'Adaptable'],
                ['desktop', Monitor, 'Escritorio'],
                ['tablet', Tablet, 'Tablet'],
                ['mobile', Smartphone, 'Móvil'],
              ] as const
            ).map(([mode, Icon, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => onViewportChange(mode)}
                title={label}
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                  viewportMode === mode
                    ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </button>
            ))}
          </div>

          <button
            type="button"
            id="playground-view-in-biblioteca"
            onClick={() => onViewInBiblioteca(component.id)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-xs"
            title="Ver props, código, tokens y versiones en Biblioteca"
          >
            <span>Ver ficha en Biblioteca</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Workbench */}
      <div className="flex-1 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-2.5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
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
            <button
              type="button"
              id="btn-toggle-prop-editor"
              onClick={() => setIsPropEditorOpen(!isPropEditorOpen)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                isPropEditorOpen
                  ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : Object.keys(propOverrides).length > 0
                  ? 'border-indigo-300 dark:border-indigo-800 bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400'
                  : 'border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
              }`}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Ajustar Props (Live)</span>
              {Object.keys(propOverrides).length > 0 && (
                <span className="rounded-full bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2">
                  {Object.keys(propOverrides).length}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Tono:</span>
              <div className="flex items-center gap-1">
                {accentColors.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => handleSelectAccentColor(col)}
                    title={`Tono ${col}`}
                    className={`h-5 w-5 rounded-full ${colorDotBg[col]} transition-transform cursor-pointer ${
                      accentColor === col
                        ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-zinc-900 scale-110'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block" />
            <button
              type="button"
              onClick={handleCopyVariantSnippet}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {copiedVariant ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5 text-zinc-400" />}
              <span className="hidden sm:inline">Copiar JSX</span>
            </button>
          </div>
        </div>

        {isPropEditorOpen && (
          <InteractivePropEditor
            component={component}
            activeVariantProps={activeVariant?.props || {}}
            propOverrides={propOverrides}
            onPropChange={handlePropChange}
            onResetProps={handleResetProps}
          />
        )}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-3 shadow-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mr-1">
              Variantes:
            </span>
            {component.variants.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => handleSelectVariant(v.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none ${
                  v.id === selectedVariantId
                    ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {v.name}
              </button>
            ))}
          </div>
          {activeVariant?.description && (
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              <strong className="text-zinc-800 dark:text-zinc-200">{activeVariant.name}:</strong> {activeVariant.description}
            </div>
          )}
        </div>

        <div
          id="live-preview-canvas"
          className={`relative min-h-[380px] rounded-3xl border border-zinc-800 p-8 flex items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl ${canvasBgClass}`}
        >
          <div className={`transition-all duration-300 mx-auto ${viewportWidthClass}`}>
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
          <div className="relative rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3 overflow-hidden">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                Snippet para copiar y pegar en tu proyecto:
              </span>
              <button
                type="button"
                onClick={handleCopyVariantSnippet}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                {copiedVariant ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedVariant ? '¡Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <pre className="overflow-x-auto text-xs font-mono text-zinc-300 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
              {activeVariant.codeSnippet}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
