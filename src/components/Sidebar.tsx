import React, { useMemo, useState } from 'react';
import {
  Search,
  X,
  CreditCard,
  MousePointerClick,
  TextCursorInput,
  Bell,
  Navigation,
  BarChart2,
  FolderCode,
  Sparkles,
  Trash2,
  Tag,
  Zap,
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Check,
  SlidersHorizontal,
  Hash,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ComponentCategory, UIComponent } from '../types';
import { ComponentFuzzyIndex, FuzzySearchResult } from '../utils/fuzzySearchIndex';

interface SidebarProps {
  components: UIComponent[];
  selectedId: string;
  onSelectComponent: (id: string) => void;
  selectedCategory: ComponentCategory;
  onSelectCategory: (category: ComponentCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onDeleteCustomComponent: (id: string) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  activeTags?: string[];
  onActiveTagsChange?: (tags: string[]) => void;
  onAddTagToComponent?: (componentId: string, newTag: string) => void;
  onRemoveTagFromComponent?: (componentId: string, tag: string) => void;
}

const categoryIcons: Record<string, React.ReactNode> = {
  all: <FolderCode className="h-3.5 w-3.5" />,
  favorites: <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />,
  cards: <CreditCard className="h-3.5 w-3.5" />,
  buttons: <MousePointerClick className="h-3.5 w-3.5" />,
  inputs: <TextCursorInput className="h-3.5 w-3.5" />,
  feedback: <Bell className="h-3.5 w-3.5" />,
  navigation: <Navigation className="h-3.5 w-3.5" />,
  data: <BarChart2 className="h-3.5 w-3.5" />,
  custom: <Sparkles className="h-3.5 w-3.5" />,
};

const categoryLabels: Record<ComponentCategory, string> = {
  all: 'Todos',
  favorites: 'Favoritos',
  cards: 'Tarjetas',
  buttons: 'Botones',
  inputs: 'Inputs',
  feedback: 'Feedback',
  navigation: 'Nav',
  data: 'Datos',
  custom: 'Mis Piezas',
};

export function Sidebar({
  components,
  selectedId,
  onSelectComponent,
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  onDeleteCustomComponent,
  favoriteIds = [],
  onToggleFavorite,
  activeTags: controlledActiveTags,
  onActiveTagsChange,
  onAddTagToComponent,
  onRemoveTagFromComponent,
}: SidebarProps) {
  // Internal fallback state if activeTags is not controlled from parent
  const [internalActiveTags, setInternalActiveTags] = useState<string[]>([]);
  const activeTags = controlledActiveTags !== undefined ? controlledActiveTags : internalActiveTags;

  const setActiveTags = (updater: string[] | ((prev: string[]) => string[])) => {
    const nextTags = typeof updater === 'function' ? updater(activeTags) : updater;
    if (onActiveTagsChange) {
      onActiveTagsChange(nextTags);
    } else {
      setInternalActiveTags(nextTags);
    }
  };

  // Keyword filter drawer states
  const [isTagDrawerOpen, setIsTagDrawerOpen] = useState(false);
  const [customKeywordInput, setCustomKeywordInput] = useState('');
  const [tagMatchMode, setTagMatchMode] = useState<'any' | 'all'>('any');

  // Inline tag adder state for component cards
  const [addingTagCompId, setAddingTagCompId] = useState<string | null>(null);
  const [inlineNewTag, setInlineNewTag] = useState('');

  // Pre-indexed fuzzy search instance - rebuilds only when components reference changes
  const fuzzyIndex = useMemo(() => {
    return new ComponentFuzzyIndex(components);
  }, [components]);

  // Fast search lookup powered by the fuzzy index across titles, tags, and descriptions
  // with multi-keyword and category filtering
  const searchResults: FuzzySearchResult[] = useMemo(() => {
    return fuzzyIndex.search(
      searchQuery,
      selectedCategory,
      favoriteIds,
      activeTags,
      tagMatchMode,
    );
  }, [fuzzyIndex, searchQuery, selectedCategory, favoriteIds, activeTags, tagMatchMode]);

  // All unique tags with occurrence counts in current scope
  const allAvailableTags = useMemo(() => {
    return fuzzyIndex.getAllTagsWithCounts(selectedCategory, favoriteIds);
  }, [fuzzyIndex, selectedCategory, favoriteIds]);

  // Top popular tags for quick horizontal discovery chips
  const topPopularTags = useMemo(() => {
    return allAvailableTags.slice(0, 6);
  }, [allAvailableTags]);

  const categories: ComponentCategory[] = [
    'all',
    'favorites',
    'cards',
    'buttons',
    'inputs',
    'feedback',
    'navigation',
    'data',
    'custom',
  ];

  const isSearchActive = Boolean(searchQuery.trim());
  const hasActiveTagFilters = activeTags.length > 0;

  // Toggle single tag filter
  const handleToggleTag = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    setActiveTags((prev) =>
      prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean],
    );
  };

  // Add custom keyword entered by user
  const handleAddCustomKeyword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = customKeywordInput.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    if (!activeTags.includes(clean)) {
      setActiveTags((prev) => [...prev, clean]);
    }
    setCustomKeywordInput('');
  };

  // Clear all active keyword/tag filters
  const handleClearAllTags = () => {
    setActiveTags([]);
  };

  // Inline add tag to a specific component card
  const handleConfirmInlineTag = (componentId: string) => {
    const clean = inlineNewTag.trim().toLowerCase().replace(/^#/, '');
    if (clean && onAddTagToComponent) {
      onAddTagToComponent(componentId, clean);
    }
    setInlineNewTag('');
    setAddingTagCompId(null);
  };

  return (
    <aside
      id="sidebar-panel"
      className="panel-glow flex w-full md:w-80 shrink-0 flex-col border-r border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-sm transition-colors duration-200"
    >
      {/* Search Input Section */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800/80 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
          <input
            id="search-components-input"
            type="text"
            placeholder="Buscar por título, etiquetas o descripción..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 pl-8.5 pr-8 py-1.5 text-xs text-zinc-900 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              title="Limpiar búsqueda"
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Custom Keywords & Tags Filter Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <button
              type="button"
              id="btn-toggle-tag-drawer"
              onClick={() => setIsTagDrawerOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                hasActiveTagFilters || isTagDrawerOpen
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <Tag className="h-3 w-3 text-indigo-500" />
              <span>Palabras Clave</span>
              {hasActiveTagFilters ? (
                <span className="ml-0.5 rounded-full bg-indigo-600 text-white px-1.5 py-0.2 text-[10px] font-bold">
                  {activeTags.length}
                </span>
              ) : (
                <span className="text-[10px] text-zinc-400">({allAvailableTags.length})</span>
              )}
              {isTagDrawerOpen ? (
                <ChevronUp className="h-3 w-3 ml-0.5 opacity-60" />
              ) : (
                <ChevronDown className="h-3 w-3 ml-0.5 opacity-60" />
              )}
            </button>

            {hasActiveTagFilters && (
              <button
                type="button"
                id="btn-clear-tag-filters"
                onClick={handleClearAllTags}
                className="flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30"
                title="Quitar todos los filtros de etiquetas"
              >
                <X className="h-3 w-3" />
                <span>Limpiar tags</span>
              </button>
            )}
          </div>

          {/* Quick horizontal tag chips bar */}
          {topPopularTags.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5 shrink-0">
                <Hash className="h-2.5 w-2.5" />
                Top:
              </span>
              {topPopularTags.map(({ tag, count }) => {
                const isActive = activeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    title={`${isActive ? 'Quitar filtro' : 'Filtrar por'} #${tag} (${count} piezas)`}
                    className={`shrink-0 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 hover:bg-zinc-200/90 dark:bg-zinc-800/80 dark:hover:bg-zinc-700/80 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <span>#{tag}</span>
                    <span
                      className={`text-[9px] px-1 rounded-full ${
                        isActive
                          ? 'bg-indigo-700 text-indigo-100'
                          : 'bg-zinc-200/80 dark:bg-zinc-700/60 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Expandable Custom Keyword & Tag Organizer Panel */}
        <AnimatePresence>
          {isTagDrawerOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-2.5 space-y-2.5"
            >
              {/* Custom Keyword Input Form */}
              <form onSubmit={handleAddCustomKeyword} className="flex gap-1.5">
                <div className="relative flex-1">
                  <Tag className="absolute left-2.5 top-2 h-3 w-3 text-zinc-400" />
                  <input
                    type="text"
                    placeholder="Escribe palabra clave (ej. dark, glow)..."
                    value={customKeywordInput}
                    onChange={(e) => setCustomKeywordInput(e.target.value)}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-7 pr-2 py-1 text-[11px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!customKeywordInput.trim()}
                  className="rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none px-2.5 py-1 text-[11px] font-medium text-white transition-colors cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Filtrar</span>
                </button>
              </form>

              {/* Active Keywords Section with Match Mode */}
              {hasActiveTagFilters && (
                <div className="space-y-1.5 pt-1 border-t border-indigo-100/80 dark:border-indigo-900/40">
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                    <span className="font-semibold text-indigo-900 dark:text-indigo-300">
                      Filtros activos ({activeTags.length}):
                    </span>
                    {activeTags.length > 1 && (
                      <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-0.5 rounded-md border border-zinc-200 dark:border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setTagMatchMode('any')}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                            tagMatchMode === 'any'
                              ? 'bg-indigo-600 text-white'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                          }`}
                        >
                          Cualquiera (OR)
                        </button>
                        <button
                          type="button"
                          onClick={() => setTagMatchMode('all')}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors ${
                            tagMatchMode === 'all'
                              ? 'bg-indigo-600 text-white'
                              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                          }`}
                        >
                          Todas (AND)
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Active tags pills */}
                  <div className="flex flex-wrap gap-1">
                    {activeTags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-md bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-medium shadow-2xs"
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className="hover:bg-indigo-700 rounded p-0.5 cursor-pointer"
                          title={`Quitar ${tag}`}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Complete Tags Catalog Cloud (Filterable via customKeywordInput) */}
              <div className="space-y-1 pt-1 border-t border-indigo-100/80 dark:border-indigo-900/40">
                <div className="flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                  <span>Todas las palabras clave del catálogo:</span>
                </div>
                <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto no-scrollbar pt-0.5">
                  {allAvailableTags
                    .filter(({ tag }) =>
                      customKeywordInput.trim()
                        ? tag.includes(customKeywordInput.trim().toLowerCase())
                        : true,
                    )
                    .map(({ tag, count }) => {
                      const isSelected = activeTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white'
                              : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-indigo-400'
                          }`}
                        >
                          {isSelected && <Check className="h-2.5 w-2.5" />}
                          <span>#{tag}</span>
                          <span
                            className={`text-[9px] px-1 rounded-full ${
                              isSelected
                                ? 'bg-indigo-700 text-indigo-100'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Active Filter Status Bar */}
      {(isSearchActive || hasActiveTagFilters) && (
        <div className="flex items-center justify-between px-3 py-1.5 text-[11px] bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-300">
          <span className="flex items-center gap-1 min-w-0 truncate">
            <Zap className="h-3 w-3 text-indigo-500 shrink-0" />
            <span className="truncate">
              {searchResults.length}{' '}
              {searchResults.length === 1 ? 'coincidencia' : 'coincidencias'}
              {hasActiveTagFilters && (
                <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                  ({activeTags.map((t) => `#${t}`).join(', ')})
                </span>
              )}
            </span>
          </span>
          <div className="flex items-center gap-2 shrink-0">
            {hasActiveTagFilters && (
              <button
                type="button"
                onClick={handleClearAllTags}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Borrar tags
              </button>
            )}
            {isSearchActive && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                Borrar texto
              </button>
            )}
          </div>
        </div>
      )}

      {/* Category Pills */}
      <div className="flex gap-1 overflow-x-auto p-2 border-b border-zinc-200 dark:border-zinc-800/80 no-scrollbar">
        {categories.map((cat) => {
          const count =
            cat === 'all'
              ? components.length
              : cat === 'favorites'
              ? favoriteIds.length
              : cat === 'custom'
              ? components.filter((c) => c.isCustom).length
              : components.filter((c) => c.category === cat).length;

          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              id={`cat-filter-${cat}`}
              type="button"
              onClick={() => onSelectCategory(cat)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                  : 'bg-zinc-100/70 text-zinc-600 hover:bg-zinc-200/80 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
            >
              {categoryIcons[cat]}
              <span>{categoryLabels[cat]}</span>
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.2 text-[9px] font-mono ${
                  isSelected
                    ? 'bg-zinc-700 text-zinc-200 dark:bg-zinc-300 dark:text-zinc-800'
                    : 'bg-zinc-200/80 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Component Cards List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-6 text-center text-xs text-zinc-500 dark:text-zinc-400 space-y-2">
            <SlidersHorizontal className="h-6 w-6 text-zinc-400 dark:text-zinc-600 mb-1" />
            <p className="font-medium text-zinc-700 dark:text-zinc-300">
              No se encontraron piezas
            </p>
            {hasActiveTagFilters && (
              <p className="text-[11px] max-w-xs leading-relaxed">
                Ninguna pieza coincide con las palabras clave:{' '}
                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                  {activeTags.map((t) => `#${t}`).join(', ')}
                </span>
                {tagMatchMode === 'all' && activeTags.length > 1 && (
                  <span className="block mt-1 text-zinc-400">
                    Prueba cambiando el modo a "Cualquiera (OR)".
                  </span>
                )}
              </p>
            )}
            <div className="flex gap-2 pt-2">
              {hasActiveTagFilters && (
                <button
                  type="button"
                  onClick={handleClearAllTags}
                  className="rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  Limpiar palabras clave
                </button>
              )}
              {isSearchActive && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          </div>
        ) : (
          searchResults.map(({ component: comp, matchedTags, matchedIn }) => {
            const isSelected = comp.id === selectedId;
            const isFav = favoriteIds.includes(comp.id);
            const isInlineAddingTag = addingTagCompId === comp.id;

            return (
              <div
                key={comp.id}
                id={`component-item-${comp.id}`}
                onClick={() => onSelectComponent(comp.id)}
                className={`group relative flex flex-col gap-1.5 rounded-xl p-2.5 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 text-indigo-950 dark:text-zinc-100'
                    : 'border border-transparent hover:bg-zinc-100/80 dark:hover:bg-zinc-900/60 hover:border-zinc-200 dark:hover:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`font-mono text-xs font-semibold tracking-tight ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-zinc-900 dark:text-zinc-200'
                      }`}
                    >
                      {comp.name}
                    </span>
                    <span className="font-mono rounded bg-zinc-200/70 dark:bg-zinc-800 px-1 py-0.2 text-[9px] text-zinc-600 dark:text-zinc-400">
                      v{comp.version || '1.0.0'}
                    </span>
                    {comp.isCustom ? (
                      <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-1 py-0.2 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                        Propia
                      </span>
                    ) : (
                      <span className="rounded bg-zinc-100 dark:bg-zinc-800/80 px-1 py-0.2 text-[9px] text-zinc-500 dark:text-zinc-400">
                        {comp.variants.length} var.
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {onToggleFavorite && (
                      <motion.button
                        whileTap={{ scale: 0.8 }}
                        type="button"
                        id={`btn-favorite-${comp.id}`}
                        title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(comp.id);
                        }}
                        className={`p-1 rounded-md transition-all cursor-pointer ${
                          isFav
                            ? 'text-amber-500 dark:text-amber-400 opacity-100 hover:scale-110'
                            : 'text-zinc-400 dark:text-zinc-500 opacity-0 group-hover:opacity-100 hover:text-amber-500 dark:hover:text-amber-400'
                        }`}
                      >
                        <Star
                          className={`h-3.5 w-3.5 transition-colors ${
                            isFav
                              ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_6px_rgba(251,191,36,0.45)]'
                              : 'stroke-[1.8]'
                          }`}
                        />
                      </motion.button>
                    )}

                    {comp.isCustom && (
                      <button
                        type="button"
                        title="Eliminar pieza personalizada"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm(
                              `¿Eliminar "${comp.name}" de tu colección local?`,
                            )
                          ) {
                            onDeleteCustomComponent(comp.id);
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-rose-600 dark:text-zinc-500 dark:hover:text-rose-400 transition-opacity cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Tagline / Description snippet */}
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-snug">
                  {comp.tagline}
                </p>

                {/* Tags & Keyword Badges with Interactive Click-to-Filter & Add Tag */}
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  {comp.tags &&
                    comp.tags.map((tag) => {
                      const isTagActive = activeTags.includes(tag.toLowerCase());
                      const isFuzzyMatched =
                        isSearchActive &&
                        matchedTags &&
                        matchedTags.some((mt) => mt.toLowerCase() === tag.toLowerCase());

                      return (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTag(tag);
                          }}
                          title={`Filtrar componentes con etiqueta #${tag}`}
                          className={`group/tag inline-flex items-center gap-0.5 rounded px-1.5 py-0.2 text-[9px] font-medium transition-all cursor-pointer ${
                            isTagActive
                              ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                              : isFuzzyMatched
                              ? 'bg-indigo-100 dark:bg-indigo-900/70 border border-indigo-200 dark:border-indigo-700 text-indigo-700 dark:text-indigo-300 font-semibold'
                              : 'bg-zinc-100 dark:bg-zinc-800/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                          }`}
                        >
                          #{tag}
                          {onRemoveTagFromComponent && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRemoveTagFromComponent(comp.id, tag);
                              }}
                              title={`Eliminar #${tag} de esta pieza`}
                              className="opacity-0 group-hover/tag:opacity-100 hover:text-rose-600 ml-0.5 p-0.2 cursor-pointer transition-opacity"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          )}
                        </span>
                      );
                    })}

                  {/* Inline quick tag adder button */}
                  {onAddTagToComponent && !isInlineAddingTag && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAddingTagCompId(comp.id);
                        setInlineNewTag('');
                      }}
                      title="Añadir nueva palabra clave a este componente"
                      className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-0.5 rounded px-1 py-0.2 text-[9px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                    >
                      <Plus className="h-2.5 w-2.5" />
                      <span>tag</span>
                    </button>
                  )}

                  {/* Inline input when adding tag to this piece */}
                  {isInlineAddingTag && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded bg-white dark:bg-zinc-900 border border-indigo-400 px-1 py-0.2 shadow-2xs"
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="nuevo tag..."
                        value={inlineNewTag}
                        onChange={(e) => setInlineNewTag(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleConfirmInlineTag(comp.id);
                          } else if (e.key === 'Escape') {
                            setAddingTagCompId(null);
                          }
                        }}
                        className="w-16 text-[9px] bg-transparent text-zinc-800 dark:text-zinc-200 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmInlineTag(comp.id)}
                        className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        <Check className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddingTagCompId(null)}
                        className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}

                  {/* Search description indicator */}
                  {isSearchActive &&
                    matchedIn.description &&
                    !matchedIn.title &&
                    (!matchedTags || matchedTags.length === 0) && (
                      <span className="text-[9px] text-zinc-400 italic">
                        En descripción
                      </span>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
