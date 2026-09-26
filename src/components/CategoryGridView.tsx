import React, { useState } from 'react';
import { Copy, Check, Star, Trash2, ArrowRight } from 'lucide-react';
import { UIComponent } from '../types';
import { InteractiveComponentRenderer } from './InteractiveComponentRenderer';
import { CATEGORY_LABELS } from './libraryCategories';

interface CategoryGridViewProps {
  /** Piezas ya filtradas (categoría, búsqueda y etiquetas) y ordenadas. */
  components: UIComponent[];
  selectedId: string;
  onOpen: (id: string) => void;
  onOpenCompare?: (componentId: string) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
  onDeleteCustomComponent?: (id: string) => void;
  onToast: (msg: string) => void;
  activeTags?: string[];
  onToggleTagFilter?: (tag: string) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
}

const MAX_CARD_TAGS = 3;

/** Cuadrícula de Biblioteca: una ficha por pieza, con su vista previa en vivo arriba. */
export function CategoryGridView({
  components,
  selectedId,
  onOpen,
  onOpenCompare,
  favoriteIds = [],
  onToggleFavorite,
  onDeleteCustomComponent,
  onToast,
  activeTags = [],
  onToggleTagFilter,
  hasFilters,
  onClearFilters,
}: CategoryGridViewProps) {
  const [copiedCompId, setCopiedCompId] = useState<string | null>(null);

  const handleCopySnippet = async (comp: UIComponent) => {
    const snippet = comp.variants[0]?.codeSnippet || comp.usageSnippet;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopiedCompId(comp.id);
      onToast(`Snippet de ${comp.name} copiado`);
      setTimeout(() => setCopiedCompId((prev) => (prev === comp.id ? null : prev)), 2000);
    } catch {
      onToast('No se pudo copiar al portapapeles');
    }
  };

  if (components.length === 0) {
    return (
      <div className="mx-auto my-12 flex max-w-md flex-col items-center gap-4 rounded-[20px] border border-dashed border-zinc-400 dark:border-zinc-600 px-8 py-12 text-center">
        <h2 className="font-display text-[22px] leading-7">Aquí no hay piezas</h2>
        <p className="text-base text-zinc-600 dark:text-zinc-300">
          {hasFilters
            ? 'Ninguna pieza coincide con la búsqueda o las etiquetas.'
            : 'Este filtro todavía no tiene piezas.'}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={onClearFilters}
            className="min-h-11 rounded-full border border-zinc-500 dark:border-zinc-400 px-5 text-base text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Quitar filtros
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="category-grid-workbench" className="grid grid-cols-1 gap-6 lg:grid-cols-2 2xl:grid-cols-3">
      {components.map((comp) => {
        const isSelected = comp.id === selectedId;
        const isFav = favoriteIds.includes(comp.id);
        const isCopied = copiedCompId === comp.id;
        const variantCount = comp.variants.length;

        return (
          <article
            key={comp.id}
            id={`grid-card-${comp.id}`}
            className={`flex flex-col overflow-hidden rounded-[20px] bg-white dark:bg-zinc-900 shadow-[var(--app-shadow-card)] ${
              isSelected ? 'border-2 border-violet-600 dark:border-violet-400' : 'border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {/* Vista previa en vivo */}
            <div className="flex min-h-[200px] items-center justify-center overflow-hidden border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 bg-[radial-gradient(var(--color-zinc-200)_1px,transparent_1px)] dark:bg-[radial-gradient(var(--color-zinc-800)_1px,transparent_1px)] [background-size:18px_18px] p-6">
              <div className="flex w-full items-center justify-center">
                <InteractiveComponentRenderer
                  component={comp}
                  activeVariantProps={comp.variants[0]?.props || {}}
                  onToast={onToast}
                  compact
                />
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-2 px-6 pb-5 pt-5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="min-w-0 font-display text-[22px] leading-7">
                  <button
                    type="button"
                    onClick={() => onOpen(comp.id)}
                    className="truncate text-left text-zinc-900 dark:text-zinc-50 hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer"
                    title="Ver la ficha"
                  >
                    {comp.name}
                  </button>
                </h3>
                {onToggleFavorite && (
                  <button
                    type="button"
                    id={`grid-btn-fav-${comp.id}`}
                    onClick={() => onToggleFavorite(comp.id)}
                    aria-label={isFav ? `Quitar ${comp.name} de favoritas` : `Añadir ${comp.name} a favoritas`}
                    aria-pressed={isFav}
                    className="-mr-3 -mt-2.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <Star
                      className={`h-5 w-5 ${
                        isFav ? 'fill-amber-400 text-zinc-900 dark:text-zinc-50' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    />
                  </button>
                )}
              </div>

              <span className="mono-label text-xs text-zinc-600 dark:text-zinc-300">
                {CATEGORY_LABELS[comp.category]} · {variantCount} {variantCount === 1 ? 'variante' : 'variantes'}
                {comp.isCustom && <span className="text-emerald-600 dark:text-emerald-400"> · Propia</span>}
              </span>

              <p className="line-clamp-2 text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">
                {comp.tagline || comp.description}
              </p>

              {comp.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {comp.tags.slice(0, MAX_CARD_TAGS).map((tag) => {
                    const isActive = activeTags.includes(tag.toLowerCase());
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onToggleTagFilter?.(tag)}
                        aria-pressed={isActive}
                        title={`Filtrar por #${tag}`}
                        className={`rounded-full px-2.5 py-0.5 text-[13px] transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                            : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                  {comp.tags.length > MAX_CARD_TAGS && (
                    <span className="text-[13px] text-zinc-600 dark:text-zinc-300">+{comp.tags.length - MAX_CARD_TAGS}</span>
                  )}
                </div>
              )}

              <div className="mt-auto flex items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    id={`grid-copy-btn-${comp.id}`}
                    onClick={() => handleCopySnippet(comp)}
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    {isCopied ? <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {isCopied ? 'Copiado' : 'JSX'}
                  </button>
                  {onOpenCompare && (
                    <button
                      type="button"
                      id={`grid-compare-btn-${comp.id}`}
                      onClick={() => onOpenCompare(comp.id)}
                      className="inline-flex min-h-10 items-center rounded-full px-3 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      Comparar
                    </button>
                  )}
                  {comp.isCustom && onDeleteCustomComponent && (
                    <button
                      type="button"
                      title="Eliminar pieza propia"
                      aria-label={`Eliminar "${comp.name}"`}
                      onClick={() => {
                        if (confirm(`¿Eliminar "${comp.name}" de tu colección local?`)) {
                          onDeleteCustomComponent(comp.id);
                        }
                      }}
                      className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-700 dark:hover:bg-indigo-950 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  id={`grid-open-focus-btn-${comp.id}`}
                  onClick={() => onOpen(comp.id)}
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-zinc-900 dark:bg-zinc-50 px-4 text-sm font-semibold text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                >
                  Abrir
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
