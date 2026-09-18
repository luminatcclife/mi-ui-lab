import React, { useState, useEffect } from 'react';
import {
  CanvasBackground,
  ComponentCategory,
  UIComponent,
  ViewportMode,
  ComponentIteration,
} from './types';
import { INITIAL_COMPONENTS } from './data/initialComponents';
import { Header, AppViewMode } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { PreviewCanvas } from './components/PreviewCanvas';
import { CategoryGridView } from './components/CategoryGridView';
import { DocumentationView } from './components/DocumentationView';
import { ComparisonView } from './components/ComparisonView';
import { TokensPanel } from './components/TokensPanel';
import { PaletteGeneratorModal } from './components/PaletteGeneratorModal';
import { NewComponentModal } from './components/NewComponentModal';
import { ElementInspectorModal } from './components/ElementInspectorModal';
import { ExportModal } from './components/ExportModal';
import { IterationModal } from './components/IterationModal';
import { ThemeProvider } from './context/ThemeContext';
import {
  loadCatalogFromDB,
  saveCustomComponentToDB,
  deleteCustomComponentFromDB,
  saveTagOverrideToDB,
  saveFavoritesToDB,
  importComponentsToDB,
  resetDBToDefaults,
} from './db/db';

const STORAGE_KEY = 'mi_ui_lab_custom_components';
const STORAGE_FAVORITES_KEY = 'mi_ui_lab_favorite_components';
const STORAGE_TAGS_OVERRIDE_KEY = 'mi_ui_lab_component_tags_overrides';

function MainApp() {
  const [components, setComponents] = useState<UIComponent[]>(() => {
    let base: UIComponent[] = INITIAL_COMPONENTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedCustom: UIComponent[] = JSON.parse(saved);
        base = [...INITIAL_COMPONENTS, ...parsedCustom];
      }
      const savedOverrides = localStorage.getItem(STORAGE_TAGS_OVERRIDE_KEY);
      if (savedOverrides) {
        const tagOverrides: Record<string, string[]> = JSON.parse(savedOverrides);
        base = base.map((c) => {
          if (tagOverrides[c.id]) {
            return { ...c, tags: tagOverrides[c.id] };
          }
          return c;
        });
      }
    } catch (e) {
      console.error('Error loading custom components or tags from localStorage', e);
    }
    return base;
  });

  // Favorite components state persisted in localStorage
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_FAVORITES_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Error loading favorite components from localStorage', e);
    }
    return ['accent-card', 'custom-button'];
  });

  const [activeView, setActiveView] = useState<AppViewMode>('playground');
  const [playgroundLayout, setPlaygroundLayout] = useState<'focus' | 'grid'>('focus');
  const [selectedId, setSelectedId] = useState<string>('accent-card');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [canvasBg, setCanvasBg] = useState<CanvasBackground>('dots');
  const [compareCompAId, setCompareCompAId] = useState<string>('accent-card');
  const [compareCompBId, setCompareCompBId] = useState<string>('notification-callout');

  // Modals state
  const [isTokensOpen, setIsTokensOpen] = useState(false);
  const [isPaletteGeneratorOpen, setIsPaletteGeneratorOpen] = useState(false);
  const [paletteGeneratorInitialHex, setPaletteGeneratorInitialHex] = useState('#6366f1');
  const [isNewComponentOpen, setIsNewComponentOpen] = useState(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isIterationOpen, setIsIterationOpen] = useState(false);
  const [iteratingComponent, setIteratingComponent] = useState<UIComponent | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const handleOpenPaletteGenerator = (hex?: string) => {
    if (hex) {
      setPaletteGeneratorInitialHex(hex);
    }
    setIsPaletteGeneratorOpen(true);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2800);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Hydrate state from Dexie (IndexedDB) with automatic migration from localStorage
  useEffect(() => {
    let isMounted = true;
    loadCatalogFromDB().then((catalog) => {
      if (isMounted) {
        setComponents(catalog.components);
        setFavoriteIds(catalog.favorites);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle favorite status of a component
  const handleToggleFavorite = (componentId: string) => {
    const isFav = favoriteIds.includes(componentId);
    let updated: string[];
    const comp = components.find((c) => c.id === componentId);
    const compName = comp?.name || 'Pieza';

    if (isFav) {
      updated = favoriteIds.filter((id) => id !== componentId);
      showToast(`"${compName}" eliminada de tus favoritos`);
    } else {
      updated = [...favoriteIds, componentId];
      showToast(`★ "${compName}" añadida a tus favoritos`);
    }

    setFavoriteIds(updated);
    saveFavoritesToDB(updated);
    try {
      localStorage.setItem(STORAGE_FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage fallback note', e);
    }
  };

  // Save custom components to Dexie and state
  const saveCustomComponents = (updated: UIComponent[]) => {
    const customOnly = updated.filter((c) => c.isCustom);
    setComponents(updated);

    for (const comp of customOnly) {
      saveCustomComponentToDB(comp);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customOnly));
    } catch (e) {
      console.warn('Storage fallback note', e);
    }
  };

  // Add new piece
  const handleAddNewComponent = (newComp: UIComponent) => {
    const updated = [newComp, ...components];
    setComponents(updated);
    saveCustomComponentToDB(newComp);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.filter((c) => c.isCustom)));
    } catch (e) {}
    setSelectedId(newComp.id);
  };

  // Open iteration modal for a piece
  const handleOpenIteration = (comp: UIComponent) => {
    setIteratingComponent(comp);
    setIsIterationOpen(true);
  };

  // Save new iteration/version of a piece
  const handleSaveIteration = (
    updatedComp: UIComponent,
    _newIteration: ComponentIteration,
  ) => {
    const updated = components.map((c) =>
      c.id === updatedComp.id ? updatedComp : c,
    );
    setComponents(updated);
    saveCustomComponentToDB(updatedComp);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.filter((c) => c.isCustom)));
    } catch (e) {}
  };

  // Delete custom piece
  const handleDeleteCustomComponent = (id: string) => {
    const updated = components.filter((c) => c.id !== id);
    setComponents(updated);
    deleteCustomComponentFromDB(id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.filter((c) => c.isCustom)));
    } catch (e) {}
    if (selectedId === id) {
      setSelectedId('accent-card');
    }
    showToast('Pieza eliminada de la base de datos IndexedDB');
  };

  // Update tags of a component (persists for both custom & built-in components)
  const handleUpdateComponentTags = (componentId: string, updatedTags: string[]) => {
    const cleaned = Array.from(
      new Set(
        updatedTags
          .map((t) => t.trim().toLowerCase().replace(/^#/, ''))
          .filter(Boolean),
      ),
    );

    const target = components.find((c) => c.id === componentId);
    const updated = components.map((c) => {
      if (c.id === componentId) {
        return { ...c, tags: cleaned };
      }
      return c;
    });

    setComponents(updated);

    if (target?.isCustom) {
      saveCustomComponentToDB({ ...target, tags: cleaned });
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.filter((c) => c.isCustom)));
      } catch (e) {}
    } else {
      saveTagOverrideToDB(componentId, cleaned);
      try {
        const savedOverrides = localStorage.getItem(STORAGE_TAGS_OVERRIDE_KEY);
        const tagOverrides: Record<string, string[]> = savedOverrides
          ? JSON.parse(savedOverrides)
          : {};
        tagOverrides[componentId] = cleaned;
        localStorage.setItem(
          STORAGE_TAGS_OVERRIDE_KEY,
          JSON.stringify(tagOverrides),
        );
      } catch (e) {
        console.warn('Storage fallback note', e);
      }
    }
  };

  const handleAddTagToComponent = (componentId: string, newTag: string) => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return;
    const cleanTag = newTag.trim().toLowerCase().replace(/^#/, '');
    if (!cleanTag) return;
    if (comp.tags.includes(cleanTag)) {
      showToast(`El tag #${cleanTag} ya existe en "${comp.name}"`);
      return;
    }
    handleUpdateComponentTags(componentId, [...comp.tags, cleanTag]);
    showToast(`Etiqueta #${cleanTag} añadida a "${comp.name}"`);
  };

  const handleRemoveTagFromComponent = (componentId: string, tagToRemove: string) => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return;
    const cleanTag = tagToRemove.trim().toLowerCase().replace(/^#/, '');
    handleUpdateComponentTags(
      componentId,
      comp.tags.filter((t) => t.toLowerCase() !== cleanTag),
    );
    showToast(`Etiqueta #${cleanTag} eliminada de "${comp.name}"`);
  };

  const handleToggleTagFilter = (tag: string) => {
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    setActiveTags((prev) =>
      prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean],
    );
  };

  // Import external collection
  const handleImportComponents = (imported: UIComponent[]) => {
    const existingIds = new Set(INITIAL_COMPONENTS.map((c) => c.id));
    const newItems = imported.filter((item) => !existingIds.has(item.id));
    const merged = [...INITIAL_COMPONENTS, ...newItems];
    setComponents(merged);
    importComponentsToDB(newItems);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged.filter((c) => c.isCustom)));
    } catch (e) {}
    if (newItems.length > 0) {
      setSelectedId(newItems[0].id);
    }
  };

  // Reset to initial
  const handleResetToDefaults = () => {
    resetDBToDefaults();
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_TAGS_OVERRIDE_KEY);
    } catch (e) {}
    setComponents(INITIAL_COMPONENTS);
    setSelectedId('accent-card');
    showToast('Base de datos restablecida a las piezas base de mi-ui-lab');
  };

  const selectedComponent =
    components.find((c) => c.id === selectedId) || components[0];

  const customCount = components.filter((c) => c.isCustom).length;

  const handleOpenInPlayground = (componentId: string) => {
    setSelectedId(componentId);
    setActiveView('playground');
  };

  const handleOpenCompare = (componentId: string) => {
    setCompareCompAId(componentId);
    const other = components.find((c) => c.id !== componentId);
    if (other && compareCompBId === componentId) {
      setCompareCompBId(other.id);
    }
    setActiveView('compare');
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Header Bar */}
      <Header
        activeView={activeView}
        onViewChange={setActiveView}
        components={components}
        onSelectComponent={setSelectedId}
        viewportMode={viewportMode}
        onViewportChange={setViewportMode}
        canvasBg={canvasBg}
        onCanvasBgChange={setCanvasBg}
        onOpenNewComponent={() => setIsNewComponentOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
        onOpenTokens={() => setIsTokensOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenPaletteGenerator={() => handleOpenPaletteGenerator()}
        totalComponents={components.length}
        customComponentsCount={customCount}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        favoriteIds={favoriteIds}
        playgroundLayout={playgroundLayout}
        onPlaygroundLayoutChange={(layout) => {
          setPlaygroundLayout(layout);
          if (layout === 'grid' && selectedCategory === 'all' && selectedComponent) {
            setSelectedCategory(selectedComponent.category);
          }
        }}
      />

      {/* Main Workspace Area: View Switcher between Playground, Docs, and Compare */}
      {activeView === 'playground' ? (
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            components={components}
            selectedId={selectedId}
            onSelectComponent={(id) => {
              setSelectedId(id);
              const comp = components.find((c) => c.id === id);
              if (
                comp &&
                selectedCategory !== 'all' &&
                selectedCategory !== 'favorites' &&
                selectedCategory !== 'custom' &&
                selectedCategory !== comp.category
              ) {
                setSelectedCategory(comp.category);
              }
            }}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onDeleteCustomComponent={handleDeleteCustomComponent}
            favoriteIds={favoriteIds}
            onToggleFavorite={handleToggleFavorite}
            activeTags={activeTags}
            onActiveTagsChange={setActiveTags}
            onAddTagToComponent={handleAddTagToComponent}
            onRemoveTagFromComponent={handleRemoveTagFromComponent}
          />

          {playgroundLayout === 'grid' ? (
            <CategoryGridView
              components={components}
              currentCategory={
                selectedCategory === 'all' && selectedComponent
                  ? selectedComponent.category
                  : selectedCategory
              }
              onSelectCategory={setSelectedCategory}
              selectedId={selectedId}
              onSelectComponent={setSelectedId}
              onSwitchToFocus={(id) => {
                if (id) setSelectedId(id);
                setPlaygroundLayout('focus');
              }}
              onOpenCompare={handleOpenCompare}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              canvasBg={canvasBg}
              onToast={showToast}
              activeTags={activeTags}
              onToggleTagFilter={handleToggleTagFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          ) : selectedComponent ? (
            <PreviewCanvas
              component={selectedComponent}
              viewportMode={viewportMode}
              canvasBg={canvasBg}
              onToast={showToast}
              onOpenIteration={handleOpenIteration}
              onOpenCompare={handleOpenCompare}
              isFavorite={favoriteIds.includes(selectedComponent.id)}
              onToggleFavorite={handleToggleFavorite}
              activeTags={activeTags}
              onToggleTagFilter={handleToggleTagFilter}
              onAddTagToComponent={handleAddTagToComponent}
              onRemoveTagFromComponent={handleRemoveTagFromComponent}
              onTogglePlaygroundLayout={(layout) => {
                setPlaygroundLayout(layout);
                if (layout === 'grid' && selectedCategory === 'all' && selectedComponent) {
                  setSelectedCategory(selectedComponent.category);
                }
              }}
              categoryComponentCount={
                components.filter((c) => c.category === selectedComponent.category).length
              }
              onOpenPaletteGenerator={handleOpenPaletteGenerator}
              onOpenInspector={() => setIsInspectorOpen(true)}
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-zinc-500 text-sm">
              Selecciona un componente del panel lateral para inspeccionarlo.
            </div>
          )}
        </div>
      ) : activeView === 'docs' ? (
        <DocumentationView
          components={components}
          onOpenInPlayground={handleOpenInPlayground}
          onOpenIteration={handleOpenIteration}
          onOpenCompare={handleOpenCompare}
          onToast={showToast}
          initialSelectedId={selectedId}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
          activeTags={activeTags}
          onToggleTagFilter={handleToggleTagFilter}
        />
      ) : (
        <ComparisonView
          components={components}
          initialComponentAId={compareCompAId}
          initialComponentBId={compareCompBId}
          onSelectComponentForPlayground={handleOpenInPlayground}
          onToast={showToast}
        />
      )}

      {/* Design Tokens Explorer Modal */}
      <TokensPanel
        isOpen={isTokensOpen}
        onClose={() => setIsTokensOpen(false)}
        onToast={showToast}
        onOpenPaletteGenerator={() => handleOpenPaletteGenerator()}
      />

      {/* Visual Color Palette & Token Generator Modal */}
      <PaletteGeneratorModal
        isOpen={isPaletteGeneratorOpen}
        onClose={() => setIsPaletteGeneratorOpen(false)}
        initialPrimaryHex={paletteGeneratorInitialHex}
        onToast={showToast}
      />

      {/* Document New Piece Modal */}
      <NewComponentModal
        isOpen={isNewComponentOpen}
        onClose={() => setIsNewComponentOpen(false)}
        onSave={handleAddNewComponent}
        onToast={showToast}
      />

      {/* Inspector: capturar y estandarizar piezas de fuera de mi-ui-lab */}
      <ElementInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        activeComponent={selectedComponent}
        onSaveComponent={handleAddNewComponent}
        onToast={showToast}
      />

      {/* Version Iteration Modal */}
      {iteratingComponent && (
        <IterationModal
          isOpen={isIterationOpen}
          onClose={() => {
            setIsIterationOpen(false);
            setIteratingComponent(null);
          }}
          component={iteratingComponent}
          onSaveIteration={handleSaveIteration}
          onToast={showToast}
        />
      )}

      {/* Export / Import Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        components={components}
        onImportComponents={handleImportComponents}
        onResetToDefaults={handleResetToDefaults}
        onToast={showToast}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-toast-notification"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl border border-indigo-500/30 dark:border-emerald-500/30 bg-white dark:bg-black/90 px-4 py-2.5 text-xs font-medium text-zinc-900 dark:text-zinc-100 shadow-2xl dark:shadow-[0_0_18px_-4px_rgba(57,255,20,0.4)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <span className="glow-dot h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-mono text-[11px] tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MainApp />
    </ThemeProvider>
  );
}
