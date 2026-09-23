import React, { useState } from 'react';
import { Sparkles, Download, ArrowLeftRight } from 'lucide-react';
import { CanvasBackground, ComponentCategory, UIComponent } from '../types';
import { Sidebar } from './Sidebar';
import { CategoryGridView } from './CategoryGridView';
import { ComponentDetailPanel } from './ComponentDetailPanel';
import { ComparisonView } from './ComparisonView';

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
  canvasBg: CanvasBackground;
  onToast: (msg: string) => void;
  onOpenIteration: (comp: UIComponent) => void;
  onEditComponent: (comp: UIComponent) => void;
  onOpenTokens: () => void;
  onOpenExport: () => void;
  onOpenPaletteGenerator: (primaryHex?: string) => void;
  onPlayInPlayground: (componentId: string) => void;
  initialMode?: BibliotecaMode;
}

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
  canvasBg,
  onToast,
  onOpenIteration,
  onEditComponent,
  onOpenTokens,
  onOpenExport,
  onOpenPaletteGenerator,
  onPlayInPlayground,
  initialMode = 'grid',
}: BibliotecaScreenProps) {
  const [mode, setMode] = useState<BibliotecaMode>(initialMode);
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [compareAId, setCompareAId] = useState<string>('accent-card');
  const [compareBId, setCompareBId] = useState<string>(
    components.find((c) => c.id !== 'accent-card')?.id || 'accent-card',
  );

  const selectedComponent = components.find((c) => c.id === selectedId) || components[0];

  const handleOpenDetail = (id?: string) => {
    if (id) onSelectComponent(id);
    const comp = components.find((c) => c.id === (id || selectedId));
    if (comp && selectedCategory !== 'all' && selectedCategory !== 'favorites' && selectedCategory !== 'custom' && selectedCategory !== comp.category) {
      setSelectedCategory(comp.category);
    }
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

  return (
    <div className="flex flex-1 overflow-hidden">
      <Sidebar
        components={components}
        selectedId={selectedId}
        onSelectComponent={(id) => {
          onSelectComponent(id);
          const comp = components.find((c) => c.id === id);
          if (comp && selectedCategory !== 'all' && selectedCategory !== 'favorites' && selectedCategory !== 'custom' && selectedCategory !== comp.category) {
            setSelectedCategory(comp.category);
          }
          setMode('detail');
        }}
        selectedCategory={selectedCategory}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          setMode('grid');
        }}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onDeleteCustomComponent={onDeleteCustomComponent}
        favoriteIds={favoriteIds}
        onToggleFavorite={onToggleFavorite}
        activeTags={activeTags}
        onActiveTagsChange={onActiveTagsChange}
        onAddTagToComponent={onAddTagToComponent}
        onRemoveTagFromComponent={onRemoveTagFromComponent}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Biblioteca toolbar */}
        <div className="flex items-center justify-end gap-2 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 px-4 py-2 shrink-0">
          <button
            type="button"
            id="biblioteca-btn-open-tokens"
            onClick={onOpenTokens}
            title="Inspeccionar tokens de diseño y tipografía activa"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
            <span>Tokens</span>
          </button>
          <button
            type="button"
            id="biblioteca-btn-open-export"
            onClick={onOpenExport}
            title="Exportar / importar colección"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-zinc-400" />
            <span>Exportar</span>
          </button>
          <button
            type="button"
            id="biblioteca-btn-open-compare"
            onClick={() => handleOpenCompare(selectedId)}
            title="Comparar dos piezas lado a lado"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-500" />
            <span>Comparar</span>
          </button>
        </div>

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
            components={components}
            currentCategory={
              selectedCategory === 'all' && selectedComponent ? selectedComponent.category : selectedCategory
            }
            onSelectCategory={setSelectedCategory}
            selectedId={selectedId}
            onSelectComponent={onSelectComponent}
            onSwitchToFocus={(id) => handleOpenDetail(id)}
            onOpenCompare={handleOpenCompare}
            favoriteIds={favoriteIds}
            onToggleFavorite={onToggleFavorite}
            canvasBg={canvasBg}
            onToast={onToast}
            activeTags={activeTags}
            onToggleTagFilter={onToggleTagFilter}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </div>
    </div>
  );
}
