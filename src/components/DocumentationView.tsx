import React, { useState } from 'react';
import {
  BookOpen,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCode,
  Sparkles,
  ArrowUpRight,
  Eye,
  History,
  GitCommit,
  Clock,
  Star,
  Tag,
  ArrowLeftRight,
} from 'lucide-react';
import { UIComponent, AccentColor } from '../types';
import { AccentCard } from './ui/AccentCard';
import { Button } from './ui/Button';
import { StatusBadge } from './ui/StatusBadge';
import { InputField } from './ui/InputField';
import { SegmentedControl } from './ui/SegmentedControl';
import { NotificationCallout } from './ui/NotificationCallout';
import { ToggleSwitch } from './ui/ToggleSwitch';
import { StepProgressCard } from './ui/StepProgressCard';
import { useTheme } from '../context/ThemeContext';
import { AnimatePresence, motion } from 'motion/react';
import { CodeViewer } from './CodeViewer';

interface DocumentationViewProps {
  components: UIComponent[];
  onOpenInPlayground: (componentId: string) => void;
  onOpenIteration?: (comp: UIComponent) => void;
  onOpenCompare?: (componentId: string) => void;
  onToast: (msg: string) => void;
  initialSelectedId?: string;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  activeTags?: string[];
  onToggleTagFilter?: (tag: string) => void;
}

export function DocumentationView({
  components,
  onOpenInPlayground,
  onOpenIteration,
  onOpenCompare,
  onToast,
  initialSelectedId,
  favoriteIds = [],
  onToggleFavorite,
  activeTags = [],
  onToggleTagFilter,
}: DocumentationViewProps) {
  const { theme, typographyName } = useTheme();
  const [selectedCompId, setSelectedCompId] = useState<string>(
    initialSelectedId || 'accent-card',
  );
  const [docsSearch, setDocsSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [expandedSourceCode, setExpandedSourceCode] = useState<
    Record<string, boolean>
  >({});
  const [accentColorChoice, setAccentColorChoice] = useState<AccentColor>('indigo');

  const copyToClipboard = (text: string, key: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast(`¡${label} copiado al portapapeles!`);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2000);
  };

  const toggleSource = (compId: string) => {
    setExpandedSourceCode((prev) => ({
      ...prev,
      [compId]: !prev[compId],
    }));
  };

  // Filter components in docs sidebar
  const filteredComponents = components.filter((comp) => {
    if (!docsSearch.trim()) return true;
    const q = docsSearch.toLowerCase();
    return (
      comp.name.toLowerCase().includes(q) ||
      comp.tagline.toLowerCase().includes(q) ||
      comp.description.toLowerCase().includes(q) ||
      (comp.tags &&
        comp.tags.some(
          (t) => t.toLowerCase().includes(q) || q.includes(t.toLowerCase()),
        )) ||
      (comp.version && comp.version.toLowerCase().includes(q)) ||
      (comp.version && `v${comp.version}`.toLowerCase().includes(q)) ||
      comp.versionHistory?.some(
        (vh) =>
          vh.notes.toLowerCase().includes(q) ||
          vh.version.toLowerCase().includes(q),
      ) ||
      comp.props.some(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q),
      )
    );
  });

  const activeComponent =
    components.find((c) => c.id === selectedCompId) || components[0];

  // Helper to render live component variant in docs
  const renderLiveVariant = (
    compId: string,
    variantProps: Record<string, any>,
  ) => {
    switch (compId) {
      case 'accent-card':
        return (
          <div className="w-full max-w-md mx-auto">
            <AccentCard
              variant={variantProps.variant || 'default'}
              accentColor={accentColorChoice}
              title={variantProps.title || 'Métrica de Rendimiento'}
              subtitle={variantProps.subtitle}
              badge={variantProps.badge}
              metric={variantProps.metric}
              trend={variantProps.trend}
              actionLabel={variantProps.actionLabel}
              onAction={() =>
                onToast(`Acción en ${variantProps.title || 'AccentCard'}`)
              }
            />
          </div>
        );
      case 'primary-button':
        return (
          <div className="flex flex-wrap items-center justify-center gap-3 py-4">
            <Button
              variant={variantProps.variant || 'primary'}
              size={variantProps.size || 'md'}
              loading={variantProps.loading}
              onClick={() => onToast('Clic en botón!')}
            >
              {variantProps.label || 'Botón de Acción'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => onToast('Clic secundario')}
            >
              Secundario
            </Button>
            <Button variant="outline">Contorno</Button>
          </div>
        );
      case 'status-badge':
        return (
          <div className="flex flex-wrap items-center justify-center gap-3 py-4">
            <StatusBadge
              status={variantProps.status || 'success'}
              label={variantProps.label || 'En Línea'}
              withDot={variantProps.withDot !== false}
            />
            <StatusBadge status="warning" label="Pendiente" withDot />
            <StatusBadge status="danger" label="Error" withDot />
            <StatusBadge status="info" label="v2.4" withDot={false} />
          </div>
        );
      case 'input-field':
        return (
          <div className="w-full max-w-sm mx-auto py-2">
            <InputField
              label={variantProps.label || 'Nombre completo'}
              placeholder={variantProps.placeholder || 'Ej. Sofia Alarcón'}
              helperText={variantProps.helperText}
              error={variantProps.error}
              disabled={variantProps.disabled}
            />
          </div>
        );
      case 'segmented-control':
        return (
          <div className="flex justify-center py-4">
            <SegmentedControl
              options={[
                { id: 'preview', label: 'Vista Previa' },
                { id: 'code', label: 'Código TSX' },
                { id: 'tokens', label: 'Tokens' },
              ]}
              value="preview"
              onChange={(v) => onToast(`Opción seleccionada: ${v}`)}
            />
          </div>
        );
      case 'notification-callout':
        return (
          <div className="w-full max-w-md mx-auto py-2">
            <NotificationCallout
              type={variantProps.type || 'info'}
              title={variantProps.title || 'Sincronización Completada'}
              message={
                variantProps.message ||
                'Los tokens y configuraciones locales se han guardado con éxito.'
              }
              onClose={() => onToast('Callout cerrado')}
            />
          </div>
        );
      case 'toggle-switch':
        return (
          <div className="w-full max-w-sm mx-auto py-2">
            <ToggleSwitch
              checked={variantProps.checked ?? true}
              label={variantProps.label || 'Activar Notificaciones'}
              description={
                variantProps.description ||
                'Recibe alertas de cambios de estado en tiempo real.'
              }
              onChange={(val) =>
                onToast(`Interruptor: ${val ? 'Activado' : 'Desactivado'}`)
              }
            />
          </div>
        );
      case 'step-progress-card':
        return (
          <div className="w-full max-w-md mx-auto py-2">
            <StepProgressCard
              variant={variantProps.variant || 'default'}
              accentColor={accentColorChoice}
              title={variantProps.title || 'Android Beta'}
              badge={variantProps.badge}
              steps={variantProps.steps}
              onStepAction={(step) => onToast(`Paso seleccionado: ${step.title}`)}
            />
          </div>
        );
      default:
        return (
          <div className="p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 text-center text-xs text-zinc-500">
            Vista previa no disponible para componente externo.
          </div>
        );
    }
  };

  const accentOptions: AccentColor[] = [
    'indigo',
    'emerald',
    'violet',
    'amber',
    'rose',
    'cyan',
    'zinc',
  ];

  return (
    <div className="flex flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Docs Sidebar Navigation */}
      <aside
        id="docs-sidebar"
        className="hidden md:flex w-72 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md"
      >
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Guía de Componentes
            </h2>
          </div>
          <input
            type="text"
            id="docs-filter-input"
            placeholder="Filtrar documentación..."
            value={docsSearch}
            onChange={(e) => setDocsSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {/* Component items list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredComponents.map((comp) => {
            const isSelected = comp.id === activeComponent.id;
            return (
              <button
                key={comp.id}
                type="button"
                id={`docs-nav-${comp.id}`}
                onClick={() => {
                  setSelectedCompId(comp.id);
                  const el = document.getElementById(`doc-section-${comp.id}`);
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-600/15 font-semibold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {favoriteIds.includes(comp.id) && (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                  )}
                  <span className="font-mono">{comp.name}</span>
                  <span className="rounded bg-zinc-200/80 dark:bg-zinc-800 font-mono text-[9px] px-1 py-0.2 text-zinc-600 dark:text-zinc-400">
                    v{comp.version || '1.0.0'}
                  </span>
                  {comp.isCustom && (
                    <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.2 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                      Propia
                    </span>
                  )}
                </div>
                <span className="rounded bg-zinc-200/60 dark:bg-zinc-800/80 px-1.5 py-0.2 text-[10px] text-zinc-500 dark:text-zinc-400">
                  {comp.variants.length} var.
                </span>
              </button>
            );
          })}
        </div>

        {/* Theme and typography badge indicator */}
        <div className="p-3 border-t border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/40 text-[11px] text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center justify-between">
            <span>Tema activo:</span>
            <span className="font-semibold capitalize text-zinc-700 dark:text-zinc-200">
              {theme}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-1">
            Tipografía: {typographyName}
          </p>
        </div>
      </aside>

      {/* Main Documentation Content */}
      <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Documentation Header Banner */}
          <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/80 p-6 sm:p-8 shadow-sm backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    mi-ui-lab Docs
                  </span>
                  <span className="text-xs text-zinc-400">·</span>
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    {components.length} piezas listas para usar
                  </span>
                </div>
                <h1 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  Documentación de Componentes UI
                </h1>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl">
                  Especificación de diseño, ejemplos interactivos con sus
                  diferentes variantes y documentación detallada de props para
                  cada pieza de tu catálogo.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 text-xs">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Acento de prueba:
                  </span>
                  <div className="flex items-center gap-1">
                    {accentOptions.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setAccentColorChoice(c)}
                        title={`Probar tono ${c}`}
                        className={`h-4 w-4 rounded-full transition-transform cursor-pointer ${
                          c === 'indigo'
                            ? 'bg-indigo-500'
                            : c === 'emerald'
                            ? 'bg-emerald-500'
                            : c === 'violet'
                            ? 'bg-violet-500'
                            : c === 'amber'
                            ? 'bg-amber-500'
                            : c === 'rose'
                            ? 'bg-rose-500'
                            : c === 'cyan'
                            ? 'bg-cyan-500'
                            : 'bg-zinc-500'
                        } ${
                          accentColorChoice === c
                            ? 'ring-2 ring-offset-2 ring-indigo-500 dark:ring-offset-zinc-900 scale-110'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Component Documentation Blocks */}
          {components.map((component) => {
            const isTargeted = component.id === activeComponent.id;
            const importSnippet = `import { ${component.name} } from './components/ui/${component.name}';`;

            return (
              <section
                key={component.id}
                id={`doc-section-${component.id}`}
                className={`rounded-3xl border transition-all duration-300 p-6 sm:p-8 ${
                  isTargeted
                    ? 'border-indigo-300 dark:border-indigo-500/40 bg-white dark:bg-zinc-900/90 shadow-md'
                    : 'border-zinc-200 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/60 shadow-sm'
                }`}
              >
                {/* Component Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-6">
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">
                        {component.name}
                      </h2>
                      <span className="rounded-md border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        v{component.version || '1.0.0'}
                      </span>
                      <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 capitalize">
                        {component.category}
                      </span>
                      {component.isCustom && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          Personalizada
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
                      {component.tagline}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                      {component.description}
                    </p>

                    {/* Component Tags & Keywords */}
                    {component.tags && component.tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                          <Tag className="h-3 w-3 text-indigo-500" />
                          <span>Tags:</span>
                        </span>
                        {component.tags.map((tag) => {
                          const isTagActive = activeTags?.includes(tag.toLowerCase());
                          return (
                            <span
                              key={tag}
                              onClick={() => {
                                if (onToggleTagFilter) {
                                  onToggleTagFilter(tag);
                                  onToast(`Filtrando por palabra clave #${tag}`);
                                }
                              }}
                              title={
                                onToggleTagFilter
                                  ? `${isTagActive ? 'Quitar filtro' : 'Filtrar por'} #${tag}`
                                  : `#${tag}`
                              }
                              className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
                                isTagActive
                                  ? 'bg-indigo-600 text-white font-semibold'
                                  : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                              }`}
                            >
                              #{tag}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Actions: Open in Playground & Copy Import */}
                  <div className="flex items-center gap-2 shrink-0">
                    {onToggleFavorite && (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        id={`btn-star-doc-${component.id}`}
                        onClick={() => onToggleFavorite(component.id)}
                        className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200 cursor-pointer shadow-xs ${
                          favoriteIds.includes(component.id)
                            ? 'border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-400/30'
                            : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-amber-500 dark:hover:text-amber-400'
                        }`}
                        title={
                          favoriteIds.includes(component.id)
                            ? 'Quitar de favoritos'
                            : 'Guardar en favoritos'
                        }
                      >
                        <Star
                          className={`h-3.5 w-3.5 transition-transform duration-200 ${
                            favoriteIds.includes(component.id)
                              ? 'fill-amber-400 text-amber-500 scale-110 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]'
                              : 'text-zinc-400 dark:text-zinc-500'
                          }`}
                        />
                        <span>
                          {favoriteIds.includes(component.id)
                            ? 'En Favoritos'
                            : 'Favorito'}
                        </span>
                      </motion.button>
                    )}

                    <button
                      type="button"
                      id={`btn-iterate-${component.id}`}
                      onClick={() => onOpenIteration?.(component)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer shadow-xs"
                      title="Registrar una nueva iteración o versión de esta pieza"
                    >
                      <GitCommit className="h-3.5 w-3.5" />
                      <span>Iterar (v{component.version || '1.0.0'})</span>
                    </button>

                    {onOpenCompare && (
                      <button
                        type="button"
                        id={`btn-doc-compare-${component.id}`}
                        onClick={() => onOpenCompare(component.id)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-xs"
                        title="Comparar esta pieza con otro componente"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-500" />
                        <span>Comparar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      id={`btn-playground-${component.id}`}
                      onClick={() => onOpenInPlayground(component.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
                    >
                      <span>Probar en Playground</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Import Statement Box */}
                <div className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Code2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                      <code className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate">
                        {importSnippet}
                      </code>
                    </div>
                    <button
                      type="button"
                      id={`btn-copy-import-${component.id}`}
                      onClick={() =>
                        copyToClipboard(
                          importSnippet,
                          `import-${component.id}`,
                          'Importación',
                        )
                      }
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
                    >
                      {copiedKey === `import-${component.id}` ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-[11px] text-emerald-500">
                            Copiado
                          </span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[11px]">Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Variantes en Vivo (Interactive Examples) */}
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Variantes y Ejemplos de Uso
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        Renderizadas en vivo con el tema activo ({theme}).
                      </p>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      {component.variants.length} variantes
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {component.variants.map((variant) => (
                      <div
                        key={variant.id}
                        id={`variant-card-${component.id}-${variant.id}`}
                        className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 p-5 transition-shadow hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div>
                            <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                              {variant.name}
                            </h4>
                            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                              {variant.description}
                            </p>
                          </div>
                          <span className="rounded bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 shrink-0">
                            {variant.id}
                          </span>
                        </div>

                        {/* Live Render Area */}
                        <div className="my-3 flex-1 flex items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-4 shadow-inner min-h-[140px]">
                          {renderLiveVariant(component.id, variant.props)}
                        </div>

                        {/* Code snippet with animated copy button and in-block toast */}
                        {(() => {
                          const isCopied =
                            copiedKey ===
                            `snippet-${component.id}-${variant.id}`;
                          return (
                            <div
                              className={`relative mt-3 rounded-xl border p-2.5 overflow-hidden transition-all duration-300 ${
                                isCopied
                                  ? 'border-emerald-500/50 bg-emerald-950/20 shadow-[0_0_20px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/30'
                                  : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900'
                              }`}
                            >
                              {/* In-block 'Copied!' toast */}
                              <AnimatePresence>
                                {isCopied && (
                                  <motion.div
                                    initial={{ opacity: 0, y: -6, scale: 0.92 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -6, scale: 0.92 }}
                                    transition={{
                                      type: 'spring',
                                      stiffness: 500,
                                      damping: 25,
                                    }}
                                    className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-zinc-900/95 px-2.5 py-1 text-xs text-emerald-300 shadow-xl backdrop-blur-md ring-1 ring-emerald-500/20"
                                  >
                                    <motion.span
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{
                                        type: 'spring',
                                        stiffness: 600,
                                        damping: 20,
                                      }}
                                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                                    >
                                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                                    </motion.span>
                                    <span className="font-semibold text-emerald-300 text-[10px]">
                                      ¡Snippet copiado!
                                    </span>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium">
                                  JSX Snippet
                                </span>
                                <motion.button
                                  whileTap={{ scale: 0.94 }}
                                  type="button"
                                  id={`btn-copy-snippet-${component.id}-${variant.id}`}
                                  onClick={() =>
                                    copyToClipboard(
                                      variant.codeSnippet,
                                      `snippet-${component.id}-${variant.id}`,
                                      `Snippet de ${variant.name}`,
                                    )
                                  }
                                  className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-medium transition-all duration-200 cursor-pointer ${
                                    isCopied
                                      ? 'text-emerald-500 bg-emerald-500/10 border border-emerald-500/30 font-semibold'
                                      : 'text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 border border-transparent'
                                  }`}
                                >
                                  <AnimatePresence mode="wait" initial={false}>
                                    {isCopied ? (
                                      <motion.span
                                        key="copied"
                                        initial={{ scale: 0.6, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        exit={{ scale: 0.6 }}
                                        className="inline-flex items-center gap-1 text-emerald-500"
                                      >
                                        <Check className="h-3 w-3 stroke-[2.5]" />
                                        <span>Copiado</span>
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
                                        <span>Copiar Snippet</span>
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              </div>
                              <pre className="overflow-x-auto text-[11px] font-mono text-zinc-800 dark:text-zinc-300 leading-relaxed">
                                {variant.codeSnippet}
                              </pre>
                            </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Especificación de Props */}
                <div className="mt-8">
                  <div className="mb-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Especificación de Props
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Tipado TypeScript y valores por defecto.
                    </p>
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400">
                          <th className="py-3 px-4 font-semibold">Propiedad</th>
                          <th className="py-3 px-4 font-semibold">Tipo TypeScript</th>
                          <th className="py-3 px-4 font-semibold">Valor Inicial</th>
                          <th className="py-3 px-4 font-semibold">Descripción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {component.props.map((prop) => (
                          <tr
                            key={prop.name}
                            className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/40 transition-colors"
                          >
                            <td className="py-3 px-4 font-mono font-semibold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span>{prop.name}</span>
                                {prop.required ? (
                                  <span className="rounded bg-rose-500/10 border border-rose-500/30 px-1 py-0.2 text-[9px] font-sans font-medium text-rose-600 dark:text-rose-400">
                                    Requerido
                                  </span>
                                ) : (
                                  <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 text-[9px] font-sans text-zinc-400">
                                    Opcional
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-700 dark:text-zinc-300">
                              <span className="rounded bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 text-[11px]">
                                {prop.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-zinc-500 dark:text-zinc-400">
                              {prop.defaultValue || '—'}
                            </td>
                            <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300 leading-relaxed">
                              {prop.description}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Tokens Utilizados */}
                <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                    Tokens y Clases Tailwind
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {component.tokensUsed.map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() =>
                          copyToClipboard(token, `token-${token}`, token)
                        }
                        title="Clic para copiar token"
                        className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-[11px] font-mono text-zinc-700 dark:text-zinc-300 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                      >
                        {token}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Collapsible Source Code Accordion */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => toggleSource(component.id)}
                    className="flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <FileCode className="h-3.5 w-3.5" />
                    <span>
                      {expandedSourceCode[component.id]
                        ? 'Ocultar código fuente TSX'
                        : 'Ver implementación completa (.tsx)'}
                    </span>
                    {expandedSourceCode[component.id] ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                  </button>

                  {/* Version Changelog & Iteration History Box */}
                  <div className="mt-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                          Historial de Versiones & Iteraciones
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-zinc-500">
                        {(component.versionHistory || []).length || 1} versión(es)
                      </span>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {(component.versionHistory && component.versionHistory.length > 0
                        ? component.versionHistory
                        : [
                            {
                              version: component.version || '1.0.0',
                              date: component.createdAt?.split('T')[0] || '2026-09-15',
                              notes: 'Versión base registrada en la biblioteca.',
                              changes: ['Lanzamiento inicial de la pieza'],
                            },
                          ]
                      ).map((iter, iterIdx) => (
                        <div
                          key={`${iter.version}-${iterIdx}`}
                          className="flex items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-2.5 text-xs"
                        >
                          <span className="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400 rounded-md bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 shrink-0 border border-indigo-500/20">
                            v{iter.version}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {iter.date}
                              </span>
                              {iterIdx === 0 && (
                                <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.2 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                                  Activa
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-zinc-700 dark:text-zinc-300 text-[11px]">
                              {iter.notes}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {expandedSourceCode[component.id] && (
                    <div className="mt-4">
                      <CodeViewer
                        code={component.sourceCode}
                        title={`src/components/${component.name}.tsx`}
                        onCopySuccess={onToast}
                      />
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}
