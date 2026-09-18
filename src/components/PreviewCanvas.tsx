import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Layers,
  Code2,
  SlidersHorizontal,
  FileText,
  Palette,
  History,
  GitCommit,
  Clock,
  Star,
  Tag,
  Plus,
  X,
  Hash,
  ArrowLeftRight,
  LayoutGrid,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AccentColor,
  CanvasBackground,
  UIComponent,
  ViewportMode,
  ComponentConfigSnapshot,
} from '../types';
import { AccentCard } from './ui/AccentCard';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { InputField } from './ui/InputField';
import { SegmentedControl } from './ui/SegmentedControl';
import { NotificationCallout } from './ui/NotificationCallout';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { CodeViewer } from './CodeViewer';
import { PropsTable } from './PropsTable';
import { LocalHistoryControl } from './LocalHistoryControl';
import { InteractivePropEditor } from './InteractivePropEditor';
import { LiveComponentPreview } from './LiveComponentPreview';
import { Sliders } from 'lucide-react';

interface PreviewCanvasProps {
  component: UIComponent;
  viewportMode: ViewportMode;
  canvasBg: CanvasBackground;
  onToast: (msg: string) => void;
  onOpenIteration?: (comp: UIComponent) => void;
  onOpenCompare?: (componentId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  activeTags?: string[];
  onToggleTagFilter?: (tag: string) => void;
  onAddTagToComponent?: (componentId: string, newTag: string) => void;
  onRemoveTagFromComponent?: (componentId: string, tag: string) => void;
  onTogglePlaygroundLayout?: (layout: 'focus' | 'grid') => void;
  categoryComponentCount?: number;
  onOpenPaletteGenerator?: (primaryHex?: string) => void;
}

type CanvasTab = 'preview' | 'code' | 'props' | 'tokens' | 'versions';

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

const accentToHex: Record<AccentColor, string> = {
  indigo: '#6366f1',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#f43f5e',
  cyan: '#06b6d4',
  zinc: '#71717a',
};

export function PreviewCanvas({
  component,
  viewportMode,
  canvasBg,
  onToast,
  onOpenIteration,
  onOpenCompare,
  isFavorite = false,
  onToggleFavorite,
  activeTags = [],
  onToggleTagFilter,
  onAddTagToComponent,
  onRemoveTagFromComponent,
  onTogglePlaygroundLayout,
  categoryComponentCount,
  onOpenPaletteGenerator,
}: PreviewCanvasProps) {
  const [activeTab, setActiveTab] = useState<CanvasTab>('preview');
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    component.variants[0]?.id || 'default',
  );
  const [accentColor, setAccentColor] = useState<AccentColor>('indigo');
  const [codeType, setCodeType] = useState<'implementation' | 'usage'>('implementation');
  const [copiedVariant, setCopiedVariant] = useState(false);
  const [copiedTsx, setCopiedTsx] = useState(false);
  const [propOverrides, setPropOverrides] = useState<Record<string, any>>({});
  const [isPropEditorOpen, setIsPropEditorOpen] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  // Local History stack for property and configuration changes in this session
  const [history, setHistory] = useState<ComponentConfigSnapshot[]>(() => [
    {
      id: `${component.id}-init`,
      timestamp: Date.now(),
      actionLabel: `Carga inicial de ${component.name}`,
      selectedVariantId: component.variants[0]?.id || 'default',
      accentColor: component.variants[0]?.props?.accentColor || 'indigo',
      propOverrides: {},
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Sync state and initialize new history stack when component changes
  useEffect(() => {
    const initialVariant = component.variants[0]?.id || 'default';
    const initialColor =
      component.variants[0]?.props?.accentColor || 'indigo';

    setSelectedVariantId(initialVariant);
    setAccentColor(initialColor);
    setPropOverrides({});

    const initialSnapshot: ComponentConfigSnapshot = {
      id: `${component.id}-init-${Date.now()}`,
      timestamp: Date.now(),
      actionLabel: `Carga inicial de ${component.name}`,
      selectedVariantId: initialVariant,
      accentColor: initialColor,
      propOverrides: {},
    };

    setHistory([initialSnapshot]);
    setHistoryIndex(0);
  }, [component.id]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Push new snapshot to local history stack
  const pushSnapshot = (
    newConfig: {
      selectedVariantId: string;
      accentColor: AccentColor;
      propOverrides: Record<string, any>;
    },
    actionLabel: string,
  ) => {
    const newSnapshot: ComponentConfigSnapshot = {
      id: `${component.id}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      actionLabel,
      selectedVariantId: newConfig.selectedVariantId,
      accentColor: newConfig.accentColor,
      propOverrides: newConfig.propOverrides,
    };

    setHistory((prev) => {
      const newStack = [...prev.slice(0, historyIndex + 1), newSnapshot];
      // Keep up to 60 snapshots in memory
      if (newStack.length > 60) {
        return newStack.slice(newStack.length - 60);
      }
      return newStack;
    });
    setHistoryIndex((prev) => prev + 1);
  };

  const handleUndo = () => {
    if (!canUndo) return;
    const nextIndex = historyIndex - 1;
    const target = history[nextIndex];
    if (!target) return;

    setHistoryIndex(nextIndex);
    setSelectedVariantId(target.selectedVariantId);
    setAccentColor(target.accentColor);
    setPropOverrides(target.propOverrides || {});
    onToast(`Deshacer: ${history[historyIndex].actionLabel}`);
  };

  const handleRedo = () => {
    if (!canRedo) return;
    const nextIndex = historyIndex + 1;
    const target = history[nextIndex];
    if (!target) return;

    setHistoryIndex(nextIndex);
    setSelectedVariantId(target.selectedVariantId);
    setAccentColor(target.accentColor);
    setPropOverrides(target.propOverrides || {});
    onToast(`Rehacer: ${target.actionLabel}`);
  };

  const handleJumpTo = (index: number) => {
    if (index < 0 || index >= history.length) return;
    const target = history[index];
    if (!target) return;

    setHistoryIndex(index);
    setSelectedVariantId(target.selectedVariantId);
    setAccentColor(target.accentColor);
    setPropOverrides(target.propOverrides || {});
    onToast(`Saltado a: ${target.actionLabel}`);
  };

  const handleResetToInitial = () => {
    const initial = history[0];
    if (!initial) return;

    const resetConfig = {
      selectedVariantId: initial.selectedVariantId,
      accentColor: initial.accentColor,
      propOverrides: {},
    };

    setSelectedVariantId(resetConfig.selectedVariantId);
    setAccentColor(resetConfig.accentColor);
    setPropOverrides({});

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
    const nextColor = v?.props?.accentColor || accentColor;

    setSelectedVariantId(variantId);
    if (v?.props?.accentColor) {
      setAccentColor(nextColor);
    }

    pushSnapshot(
      {
        selectedVariantId: variantId,
        accentColor: nextColor,
        propOverrides,
      },
      `Variante: ${v?.name || variantId}`,
    );
  };

  const handleSelectAccentColor = (col: AccentColor) => {
    if (col === accentColor) return;
    setAccentColor(col);
    pushSnapshot(
      {
        selectedVariantId,
        accentColor: col,
        propOverrides,
      },
      `Tono: ${col}`,
    );
  };

  const handlePropChange = (propName: string, value: any, actionLabel: string) => {
    const updatedOverrides = {
      ...propOverrides,
      [propName]: value,
    };
    setPropOverrides(updatedOverrides);
    pushSnapshot(
      {
        selectedVariantId,
        accentColor,
        propOverrides: updatedOverrides,
      },
      actionLabel,
    );
  };

  const handleResetProps = () => {
    setPropOverrides({});
    pushSnapshot(
      {
        selectedVariantId,
        accentColor,
        propOverrides: {},
      },
      'Props restablecidas a valores base',
    );
    onToast('Props restablecidas a los valores de la variante');
  };

  // Keyboard shortcut listener for Undo (Cmd/Ctrl + Z) and Redo (Cmd/Ctrl + Shift + Z / Cmd/Ctrl + Y)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing into an input/textarea and just doing normal text undo
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && !e.altKey) {
        // Redo: Ctrl+Shift+Z or Ctrl+Y
        if (
          (e.shiftKey && (e.key === 'z' || e.key === 'Z')) ||
          e.key === 'y' ||
          e.key === 'Y'
        ) {
          e.preventDefault();
          if (canRedo) handleRedo();
          return;
        }

        // Undo: Ctrl+Z
        if (!e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
          if (!isTyping) {
            e.preventDefault();
            if (canUndo) handleUndo();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, historyIndex, history]);

  const activeVariant =
    component.variants.find((v) => v.id === selectedVariantId) ||
    component.variants[0];

  // Viewport width styling
  const viewportWidthClass = {
    responsive: 'w-full',
    desktop: 'max-w-[1024px] w-full',
    tablet: 'max-w-[768px] w-full',
    mobile: 'max-w-[375px] w-full',
  }[viewportMode];

  // Canvas background pattern
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

  // Render the interactive component live in the preview area
  const renderInteractiveComponent = () => {
    const props = { ...(activeVariant?.props || {}), ...propOverrides };
    const effectiveAccent = props.accentColor || accentColor;

    if (component.id === 'accent-card') {
      return (
        <div className="w-full max-w-md mx-auto">
          <AccentCard
            variant={props.variant || 'default'}
            accentColor={effectiveAccent}
            title={props.title || 'Título de Ejemplo'}
            subtitle={props.subtitle}
            badge={props.badge}
            metric={props.metric}
            trend={props.trend}
            actionLabel={props.actionLabel}
            onAction={() => onToast(`Acción en AccentCard (${effectiveAccent})`)}
          />
        </div>
      );
    }

    if (component.id === 'primary-button') {
      return (
        <div className="flex flex-wrap items-center justify-center gap-4 py-8">
          <Button
            variant={props.variant || 'primary'}
            loading={Boolean(props.loading)}
            disabled={Boolean(props.disabled)}
            onClick={() => onToast('Clic en botón!')}
          >
            {props.label || 'Botón de Acción'}
          </Button>
          <Button variant="secondary" onClick={() => onToast('Clic secundario')}>
            Secundario
          </Button>
          <Button variant="outline">Contorno</Button>
        </div>
      );
    }

    if (component.id === 'status-badge') {
      return (
        <div className="flex flex-wrap items-center justify-center gap-3 py-8">
          <StatusBadge
            status={props.status || 'success'}
            label={props.label || 'Operativo'}
            withDot={props.withDot ?? true}
          />
          <StatusBadge status="warning" label="En revisión" withDot />
          <StatusBadge status="danger" label="Error 503" withDot />
          <StatusBadge status="purple" label="Experimental" withDot />
          <StatusBadge status="info" label="v1.4.2" withDot={false} />
        </div>
      );
    }

    if (component.id === 'input-field') {
      return (
        <div className="w-full max-w-sm mx-auto space-y-4 py-6">
          <InputField
            label={props.label || 'Nombre de la Pieza'}
            placeholder={props.placeholder || 'Ej. CustomModal'}
            helperText={props.helperText}
            error={props.error}
            disabled={Boolean(props.disabled)}
          />
          <InputField
            label="Campo con valor"
            defaultValue="AccentCard con Glow"
            helperText="Tokens guardados localmente"
          />
        </div>
      );
    }

    if (component.id === 'segmented-control') {
      return (
        <div className="flex flex-col items-center justify-center gap-6 py-8">
          <SegmentedControl
            options={
              props.options || [
                { id: 'view1', label: 'General' },
                { id: 'view2', label: 'Variantes' },
                { id: 'view3', label: 'Tokens' },
              ]
            }
            value={props.value || selectedVariantId}
            onChange={(val) => {
              handlePropChange('value', val, `Opción seleccionada: ${val}`);
            }}
          />
          <span className="text-xs text-zinc-400">
            Opción activa: <strong className="text-zinc-200">{props.value || selectedVariantId}</strong>
          </span>
        </div>
      );
    }

    if (component.id === 'notification-callout') {
      return (
        <div className="w-full max-w-lg mx-auto space-y-3 py-4">
          <NotificationCallout
            type={props.type || 'info'}
            title={props.title || 'Información de Tokens'}
            message={props.message || 'Componente adaptado a tus tipografías y reglas de espaciado.'}
            onClose={() => onToast('Aviso cerrado')}
          />
          <NotificationCallout
            type="success"
            title="Sincronización Exitosa"
            message="Todos los archivos fueron compilados sin dependencias externas."
          />
        </div>
      );
    }

    if (component.id === 'toggle-switch') {
      return (
        <div className="w-full max-w-sm mx-auto rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 space-y-4">
          <ToggleSwitch
            checked={props.checked !== undefined ? Boolean(props.checked) : true}
            onChange={(val) => {
              handlePropChange('checked', val, `Toggle: ${val ? 'activado' : 'desactivado'}`);
              onToast(`Toggle cambiado: ${val}`);
            }}
            label={props.label || 'Acentuar bordes activos'}
            description={props.description || 'Aplica resplandor en foco y hover'}
          />
          <div className="h-px bg-zinc-800" />
          <ToggleSwitch
            checked={false}
            onChange={(val) => onToast(`Toggle 2 cambiado: ${val}`)}
            label="Copia automática al seleccionar"
            description="Copia el JSX al portapapeles al cambiar de variante"
          />
        </div>
      );
    }

    // Piezas personalizadas o capturadas: se compilan y renderizan en vivo
    // desde su sourceCode real, en vez de una tarjeta estática.
    return (
      <div className="w-full max-w-md mx-auto">
        <LiveComponentPreview componentName={component.name} sourceCode={component.sourceCode} />
      </div>
    );
  };

  return (
    <main
      id="workbench-area"
      className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200"
    >
      {/* Component Title Bar */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
                {component.name}
              </h1>
              <span className="rounded-md border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                v{component.version || '1.0.0'}
              </span>
              <span className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                {component.category}
              </span>
              {component.isCustom && (
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Pieza Personal
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {component.description}
            </p>

            {/* Component Tags & Custom Keywords */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <Tag className="h-3 w-3 text-indigo-500" />
                <span>Palabras clave:</span>
              </span>

              {component.tags && component.tags.length > 0 ? (
                component.tags.map((tag) => {
                  const isTagActive = activeTags.includes(tag.toLowerCase());
                  return (
                    <span
                      key={tag}
                      onClick={() => {
                        if (onToggleTagFilter) {
                          onToggleTagFilter(tag);
                          onToast(
                            isTagActive
                              ? `Filtro #${tag} desactivado`
                              : `Filtrando por palabra clave #${tag} en el panel lateral`,
                          );
                        }
                      }}
                      title={
                        onToggleTagFilter
                          ? `${isTagActive ? 'Quitar filtro' : 'Filtrar por'} #${tag}`
                          : `#${tag}`
                      }
                      className={`group/canvastag inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                        isTagActive
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <span>#{tag}</span>
                      {onRemoveTagFromComponent && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTagFromComponent(component.id, tag);
                          }}
                          title={`Eliminar #${tag} de esta pieza`}
                          className="opacity-0 group-hover/canvastag:opacity-100 hover:text-rose-600 ml-0.5 p-0.5 cursor-pointer transition-opacity"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </span>
                  );
                })
              ) : (
                <span className="text-[11px] text-zinc-400 italic">
                  Sin palabras clave asociadas
                </span>
              )}

              {/* Add Custom Tag to Component */}
              {onAddTagToComponent && (
                <>
                  {!isAddingTag ? (
                    <button
                      type="button"
                      id="btn-add-tag-to-component"
                      onClick={() => {
                        setIsAddingTag(true);
                        setNewTagText('');
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Añadir palabra clave</span>
                    </button>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400 bg-white dark:bg-zinc-900 px-2 py-0.5 shadow-2xs">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Ej. accesible, dark, v2..."
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const clean = newTagText.trim().toLowerCase().replace(/^#/, '');
                            if (clean) {
                              onAddTagToComponent(component.id, clean);
                              setNewTagText('');
                              setIsAddingTag(false);
                            }
                          } else if (e.key === 'Escape') {
                            setIsAddingTag(false);
                          }
                        }}
                        className="w-32 text-[11px] bg-transparent text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newTagText.trim().toLowerCase().replace(/^#/, '');
                          if (clean) {
                            onAddTagToComponent(component.id, clean);
                            setNewTagText('');
                            setIsAddingTag(false);
                          }
                        }}
                        className="text-emerald-600 hover:text-emerald-700 cursor-pointer text-xs font-semibold"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(false)}
                        className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavorite && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                type="button"
                id="btn-toggle-favorite-canvas"
                onClick={() => onToggleFavorite(component.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs ${
                  isFavorite
                    ? 'border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-400/30'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-amber-500 dark:hover:text-amber-400'
                }`}
                title={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
              >
                <Star
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    isFavorite
                      ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                />
                <span>{isFavorite ? 'En Favoritos' : 'Favorito'}</span>
              </motion.button>
            )}

            <button
              type="button"
              id="btn-iterate-version"
              onClick={() => onOpenIteration?.(component)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer shadow-xs"
              title="Registrar nueva iteración o versión de este componente"
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Nueva Iteración (v{component.version || '1.0.0'})</span>
            </button>

            {onTogglePlaygroundLayout && (
              <button
                type="button"
                id="btn-switch-to-grid-canvas"
                onClick={() => onTogglePlaygroundLayout('grid')}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-xs"
                title={
                  categoryComponentCount !== undefined
                    ? `Ver los ${categoryComponentCount} componentes de esta categoría en cuadrícula`
                    : 'Ver todos los componentes de la categoría actual en cuadrícula'
                }
              >
                <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
                <span>
                  Ver Cuadrícula
                  {categoryComponentCount !== undefined ? ` (${categoryComponentCount})` : ''}
                </span>
              </button>
            )}

            {onOpenCompare && (
              <button
                type="button"
                id="btn-open-compare-from-canvas"
                onClick={() => onOpenCompare(component.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-xs"
                title="Comparar esta pieza lado a lado con otro componente"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-500" />
                <span>Comparar</span>
              </button>
            )}

            {onOpenPaletteGenerator && (
              <button
                type="button"
                id="btn-open-palette-from-canvas"
                onClick={() => onOpenPaletteGenerator(accentToHex[accentColor])}
                className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-xs"
                title="Generador de paleta cromática y tokens Tailwind basado en el tono seleccionado"
              >
                <Palette className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Paleta Tailwind</span>
              </button>
            )}

            <motion.button
              whileTap={{ scale: 0.94 }}
              type="button"
              id="btn-copy-component-tsx"
              onClick={() => {
                navigator.clipboard.writeText(component.sourceCode);
                setCopiedTsx(true);
                onToast(`¡Código completo de ${component.name}.tsx copiado!`);
                setTimeout(() => setCopiedTsx(false), 2200);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer shadow-xs ${
                copiedTsx
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30'
                  : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
              }`}
            >
              <AnimatePresence mode="wait" initial={false}>
                {copiedTsx ? (
                  <motion.span
                    key="tsx-copied"
                    initial={{ scale: 0.6, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0.6 }}
                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold"
                  >
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>¡TSX Copiado!</span>
                  </motion.span>
                ) : (
                  <motion.span
                    key="tsx-copy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="inline-flex items-center gap-1.5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar TSX</span>
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* Workbench Tabs */}
        <div className="mt-5 flex gap-2 border-b border-zinc-200 dark:border-zinc-800/80 -mb-4 overflow-x-auto no-scrollbar">
          <button
            type="button"
            id="tab-btn-preview"
            onClick={() => setActiveTab('preview')}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'preview'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Vista Previa & Variantes</span>
          </button>
          <button
            type="button"
            id="tab-btn-code"
            onClick={() => setActiveTab('code')}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'code'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Código Fuente</span>
          </button>
          <button
            type="button"
            id="tab-btn-props"
            onClick={() => setActiveTab('props')}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'props'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Props & Tipos</span>
          </button>
          <button
            type="button"
            id="tab-btn-tokens"
            onClick={() => setActiveTab('tokens')}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'tokens'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <Palette className="h-3.5 w-3.5" />
            <span>Tokens ({component.tokensUsed.length})</span>
          </button>
          <button
            type="button"
            id="tab-btn-versions"
            onClick={() => setActiveTab('versions')}
            className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'versions'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Versiones & Changelog ({component.versionHistory?.length || 1})</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-6 space-y-6">
        {activeTab === 'preview' && (
          <div className="space-y-4">
            {/* Top Toolbar: Local History & Session Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-2.5 shadow-xs">
              <div className="flex flex-wrap items-center gap-2">
                {/* Local History (Undo/Redo & Session History) */}
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

                {/* Live Prop Tuning Toggle */}
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
                  title="Abre el panel interactivo para ajustar propiedades en tiempo real"
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

              {/* Accent Color picker & Copy snippet */}
              <div className="flex items-center justify-between sm:justify-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    Tono:
                  </span>
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
                  {copiedVariant ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-zinc-400" />
                  )}
                  <span className="hidden sm:inline">Copiar JSX</span>
                </button>
              </div>
            </div>

            {/* Collapsible Interactive Prop Editor Panel */}
            {isPropEditorOpen && (
              <InteractivePropEditor
                component={component}
                activeVariantProps={activeVariant?.props || {}}
                propOverrides={propOverrides}
                onPropChange={handlePropChange}
                onResetProps={handleResetProps}
              />
            )}

            {/* Variants Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/50 p-3 shadow-xs">
              {/* Variant Selector */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mr-1">
                  Variantes:
                </span>
                {component.variants.map((v) => {
                  const isSelected = v.id === selectedVariantId;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => handleSelectVariant(v.id)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      {v.name}
                    </button>
                  );
                })}
              </div>

              {/* Active Variant Info */}
              {activeVariant?.description && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  <strong className="text-zinc-800 dark:text-zinc-200">{activeVariant.name}:</strong>{' '}
                  {activeVariant.description}
                </div>
              )}
            </div>

            {/* The Live Preview Canvas Container */}
            <div
              id="live-preview-canvas"
              className={`relative min-h-[380px] rounded-3xl border border-zinc-800 p-8 flex items-center justify-center transition-all duration-300 overflow-hidden shadow-2xl ${canvasBgClass}`}
            >
              {/* Responsive Container Wrapper */}
              <div
                className={`transition-all duration-300 mx-auto ${viewportWidthClass}`}
              >
                {renderInteractiveComponent()}
              </div>
            </div>

            {/* Quick snippet under preview */}
            {activeVariant?.codeSnippet && (
              <div
                className={`relative rounded-xl border p-3 overflow-hidden transition-all duration-300 ${
                  copiedVariant
                    ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
                    : 'border-zinc-800/80 bg-zinc-900/40'
                }`}
              >
                {/* Animated top glow stripe */}
                <AnimatePresence>
                  {copiedVariant && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 via-teal-300 to-emerald-500 origin-left z-10"
                    />
                  )}
                </AnimatePresence>

                {/* Floating in-block 'Copied!' toast */}
                <AnimatePresence>
                  {copiedVariant && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.94 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                      className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-zinc-900/95 px-2.5 py-1 text-xs text-emerald-300 shadow-xl backdrop-blur-md ring-1 ring-emerald-500/20"
                    >
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                        className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                      >
                        <Check className="h-2.5 w-2.5 stroke-[3]" />
                      </motion.span>
                      <span className="font-semibold text-emerald-300 text-[11px]">
                        ¡Snippet copiado!
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-mono text-zinc-400 font-semibold">
                    Snippet para copiar y pegar en tu proyecto:
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={handleCopyVariantSnippet}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all duration-200 cursor-pointer ${
                      copiedVariant
                        ? 'text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 font-semibold'
                        : 'text-indigo-400 hover:text-indigo-300 hover:bg-zinc-800/80 border border-transparent'
                    }`}
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      {copiedVariant ? (
                        <motion.span
                          key="copied"
                          initial={{ scale: 0.6, rotate: -20 }}
                          animate={{ scale: 1, rotate: 0 }}
                          exit={{ scale: 0.6 }}
                          className="inline-flex items-center gap-1 text-emerald-400"
                        >
                          <Check className="h-3 w-3 stroke-[2.5]" />
                          <span>¡Copiado!</span>
                        </motion.span>
                      ) : (
                        <motion.span
                          key="copy"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="inline-flex items-center gap-1"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copiar</span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
                <pre className="overflow-x-auto text-xs font-mono text-zinc-300 p-2 rounded-lg bg-zinc-950/80 border border-zinc-800">
                  {activeVariant.codeSnippet}
                </pre>
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCodeType('implementation')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    codeType === 'implementation'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Implementación Completa ({component.name}.tsx)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType('usage')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    codeType === 'usage'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Ejemplo de Uso
                </button>
              </div>

              <span className="text-xs text-zinc-500 font-mono">
                Cero librerías externas · 100% Tailwind
              </span>
            </div>

            <CodeViewer
              code={
                codeType === 'implementation'
                  ? component.sourceCode
                  : component.usageSnippet
              }
              title={
                codeType === 'implementation'
                  ? `src/components/${component.name}.tsx`
                  : 'Uso en tu proyecto'
              }
              onCopySuccess={onToast}
            />
          </div>
        )}

        {activeTab === 'props' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200">
              Props y Configuración de {component.name}
            </h3>
            <PropsTable props={component.props} />
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <div className="border-b border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-200">
                Tokens Tailwind Utilizados en {component.name}
              </h3>
              <p className="text-xs text-zinc-400 mt-1">
                Haz clic en cualquier clase para copiarla a tu portapapeles.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {component.tokensUsed.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(token);
                    onToast(`Token copiado: ${token}`);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-1.5 font-mono text-xs text-indigo-600 dark:text-indigo-300 hover:border-indigo-500/40 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
                >
                  <span>{token}</span>
                  <Copy className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                </button>
              ))}
            </div>

            {onOpenPaletteGenerator && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      ¿Necesitas una paleta de tokens personalizada?
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Calcula tonos 50-950, contrates WCAG y exporta tokens CSS y Tailwind listos para tu tema.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  id="btn-tokens-tab-open-palette"
                  onClick={() => onOpenPaletteGenerator(accentToHex[accentColor])}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>Generar Paleta</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6 max-w-4xl">
            {/* Version Overview Card */}
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Versión actual en producción:
                  </span>
                  <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-0.5">
                    v{component.version || '1.0.0'}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Control de versiones, iteraciones de diseño y changelog documentado a lo largo del tiempo.
                </p>
              </div>

              <button
                type="button"
                id="btn-versions-tab-new-iteration"
                onClick={() => onOpenIteration?.(component)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer shrink-0"
              >
                <GitCommit className="h-3.5 w-3.5" />
                <span>Registrar Nueva Iteración</span>
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Historial Cronológico de Iteraciones ({(component.versionHistory || []).length || 1})
                </h3>
                <span className="text-[11px] text-zinc-400">
                  Total de iteraciones registradas
                </span>
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
                {(component.versionHistory && component.versionHistory.length > 0
                  ? component.versionHistory
                  : [
                      {
                        version: component.version || '1.0.0',
                        date: component.createdAt?.split('T')[0] || '2026-09-15',
                        notes: 'Versión base inicial registrada en la biblioteca.',
                        changes: ['Lanzamiento inicial de la pieza'],
                      },
                    ]
                ).map((iter, idx) => {
                  const isLatest = idx === 0;
                  return (
                    <div key={`${iter.version}-${idx}`} className="relative group">
                      {/* Timeline dot */}
                      <div
                        className={`absolute -left-6 top-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isLatest
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500'
                        }`}
                      >
                        <div className="h-1.5 w-1.5 rounded-full bg-current" />
                      </div>

                      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                              v{iter.version}
                            </span>
                            {isLatest && (
                              <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                                Versión Activa
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {iter.date}
                          </span>
                        </div>

                        <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                          {iter.notes}
                        </p>

                        {iter.changes && iter.changes.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                            {iter.changes.map((change, cIdx) => (
                              <span
                                key={cIdx}
                                className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-400"
                              >
                                {change}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
