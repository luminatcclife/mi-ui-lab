import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Square,
  Copy,
  Check,
  Star,
  ArrowLeftRight,
  CreditCard,
  MousePointerClick,
  TextCursorInput,
  Bell,
  Navigation,
  BarChart2,
  Sparkles,
  FolderCode,
  Tag,
  Sliders,
  Maximize2,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  AccentColor,
  CanvasBackground,
  ComponentCategory,
  UIComponent,
} from '../types';
import { InteractiveComponentRenderer } from './InteractiveComponentRenderer';

interface CategoryGridViewProps {
  components: UIComponent[];
  currentCategory: ComponentCategory;
  onSelectCategory: (category: ComponentCategory) => void;
  selectedId: string;
  onSelectComponent: (id: string) => void;
  onSwitchToFocus: (id?: string) => void;
  onOpenCompare?: (componentId: string) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  canvasBg: CanvasBackground;
  onToast: (msg: string) => void;
  activeTags?: string[];
  onToggleTagFilter?: (tag: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const categoryIcons: Record<ComponentCategory, React.ReactNode> = {
  all: <FolderCode className="h-4 w-4" />,
  favorites: <Star className="h-4 w-4 fill-amber-400 text-amber-500" />,
  cards: <CreditCard className="h-4 w-4" />,
  buttons: <MousePointerClick className="h-4 w-4" />,
  inputs: <TextCursorInput className="h-4 w-4" />,
  feedback: <Bell className="h-4 w-4" />,
  navigation: <Navigation className="h-4 w-4" />,
  data: <BarChart2 className="h-4 w-4" />,
  custom: <Sparkles className="h-4 w-4" />,
};

const categoryLabels: Record<ComponentCategory, string> = {
  all: 'Todas las Categorías',
  favorites: 'Favoritos Guardados',
  cards: 'Tarjetas & Contenedores',
  buttons: 'Botones & Acciones',
  inputs: 'Inputs & Formularios',
  feedback: 'Feedback & Notificaciones',
  navigation: 'Navegación & Menús',
  data: 'Datos & Cuadros de Mando',
  custom: 'Mis Piezas Personalizadas',
};

const categoryDescriptions: Record<ComponentCategory, string> = {
  all: 'Colección completa de componentes UI disponibles en el laboratorio.',
  favorites: 'Tus piezas destacadas guardadas para acceso rápido.',
  cards: 'Superficies elevadas, bordes con acento visual, KPIs y paneles de acción.',
  buttons: 'Elementos de acción primaria, secundaria y estados de carga responsivos.',
  inputs: 'Controles de entrada de texto, selectores y toggles con feedback visual.',
  feedback: 'Badges de estado, avisos informativos y banners de alerta contextuales.',
  navigation: 'Barras segmentadas, pestañas y componentes para organizar vistas.',
  data: 'Gráficos ligeros, contadores y visualización de métricas esenciales.',
  custom: 'Piezas diseñadas o extendidas localmente en este entorno.',
};

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

export function CategoryGridView({
  components,
  currentCategory,
  onSelectCategory,
  selectedId,
  onSelectComponent,
  onSwitchToFocus,
  onOpenCompare,
  favoriteIds = [],
  onToggleFavorite,
  canvasBg,
  onToast,
  activeTags = [],
  onToggleTagFilter,
  searchQuery = '',
}: CategoryGridViewProps) {
  // Individual variant selections for each card in the grid
  const [cardVariants, setCardVariants] = useState<Record<string, string>>({});
  // Individual accent color choices for each card in the grid
  const [cardAccents, setCardAccents] = useState<Record<string, AccentColor>>({});
  // Copied state indicator per component card
  const [copiedCompId, setCopiedCompId] = useState<string | null>(null);

  const categoriesList: ComponentCategory[] = [
    'all',
    'cards',
    'buttons',
    'inputs',
    'feedback',
    'navigation',
    'data',
    'custom',
    'favorites',
  ];

  // Canvas background pattern
  const canvasBgClass = {
    dots: 'bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:16px_16px] bg-slate-100/70 dark:bg-zinc-950',
    grid: 'bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] [background-size:20px_20px] bg-slate-50 dark:bg-zinc-950',
    dark: 'bg-zinc-950 text-zinc-100',
    light: 'bg-white text-zinc-900',
  }[canvasBg];

  // Filter components belonging to the current category and active search/tag filters
  const categoryComponents = useMemo(() => {
    return components.filter((comp) => {
      // Category condition
      let matchCat = true;
      if (currentCategory === 'favorites') {
        matchCat = favoriteIds.includes(comp.id);
      } else if (currentCategory === 'custom') {
        matchCat = Boolean(comp.isCustom);
      } else if (currentCategory !== 'all') {
        matchCat = comp.category === currentCategory;
      }

      if (!matchCat) return false;

      // Search query condition
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchQuery =
          comp.name.toLowerCase().includes(q) ||
          comp.tagline.toLowerCase().includes(q) ||
          comp.description.toLowerCase().includes(q) ||
          comp.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchQuery) return false;
      }

      // Tag filter condition
      if (activeTags.length > 0) {
        const compTags = comp.tags.map((t) => t.toLowerCase());
        const matchTags = activeTags.some((at) => compTags.includes(at.toLowerCase()));
        if (!matchTags) return false;
      }

      return true;
    });
  }, [components, currentCategory, favoriteIds, searchQuery, activeTags]);

  // Compute component counts per category
  const countsPerCategory = useMemo(() => {
    const counts: Record<ComponentCategory, number> = {
      all: components.length,
      favorites: components.filter((c) => favoriteIds.includes(c.id)).length,
      cards: components.filter((c) => c.category === 'cards').length,
      buttons: components.filter((c) => c.category === 'buttons').length,
      inputs: components.filter((c) => c.category === 'inputs').length,
      feedback: components.filter((c) => c.category === 'feedback').length,
      navigation: components.filter((c) => c.category === 'navigation').length,
      data: components.filter((c) => c.category === 'data').length,
      custom: components.filter((c) => c.isCustom).length,
    };
    return counts;
  }, [components, favoriteIds]);

  const handleCopySnippet = (comp: UIComponent, snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedCompId(comp.id);
    onToast(`¡Snippet de ${comp.name} copiado al portapapeles!`);
    setTimeout(() => {
      setCopiedCompId((prev) => (prev === comp.id ? null : prev));
    }, 2000);
  };

  return (
    <main
      id="category-grid-workbench"
      className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200"
    >
      {/* Top Header Banner: Category details & View Switcher Toggle */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-6 py-5 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400">
                {categoryIcons[currentCategory]}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
                {categoryLabels[currentCategory]}
              </h1>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {categoryComponents.length} {categoryComponents.length === 1 ? 'pieza' : 'piezas'}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {categoryDescriptions[currentCategory]}
            </p>
          </div>

          {/* Playground View Toggle Bar (Focused vs Category Grid) */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="inline-flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/90 dark:bg-zinc-900/90 p-1 shadow-2xs">
              <button
                type="button"
                id="toggle-view-focus-from-grid"
                onClick={() => onSwitchToFocus(selectedId)}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all cursor-pointer"
                title="Cambiar a la vista enfocada en un solo componente"
              >
                <Square className="h-3.5 w-3.5 text-zinc-400" />
                <span>Vista Enfocada</span>
              </button>

              <button
                type="button"
                id="toggle-view-grid-active"
                className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80 cursor-default"
                title="Vista en cuadrícula de todos los componentes de la categoría activa"
              >
                <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
                <span>Cuadrícula de Categoría</span>
              </button>
            </div>
          </div>
        </div>

        {/* Category Pills Navigation */}
        <div className="mt-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1.5 shrink-0 flex items-center gap-1">
            <Filter className="h-3 w-3" />
            <span>Categoría:</span>
          </span>
          {categoriesList.map((cat) => {
            const isSelected = currentCategory === cat;
            const count = countsPerCategory[cat];
            return (
              <button
                key={cat}
                type="button"
                id={`cat-pill-${cat}`}
                onClick={() => onSelectCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'bg-zinc-100 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <span className="shrink-0">{categoryIcons[cat]}</span>
                <span>{categoryLabels[cat].split('&')[0].trim()}</span>
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isSelected
                      ? 'bg-indigo-700 text-indigo-100'
                      : 'bg-zinc-200/80 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Content Area */}
      <div className="p-6 flex-1">
        {categoryComponents.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center max-w-lg mx-auto my-12 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xs space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base">
                No hay componentes en esta categoría
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {searchQuery || activeTags.length > 0
                  ? 'Ningún componente coincide con tus filtros de búsqueda o etiquetas.'
                  : 'Esta categoría aún no contiene piezas registradas.'}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => onSelectCategory('all')}
                className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer transition-colors shadow-2xs"
              >
                Ver todas las categorías
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {categoryComponents.map((comp) => {
              const activeVariantId = cardVariants[comp.id] || comp.variants[0]?.id || 'default';
              const activeVariant =
                comp.variants.find((v) => v.id === activeVariantId) || comp.variants[0];
              const activeAccent = cardAccents[comp.id] || 'indigo';
              const isSelected = comp.id === selectedId;
              const isFav = favoriteIds.includes(comp.id);
              const isCopied = copiedCompId === comp.id;

              return (
                <div
                  key={comp.id}
                  id={`grid-card-${comp.id}`}
                  className={`flex flex-col rounded-3xl border transition-all duration-200 bg-white dark:bg-zinc-900/80 shadow-md hover:shadow-xl overflow-hidden group ${
                    isSelected
                      ? 'border-indigo-500/70 ring-2 ring-indigo-500/20 shadow-indigo-500/10'
                      : 'border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  {/* Card Header Bar */}
                  <div className="p-4 border-b border-zinc-100 dark:border-zinc-800/80 flex items-start justify-between gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectComponent(comp.id);
                            onSwitchToFocus(comp.id);
                          }}
                          className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left truncate cursor-pointer"
                          title="Abrir en vista enfocada"
                        >
                          {comp.name}
                        </button>
                        <span className="rounded-md border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 font-mono text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                          v{comp.version || '1.0.0'}
                        </span>
                        {comp.isCustom && (
                          <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                            Custom
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-1 leading-snug">
                        {comp.tagline || comp.description}
                      </p>
                    </div>

                    {/* Quick Fav & Inspect Buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {onToggleFavorite && (
                        <button
                          type="button"
                          id={`grid-btn-fav-${comp.id}`}
                          onClick={() => onToggleFavorite(comp.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isFav
                              ? 'border-amber-400/40 bg-amber-500/10 text-amber-500'
                              : 'border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-amber-500 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                          }`}
                          title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        >
                          <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                        </button>
                      )}

                      <button
                        type="button"
                        id={`grid-btn-focus-${comp.id}`}
                        onClick={() => {
                          onSelectComponent(comp.id);
                          onSwitchToFocus(comp.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer shadow-2xs"
                        title="Inspeccionar a fondo en vista enfocada"
                      >
                        <Maximize2 className="h-3 w-3" />
                        <span className="hidden sm:inline">Enfocar</span>
                      </button>
                    </div>
                  </div>

                  {/* Variant & Accent Color Tuning Bar */}
                  <div className="px-4 py-2 border-b border-zinc-100 dark:border-zinc-800/60 bg-white dark:bg-zinc-950 flex items-center justify-between gap-2 text-xs">
                    {/* Variant Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                      <span className="text-[10px] uppercase font-bold text-zinc-400 mr-0.5 shrink-0">
                        Var:
                      </span>
                      {comp.variants.map((v) => {
                        const isVarActive = activeVariant?.id === v.id;
                        return (
                          <button
                            key={v.id}
                            type="button"
                            onClick={() =>
                              setCardVariants((prev) => ({ ...prev, [comp.id]: v.id }))
                            }
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                              isVarActive
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                            }`}
                          >
                            {v.name}
                          </button>
                        );
                      })}
                    </div>

                    {/* Accent Color picker dots */}
                    <div className="flex items-center gap-1 shrink-0">
                      {accentColors.slice(0, 4).map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setCardAccents((prev) => ({ ...prev, [comp.id]: col }))}
                          title={`Tono ${col}`}
                          className={`h-3.5 w-3.5 rounded-full ${colorDotBg[col]} cursor-pointer transition-transform ${
                            activeAccent === col
                              ? 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 scale-115'
                              : 'opacity-50 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Live Interactive Preview Stage */}
                  <div
                    className={`relative min-h-[200px] p-6 flex items-center justify-center transition-all overflow-hidden border-b border-zinc-100 dark:border-zinc-800/60 ${canvasBgClass}`}
                  >
                    <div className="w-full flex items-center justify-center">
                      <InteractiveComponentRenderer
                        component={comp}
                        activeVariantProps={activeVariant?.props || {}}
                        accentColor={activeAccent}
                        onToast={onToast}
                        compact
                      />
                    </div>
                  </div>

                  {/* Card Tags / Keywords */}
                  <div className="px-4 py-2 bg-zinc-50/40 dark:bg-zinc-950/40 flex flex-wrap items-center gap-1 border-b border-zinc-100 dark:border-zinc-800/40">
                    <Tag className="h-2.5 w-2.5 text-zinc-400" />
                    {comp.tags && comp.tags.length > 0 ? (
                      comp.tags.slice(0, 4).map((tag) => {
                        const isTagActive = activeTags.includes(tag.toLowerCase());
                        return (
                          <span
                            key={tag}
                            onClick={() => onToggleTagFilter?.(tag)}
                            className={`rounded px-1.5 py-0.2 text-[10px] font-medium cursor-pointer transition-colors ${
                              isTagActive
                                ? 'bg-indigo-600 text-white font-semibold'
                                : 'bg-zinc-200/60 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700'
                            }`}
                            title={`Filtrar por #${tag}`}
                          >
                            #{tag}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-zinc-400 italic">Sin etiquetas</span>
                    )}
                    {comp.tags && comp.tags.length > 4 && (
                      <span className="text-[10px] text-zinc-400 font-mono">
                        +{comp.tags.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="p-3 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 mt-auto">
                    {/* Copy JSX snippet */}
                    <button
                      type="button"
                      id={`grid-copy-btn-${comp.id}`}
                      onClick={() =>
                        handleCopySnippet(
                          comp,
                          activeVariant?.codeSnippet || comp.usageSnippet,
                        )
                      }
                      className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                        isCopied
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {isCopied ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3 text-zinc-400" />
                      )}
                      <span>{isCopied ? '¡Copiado!' : 'JSX'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {onOpenCompare && (
                        <button
                          type="button"
                          id={`grid-compare-btn-${comp.id}`}
                          onClick={() => onOpenCompare(comp.id)}
                          className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                          title="Comparar esta pieza lado a lado"
                        >
                          <ArrowLeftRight className="h-3 w-3 text-indigo-500" />
                          <span>Comparar</span>
                        </button>
                      )}

                      <button
                        type="button"
                        id={`grid-open-focus-btn-${comp.id}`}
                        onClick={() => {
                          onSelectComponent(comp.id);
                          onSwitchToFocus(comp.id);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        title="Abrir inspector completo en vista enfocada"
                      >
                        <span>Abrir</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
