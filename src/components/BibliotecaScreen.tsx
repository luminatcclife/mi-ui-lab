import React, { useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CanvasBackground, ComponentCategory, UIComponent } from '../types';
import { ComponentFuzzyIndex } from '../utils/fuzzySearchIndex';
import { Sidebar } from './Sidebar';
import { CategoryGridView } from './CategoryGridView';
import { ComponentDetailPanel } from './ComponentDetailPanel';
import { ComparisonView } from './ComparisonView';
import { CATEGORY_LABELS, CATEGORY_TITLES, COLLECTION_FILTERS, TYPE_FILTERS, countForCategory } from './libraryCategories';

type BibliotecaMode = 'grid' | 'detail' | 'compare';

interface BibliotecaScreenProps {
  components: UIComponent[];
  selectedId: string;
  onSelectComponent: (id: string) => void;
  favoriteIds: string[];
  onToggleFavorite: (id: string) => void;
  onDeleteCustomComponent: (id: string) => void;
  activeTags: string[];
  onActiveTagsChange: (tags: string[]) => void;
  onToggleTagFilter: (tag: string) => void;
  onAddTagToComponent: (componentId: string, newTag: string) => void;
  onRemoveTagFromComponent: (componentId: string, tag: string) => void;
  /** Se conserva por compatibilidad; la cuadrícula usa siempre el fondo punteado del sistema. */
  canvasBg?: CanvasBackground;
  onToast: (msg: string) => void;
  onOpenIteration: (comp: UIComponent) => void;
  onEditComponent: (comp: UIComponent) => void;
  onOpenTokens: () => void;
  onOpenExport: () => void;
  onOpenPaletteGenerator: (primaryHex?: string) => void;
  onPlayInPlayground: (componentId: string) => void;
  onNewPiece?: () => void;
  initialMode?: BibliotecaMode;
}

const toolbarBtn =
  'inline-flex min-h-11 items-center rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer';

export function BibliotecaScreen({
  components,
  selectedId,
  onSelectComponent,
  favoriteIds,
  onToggleFavorite,
  onDeleteCustomComponent,
  activeTags,
  onActiveTagsChange,
  onToggleTagFilter,
  onAddTagToComponent,
  onRemoveTagFromComponent,
  onToast,
  onOpenIteration,
  onEditComponent,
  onOpenTokens,
  onOpenExport,
  onOpenPaletteGenerator,
  onPlayInPlayground,
  onNewPiece,
  initialMode = 'grid',
}: BibliotecaScreenProps) {
  const [mode, setMode] = useState<BibliotecaMode>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagMatchMode, setTagMatchMode] = useState<'any' | 'all'>('any');
  const [compareAId, setCompareAId] = useState<string>('accent-card');
  const [compareBId, setCompareBId] = useState<string>(
    components.find((c) => c.id !== 'accent-card')?.id || 'accent-card',
  );

  const selectedComponent = components.find((c) => c.id === selectedId) || components[0];

  // Índice difuso (tolerante a erratas y acentos): se reconstruye solo cuando cambia el catálogo
  const fuzzyIndex = useMemo(() => new ComponentFuzzyIndex(components), [components]);
  const results = useMemo(
    () =>
      fuzzyIndex
        .search(searchQuery, selectedCategory, favoriteIds, activeTags, tagMatchMode)
        .map((r) => r.component),
    [fuzzyIndex, searchQuery, selectedCategory, favoriteIds, activeTags, tagMatchMode],
  );
  const availableTags = useMemo(
    () => fuzzyIndex.getAllTagsWithCounts(selectedCategory, favoriteIds),
    [fuzzyIndex, selectedCategory, favoriteIds],
  );

  const hasFilters = searchQuery.trim() !== '' || activeTags.length > 0;
  const clearFilters = () => {
    setSearchQuery('');
    onActiveTagsChange([]);
  };

  const handleSelectCategory = (cat: ComponentCategory) => {
    setSelectedCategory(cat);
    setMode('grid');
  };

  const handleOpenDetail = (id: string) => {
    onSelectComponent(id);
    setMode('detail');
  };

  const handleOpenCompare = (componentId: string) => {
    setCompareAId(componentId);
    const other = components.find((c) => c.id !== componentId);
    if (other && compareBId === componentId) {
      setCompareBId(other.id);
    }
    setMode('compare');
  };

  const filterSummary = [
    searchQuery.trim() && `«${searchQuery.trim()}»`,
    activeTags.length > 0 && activeTags.map((t) => `#${t}`).join(tagMatchMode === 'all' ? ' y ' : ' o '),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="flex flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Sidebar
        components={components}
        favoriteIds={favoriteIds}
        selectedCategory={selectedCategory}
        onSelectCategory={handleSelectCategory}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          setMode('grid');
        }}
        activeTags={activeTags}
        onActiveTagsChange={(tags) => {
          onActiveTagsChange(tags);
          setMode('grid');
        }}
        tagMatchMode={tagMatchMode}
        onTagMatchModeChange={setTagMatchMode}
        availableTags={availableTags}
      />

      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-6 px-4 pt-8 pb-6 sm:px-8 lg:px-12 lg:pt-10">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            {mode === 'grid' ? (
              <div className="flex flex-col gap-1">
                <h1 className="font-display text-[40px] leading-[46px]">{CATEGORY_TITLES[selectedCategory]}</h1>
                <p className="text-base text-zinc-600 dark:text-zinc-300">
                  {results.length} {results.length === 1 ? 'pieza' : 'piezas'}
                  {filterSummary && (
                    <>
                      {' '}· filtrando por <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{filterSummary}</strong>{' '}
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="ml-1 text-indigo-700 dark:text-indigo-400 underline-offset-2 hover:underline cursor-pointer"
                      >
                        Quitar
                      </button>
                    </>
                  )}
                </p>
              </div>
            ) : (
              <button
                type="button"
                id="biblioteca-btn-back-to-grid"
                onClick={() => setMode('grid')}
                className="inline-flex min-h-11 items-center gap-2 self-start rounded-full pr-3 text-base font-semibold text-zinc-900 dark:text-zinc-50 hover:text-indigo-700 dark:hover:text-indigo-400 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                {CATEGORY_TITLES[selectedCategory]}
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                id="biblioteca-btn-open-tokens"
                onClick={onOpenTokens}
                title="Tokens de diseño y tipografía activa"
                className={toolbarBtn}
              >
                Tokens
              </button>
              <button
                type="button"
                id="biblioteca-btn-open-palette"
                onClick={() => onOpenPaletteGenerator()}
                title="Generar una paleta a partir de un color"
                className={toolbarBtn}
              >
                Paleta
              </button>
              <button
                type="button"
                id="biblioteca-btn-open-compare"
                onClick={() => handleOpenCompare(selectedId)}
                title="Comparar dos piezas lado a lado"
                className={toolbarBtn}
              >
                Comparar
              </button>
              <button
                type="button"
                id="biblioteca-btn-open-export"
                onClick={onOpenExport}
                title="Exportar o importar la colección"
                className={toolbarBtn}
              >
                Exportar
              </button>
              {onNewPiece && (
                <button
                  type="button"
                  id="biblioteca-btn-new-piece"
                  onClick={onNewPiece}
                  className="inline-flex min-h-11 items-center rounded-full bg-indigo-600 px-5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-400 dark:text-zinc-950 dark:hover:bg-indigo-300 cursor-pointer"
                >
                  Nueva pieza
                </button>
              )}
            </div>
          </div>

          {/* En pantallas estrechas la barra lateral se oculta: filtro y búsqueda van aquí */}
          {mode === 'grid' && (
            <div className="flex gap-2 md:hidden">
              <select
                aria-label="Filtro"
                value={selectedCategory}
                onChange={(e) => handleSelectCategory(e.target.value as ComponentCategory)}
                className="h-11 rounded-xl border border-zinc-500 bg-white px-3 text-base dark:border-zinc-400 dark:bg-zinc-900"
              >
                {[...COLLECTION_FILTERS, ...TYPE_FILTERS].map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]} ({countForCategory(cat, components, favoriteIds)})
                  </option>
                ))}
              </select>
              <input
                type="search"
                aria-label="Buscar piezas"
                placeholder="Buscar…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 min-w-0 flex-1 rounded-xl border border-zinc-500 bg-white px-3 text-base dark:border-zinc-400 dark:bg-zinc-900"
              />
            </div>
          )}
        </div>

        <div className="flex-1 px-4 pb-12 sm:px-8 lg:px-12">
          {mode === 'compare' ? (
            <ComparisonView
              components={components}
              initialComponentAId={compareAId}
              initialComponentBId={compareBId}
              onSelectComponentForPlayground={onPlayInPlayground}
              onToast={onToast}
            />
          ) : mode === 'detail' && selectedComponent ? (
            <ComponentDetailPanel
              component={selectedComponent}
              onToast={onToast}
              onOpenIteration={onOpenIteration}
              onEditComponent={onEditComponent}
              onOpenCompare={handleOpenCompare}
              onPlayInPlayground={onPlayInPlayground}
              isFavorite={favoriteIds.includes(selectedComponent.id)}
              onToggleFavorite={onToggleFavorite}
              activeTags={activeTags}
              onToggleTagFilter={onToggleTagFilter}
              onAddTagToComponent={onAddTagToComponent}
              onRemoveTagFromComponent={onRemoveTagFromComponent}
              onOpenPaletteGenerator={onOpenPaletteGenerator}
            />
          ) : (
            <CategoryGridView
              components={results}
              selectedId={selectedId}
              onOpen={handleOpenDetail}
              onOpenCompare={handleOpenCompare}
              favoriteIds={favoriteIds}
              onToggleFavorite={onToggleFavorite}
              onDeleteCustomComponent={onDeleteCustomComponent}
              onToast={onToast}
              activeTags={activeTags}
              onToggleTagFilter={onToggleTagFilter}
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
            />
          )}
        </div>
      </main>
    </div>
  );
}
