import React, { useState } from 'react';
import { Search, X, Check, Plus } from 'lucide-react';
import { ComponentCategory, UIComponent } from '../types';
import { CATEGORY_LABELS, COLLECTION_FILTERS, TYPE_FILTERS, countForCategory } from './libraryCategories';

interface SidebarProps {
  components: UIComponent[];
  favoriteIds?: string[];
  selectedCategory: ComponentCategory;
  onSelectCategory: (category: ComponentCategory) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTags: string[];
  onActiveTagsChange: (tags: string[]) => void;
  tagMatchMode: 'any' | 'all';
  onTagMatchModeChange: (mode: 'any' | 'all') => void;
  /** Etiquetas del ámbito actual con cuántas piezas las llevan, de más a menos usadas. */
  availableTags: Array<{ tag: string; count: number }>;
}

const TOP_TAGS = 8;

const cleanTag = (tag: string) => tag.trim().toLowerCase().replace(/^#/, '');

/** Barra lateral de Biblioteca: búsqueda, colección, categorías y etiquetas. Las piezas se ven en la cuadrícula. */
export function Sidebar({
  components,
  favoriteIds = [],
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  activeTags,
  onActiveTagsChange,
  tagMatchMode,
  onTagMatchModeChange,
  availableTags,
}: SidebarProps) {
  const [showAllTags, setShowAllTags] = useState(false);
  const [customKeyword, setCustomKeyword] = useState('');

  const toggleTag = (tag: string) => {
    const clean = cleanTag(tag);
    if (!clean) return;
    onActiveTagsChange(activeTags.includes(clean) ? activeTags.filter((t) => t !== clean) : [...activeTags, clean]);
  };

  const handleAddKeyword = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = cleanTag(customKeyword);
    if (clean && !activeTags.includes(clean)) onActiveTagsChange([...activeTags, clean]);
    setCustomKeyword('');
  };

  // Las activas siempre visibles, aunque no estén entre las más usadas
  const visibleTags = showAllTags
    ? availableTags
    : [
        ...availableTags.filter(({ tag }) => activeTags.includes(tag)),
        ...availableTags.filter(({ tag }) => !activeTags.includes(tag)).slice(0, TOP_TAGS),
      ];
  const extraKeywords = activeTags.filter((t) => !availableTags.some(({ tag }) => tag === t));

  const renderFilter = (cat: ComponentCategory) => {
    const isSelected = selectedCategory === cat;
    return (
      <button
        key={cat}
        id={`cat-filter-${cat}`}
        type="button"
        onClick={() => onSelectCategory(cat)}
        aria-current={isSelected ? 'true' : undefined}
        className={`flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-left text-base transition-colors cursor-pointer ${
          isSelected
            ? 'bg-emerald-100 dark:bg-emerald-900 font-semibold text-zinc-900 dark:text-zinc-50'
            : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
        }`}
      >
        <span>{CATEGORY_LABELS[cat]}</span>
        <span className="text-sm font-normal text-zinc-600 dark:text-zinc-300">
          {countForCategory(cat, components, favoriteIds)}
        </span>
      </button>
    );
  };

  const sectionLabel = 'mono-label px-3 pb-2 text-xs text-zinc-600 dark:text-zinc-300';

  return (
    <aside
      id="sidebar-panel"
      className="hidden md:flex w-72 shrink-0 flex-col gap-8 overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black px-6 py-8"
    >
      <label className="flex flex-col gap-2">
        <span className="mono-label text-xs text-zinc-600 dark:text-zinc-300">Buscar</span>
        <span className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          <input
            id="search-components-input"
            type="text"
            placeholder="Nombre, etiqueta…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 pl-10 pr-9 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              aria-label="Limpiar búsqueda"
              className="absolute right-1 flex h-9 w-9 items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-50 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </span>
      </label>

      <nav aria-label="Filtros de la colección" className="flex flex-col gap-1">
        <span className={sectionLabel}>Colección</span>
        {COLLECTION_FILTERS.map(renderFilter)}
        <span className={`${sectionLabel} pt-6`}>Categorías</span>
        {TYPE_FILTERS.map(renderFilter)}
      </nav>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-3">
          <span className="mono-label text-xs text-zinc-600 dark:text-zinc-300">Etiquetas</span>
          {activeTags.length > 0 && (
            <button
              type="button"
              id="btn-clear-tag-filters"
              onClick={() => onActiveTagsChange([])}
              className="text-sm text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Quitar filtros
            </button>
          )}
        </div>

        {activeTags.length > 1 && (
          <div role="group" aria-label="Cómo combinar etiquetas" className="mx-3 grid grid-cols-2 rounded-xl bg-zinc-200/70 dark:bg-zinc-800 p-1">
            {(
              [
                ['any', 'Cualquiera'],
                ['all', 'Todas'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                aria-pressed={tagMatchMode === mode}
                onClick={() => onTagMatchModeChange(mode)}
                className={`min-h-8 rounded-lg text-sm transition-colors cursor-pointer ${
                  tagMatchMode === mode
                    ? 'bg-white dark:bg-zinc-900 font-semibold text-zinc-900 dark:text-zinc-50 shadow-[var(--app-shadow-card)]'
                    : 'text-zinc-600 dark:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 px-3">
          {[...extraKeywords.map((tag) => ({ tag, count: 0 })), ...visibleTags].map(({ tag, count }) => {
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={isActive}
                title={count ? `${count} ${count === 1 ? 'pieza' : 'piezas'}` : 'Palabra clave'}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer ${
                  isActive
                    ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                    : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'
                }`}
              >
                {isActive && <Check className="h-3.5 w-3.5" />}#{tag}
              </button>
            );
          })}
          {availableTags.length === 0 && extraKeywords.length === 0 && (
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Sin etiquetas en este filtro.</span>
          )}
        </div>

        {availableTags.length > TOP_TAGS && (
          <button
            type="button"
            id="btn-toggle-tag-drawer"
            onClick={() => setShowAllTags((v) => !v)}
            className="self-start px-3 text-sm font-semibold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            {showAllTags ? 'Ver menos' : `Ver las ${availableTags.length}`}
          </button>
        )}

        <form onSubmit={handleAddKeyword} className="mx-3 flex gap-2">
          <input
            type="text"
            aria-label="Filtrar por otra palabra clave"
            placeholder="Otra palabra clave"
            value={customKeyword}
            onChange={(e) => setCustomKeyword(e.target.value)}
            className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3 text-sm text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
          <button
            type="submit"
            disabled={!customKeyword.trim()}
            aria-label="Añadir palabra clave"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-50 disabled:opacity-40 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
          </button>
        </form>
      </div>
    </aside>
  );
}
