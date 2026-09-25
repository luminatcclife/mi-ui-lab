import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { CanvasBackground, UIComponent, ViewportMode, ComponentIteration } from './types';
import { Header } from './components/Header';
import { HomeScreen, AppScreen } from './components/HomeScreen';

// Pantallas y modales se cargan bajo demanda: Inicio no necesita el Inspector, el comparador
// ni el generador de paletas, que son la mayor parte del bundle.
const BibliotecaScreen = lazy(() => import('./components/BibliotecaScreen').then((m) => ({ default: m.BibliotecaScreen })));
const LaboratorioScreen = lazy(() => import('./components/LaboratorioScreen').then((m) => ({ default: m.LaboratorioScreen })));
const PlaygroundScreen = lazy(() => import('./components/PlaygroundScreen').then((m) => ({ default: m.PlaygroundScreen })));
const TokensPanel = lazy(() => import('./components/TokensPanel').then((m) => ({ default: m.TokensPanel })));
const PaletteGeneratorModal = lazy(() => import('./components/PaletteGeneratorModal').then((m) => ({ default: m.PaletteGeneratorModal })));
const IterationModal = lazy(() => import('./components/IterationModal').then((m) => ({ default: m.IterationModal })));
const EditComponentModal = lazy(() => import('./components/EditComponentModal').then((m) => ({ default: m.EditComponentModal })));
const ExportModal = lazy(() => import('./components/ExportModal').then((m) => ({ default: m.ExportModal })));

/** true desde la primera vez que `flag` es true: el modal se carga al abrirlo y luego queda montado (conserva su estado). */
function useLoadedOnce(flag: boolean): boolean {
  const [loaded, setLoaded] = useState(flag);
  if (flag && !loaded) setLoaded(true);
  return loaded;
}

function ScreenLoading() {
  return (
    <div className="flex flex-1 items-center justify-center text-xs font-mono text-zinc-500" role="status">
      Cargando…
    </div>
  );
}
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary, ScreenErrorFallback } from './components/ErrorBoundary';
import { useCatalog, normalizeTag } from './hooks/useCatalog';

function MainApp() {
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
  const [backupKey, setBackupKey] = useState(0);
  const [isIterationOpen, setIsIterationOpen] = useState(false);
  const [iteratingComponent, setIteratingComponent] = useState<UIComponent | null>(null);
  const [editingComponent, setEditingComponent] = useState<UIComponent | null>(null);
  const tokensLoaded = useLoadedOnce(isTokensOpen);
  const paletteLoaded = useLoadedOnce(isPaletteGeneratorOpen);
  const exportLoaded = useLoadedOnce(isExportOpen);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const catalog = useCatalog(showToast);
  const { components, favoriteIds } = catalog;

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

  // Toggle favorite status of a component
  const handleToggleFavorite = (componentId: string) => {
    const compName = components.find((c) => c.id === componentId)?.name || 'Pieza';
    const nowFavorite = catalog.toggleFavorite(componentId);
    showToast(
      nowFavorite ? `★ "${compName}" añadida a tus favoritos` : `"${compName}" eliminada de tus favoritos`,
    );
  };

  // Add new piece (desde Laboratorio: a mano o capturado)
  const handleAddNewComponent = (newComp: UIComponent) => {
    catalog.addComponent(newComp);
    setSelectedId(newComp.id);
  };

  // Open iteration modal for a piece
  const handleOpenIteration = (comp: UIComponent) => {
    setIteratingComponent(comp);
    setIsIterationOpen(true);
  };

  // Save new iteration/version of a piece
  const handleSaveIteration = (updatedComp: UIComponent, _newIteration: ComponentIteration) => {
    catalog.updateComponent(updatedComp);
  };

  // Delete custom piece
  const handleDeleteCustomComponent = (id: string) => {
    catalog.deleteComponent(id);
    if (selectedId === id) {
      setSelectedId('accent-card');
    }
    showToast('Pieza eliminada de la base de datos IndexedDB');
  };

  const handleAddTagToComponent = (componentId: string, newTag: string) => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return;
    const cleanTag = normalizeTag(newTag);
    if (!cleanTag) return;
    if (comp.tags.includes(cleanTag)) {
      showToast(`El tag #${cleanTag} ya existe en "${comp.name}"`);
      return;
    }
    catalog.setTags(componentId, [...comp.tags, cleanTag]);
    showToast(`Etiqueta #${cleanTag} añadida a "${comp.name}"`);
  };

  const handleRemoveTagFromComponent = (componentId: string, tagToRemove: string) => {
    const comp = components.find((c) => c.id === componentId);
    if (!comp) return;
    const cleanTag = normalizeTag(tagToRemove);
    catalog.setTags(
      componentId,
      comp.tags.filter((t) => t.toLowerCase() !== cleanTag),
    );
    showToast(`Etiqueta #${cleanTag} eliminada de "${comp.name}"`);
  };

  const handleToggleTagFilter = (tag: string) => {
    const clean = normalizeTag(tag);
    if (!clean) return;
    setActiveTags((prev) => (prev.includes(clean) ? prev.filter((t) => t !== clean) : [...prev, clean]));
  };

  // Import external collection (ya validada en ExportModal)
  const handleImportComponents = (imported: UIComponent[]) => {
    const added = catalog.importComponents(imported);
    if (added.length > 0) {
      setSelectedId(added[0].id);
    }
  };

  // Reset to initial
  const handleResetToDefaults = () => {
    catalog.resetToDefaults();
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

      <ErrorBoundary
        label={`screen:${screen}`}
        resetKeys={[screen]}
        fallback={(error, reset) => (
          <ScreenErrorFallback
            error={error}
            onRetry={reset}
            onHome={() => {
              reset();
              handleNavigate('home');
            }}
          />
        )}
      >
        {/* Hasta que IndexedDB carga no se muestra ninguna pantalla: así ninguna acción del usuario
            opera sobre el catálogo base y luego queda pisada por la hidratación. */}
        {!catalog.isHydrated ? (
          <ScreenLoading />
        ) : (
        <Suspense fallback={<ScreenLoading />}>
        {screen === 'home' && (
          <HomeScreen
            totalComponents={components.length}
            customCount={customCount}
            favoritesCount={favoriteIds.length}
            onNavigate={handleNavigate}
            onExport={() => setIsExportOpen(true)}
            backupKey={backupKey}
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
          onEditComponent={setEditingComponent}
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
        </Suspense>
        )}
      </ErrorBoundary>

      {/* Modales (lazy). Si su chunk no carga, el fallo queda aislado aquí. */}
      <ErrorBoundary label="modals" fallback={() => null}>
      <Suspense fallback={null}>
      {/* Design Tokens Explorer Modal */}
      {tokensLoaded && (
      <TokensPanel
        isOpen={isTokensOpen}
        onClose={() => setIsTokensOpen(false)}
        onToast={showToast}
        onOpenPaletteGenerator={() => handleOpenPaletteGenerator()}
      />
      )}

      {/* Visual Color Palette & Token Generator Modal */}
      {paletteLoaded && (
      <PaletteGeneratorModal
        isOpen={isPaletteGeneratorOpen}
        onClose={() => setIsPaletteGeneratorOpen(false)}
        initialPrimaryHex={paletteGeneratorInitialHex}
        onToast={showToast}
      />
      )}

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

      {/* Edit custom piece Modal (se desmonta al cerrar: cada apertura parte de la pieza actual) */}
      {editingComponent && (
        <EditComponentModal
          component={editingComponent}
          onClose={() => setEditingComponent(null)}
          onSave={catalog.updateComponent}
          onToast={showToast}
        />
      )}

      {/* Export / Import Modal */}
      {exportLoaded && (
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        components={components}
        onImportComponents={handleImportComponents}
        onResetToDefaults={handleResetToDefaults}
        onToast={showToast}
        onExported={() => setBackupKey((k) => k + 1)}
      />
      )}
      </Suspense>
      </ErrorBoundary>

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
      <ErrorBoundary
        label="app"
        fallback={(error) => (
          <div role="alert" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 style={{ fontSize: 18, fontWeight: 700 }}>mi-ui-lab ha fallado</h1>
            <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#e11d48' }}>{error.message}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Recargar
            </button>
          </div>
        )}
      >
        <MainApp />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
