import React, { useState, useEffect } from 'react';
import { CanvasBackground, UIComponent, ViewportMode, ComponentIteration } from './types';
import { INITIAL_COMPONENTS } from './data/initialComponents';
import { Header } from './components/Header';
import { HomeScreen, AppScreen } from './components/HomeScreen';
import { BibliotecaScreen } from './components/BibliotecaScreen';
import { LaboratorioScreen } from './components/LaboratorioScreen';
import { PlaygroundScreen } from './components/PlaygroundScreen';
import { TokensPanel } from './components/TokensPanel';
import { PaletteGeneratorModal } from './components/PaletteGeneratorModal';
import { IterationModal } from './components/IterationModal';
import { ExportModal } from './components/ExportModal';
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

  const [screen, setScreen] = useState<AppScreen>('home');
  const [bibliotecaInitialMode, setBibliotecaInitialMode] = useState<'grid' | 'detail'>('grid');
  const [selectedId, setSelectedId] = useState<string>('accent-card');
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [viewportMode, setViewportMode] = useState<ViewportMode>('responsive');
  const [canvasBg] = useState<CanvasBackground>('dots');

  // Modals state (Tokens/Paleta/Exportar/Iteración: siguen siendo modales, sin cambios internos)
  const [isTokensOpen, setIsTokensOpen] = useState(false);
  const [isPaletteGeneratorOpen, setIsPaletteGeneratorOpen] = useState(false);
  const [paletteGeneratorInitialHex, setPaletteGeneratorInitialHex] = useState('#6366f1');
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

  // Add new piece (desde Laboratorio: a mano o capturado)
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
  const handleSaveIteration = (updatedComp: UIComponent, _newIteration: ComponentIteration) => {
    const updated = components.map((c) => (c.id === updatedComp.id ? updatedComp : c));
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
      new Set(updatedTags.map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean)),
    );

    const target = components.find((c) => c.id === componentId);
    const updated = components.map((c) => (c.id === componentId ? { ...c, tags: cleaned } : c));

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
        const tagOverrides: Record<string, string[]> = savedOverrides ? JSON.parse(savedOverrides) : {};
        tagOverrides[componentId] = cleaned;
        localStorage.setItem(STORAGE_TAGS_OVERRIDE_KEY, JSON.stringify(tagOverrides));
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
    setActiveTags((prev) => (prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]));
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

  const customCount = components.filter((c) => c.isCustom).length;

  // Navegación entre pantallas
  const handleNavigate = (target: AppScreen) => {
    if (target === 'biblioteca') setBibliotecaInitialMode('grid');
    setScreen(target);
  };

  const handlePlayInPlayground = (componentId: string) => {
    setSelectedId(componentId);
    setScreen('playground');
  };

  const handleViewInBiblioteca = (componentId: string) => {
    setSelectedId(componentId);
    setBibliotecaInitialMode('detail');
    setScreen('biblioteca');
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      <Header onNavigateHome={() => handleNavigate('home')} customComponentsCount={customCount} />

      {screen === 'home' && (
        <HomeScreen
          totalComponents={components.length}
          customCount={customCount}
          favoritesCount={favoriteIds.length}
          onNavigate={handleNavigate}
        />
      )}

      {screen === 'biblioteca' && (
        <BibliotecaScreen
          components={components}
          selectedId={selectedId}
          onSelectComponent={setSelectedId}
          favoriteIds={favoriteIds}
          onToggleFavorite={handleToggleFavorite}
          onDeleteCustomComponent={handleDeleteCustomComponent}
          activeTags={activeTags}
          onActiveTagsChange={setActiveTags}
          onToggleTagFilter={handleToggleTagFilter}
          onAddTagToComponent={handleAddTagToComponent}
          onRemoveTagFromComponent={handleRemoveTagFromComponent}
          canvasBg={canvasBg}
          onToast={showToast}
          onOpenIteration={handleOpenIteration}
          onOpenTokens={() => setIsTokensOpen(true)}
          onOpenExport={() => setIsExportOpen(true)}
          onOpenPaletteGenerator={handleOpenPaletteGenerator}
          onPlayInPlayground={handlePlayInPlayground}
          initialMode={bibliotecaInitialMode}
        />
      )}

      {screen === 'laboratorio' && (
        <LaboratorioScreen
          components={components}
          activeComponent={components.find((c) => c.id === selectedId)}
          onSave={handleAddNewComponent}
          onToast={showToast}
        />
      )}

      {screen === 'playground' && (
        <PlaygroundScreen
          components={components}
          selectedId={selectedId}
          onSelectComponent={setSelectedId}
          viewportMode={viewportMode}
          onViewportChange={setViewportMode}
          canvasBg={canvasBg}
          onToast={showToast}
          isFavorite={favoriteIds.includes(selectedId)}
          onToggleFavorite={handleToggleFavorite}
          onViewInBiblioteca={handleViewInBiblioteca}
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
