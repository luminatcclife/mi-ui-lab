import React from 'react';
import {
  Layers,
  Palette,
  Plus,
  Download,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Grid,
  LayoutGrid,
  Square,
  Sun,
  Moon,
  FlaskConical,
  BookOpen,
  ArrowLeftRight,
  Sparkles,
  Sliders,
} from 'lucide-react';
import { CanvasBackground, ViewportMode, UIComponent } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SearchBar } from './SearchBar';

export type AppViewMode = 'playground' | 'docs' | 'compare';

interface HeaderProps {
  activeView: AppViewMode;
  onViewChange: (view: AppViewMode) => void;
  components: UIComponent[];
  onSelectComponent: (id: string) => void;
  viewportMode: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  canvasBg: CanvasBackground;
  onCanvasBgChange: (bg: CanvasBackground) => void;
  onOpenNewComponent: () => void;
  onOpenTokens: () => void;
  onOpenExport: () => void;
  totalComponents: number;
  customComponentsCount: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  favoriteIds?: string[];
  playgroundLayout?: 'focus' | 'grid';
  onPlaygroundLayoutChange?: (layout: 'focus' | 'grid') => void;
  onOpenPaletteGenerator?: () => void;
  onOpenInspector?: () => void;
}

export function Header({
  activeView,
  onViewChange,
  components,
  onSelectComponent,
  viewportMode,
  onViewportChange,
  canvasBg,
  onCanvasBgChange,
  onOpenNewComponent,
  onOpenTokens,
  onOpenExport,
  totalComponents,
  customComponentsCount,
  searchQuery,
  onSearchChange,
  favoriteIds,
  playgroundLayout = 'focus',
  onPlaygroundLayoutChange,
  onOpenPaletteGenerator,
  onOpenInspector,
}: HeaderProps) {
  const { theme, toggleTheme, isDark, typographyName } = useTheme();

  return (
    <header
      id="header-nav"
      className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 dark:border-transparent dark:shadow-[0_1px_0_0_rgba(139,92,246,0.25)] bg-white/90 dark:bg-zinc-950/90 px-3 sm:px-4 backdrop-blur-md transition-colors duration-200"
    >
      {/* Left: Brand & Main View Switcher */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="border-gradient-pill flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-black border border-indigo-500/20 dark:shadow-[0_0_10px_-2px_rgba(139,92,246,0.6)] text-indigo-600 dark:text-emerald-400">
          <Layers className="h-4 w-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-brand-gradient mono-label font-extrabold text-sm tracking-[0.08em]">
              mi-ui-lab
            </span>
            {customComponentsCount > 0 && (
              <span className="glow-dot mono-label rounded-md bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                +{customComponentsCount}
              </span>
            )}
          </div>
        </div>

        {/* View Switcher Tabs: Playground vs Docs */}
        <div className="ml-1 sm:ml-3 flex items-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900/80 p-0.5">
          <button
            type="button"
            id="view-tab-playground"
            onClick={() => onViewChange('playground')}
            className={`mono-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              activeView === 'playground'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <FlaskConical className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Playground</span>
          </button>
          <button
            type="button"
            id="view-tab-docs"
            onClick={() => onViewChange('docs')}
            className={`mono-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              activeView === 'docs'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-indigo-500" />
            <span>Documentación</span>
          </button>
          <button
            type="button"
            id="view-tab-compare"
            onClick={() => onViewChange('compare')}
            className={`mono-label inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-all cursor-pointer ${
              activeView === 'compare'
                ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
            }`}
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-500" />
            <span>Comparar</span>
          </button>
        </div>
      </div>

      {/* Center: Dynamic Search Bar */}
      <div className="mx-2 sm:mx-4 flex-1 max-w-md hidden md:block">
        <SearchBar
          components={components}
          onSelectComponent={(id) => {
            onSelectComponent(id);
            if (activeView === 'docs') {
              const el = document.getElementById(`doc-section-${id}`);
              el?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          onNavigateToDocs={(id) => {
            onSelectComponent(id);
            onViewChange('docs');
            setTimeout(() => {
              const el = document.getElementById(`doc-section-${id}`);
              el?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          currentSearchQuery={searchQuery}
          onSearchChange={onSearchChange}
          favoriteIds={favoriteIds}
        />
      </div>

      {/* Right Controls: Viewport (if playground), Theme Switcher, Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Playground Layout Toggle: Focused (Single) vs Grid (Category) */}
        {activeView === 'playground' && (
          <div className="flex items-center gap-0.5 border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl">
            <button
              type="button"
              id="header-toggle-focus"
              onClick={() => onPlaygroundLayoutChange?.('focus')}
              title="Vista enfocada (inspección detallada de un solo componente)"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                playgroundLayout === 'focus'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <Square className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Enfocada</span>
            </button>
            <button
              type="button"
              id="header-toggle-grid"
              onClick={() => onPlaygroundLayoutChange?.('grid')}
              title="Vista en cuadrícula (todos los componentes de la categoría actual)"
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all cursor-pointer ${
                playgroundLayout === 'grid'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs font-semibold'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
              <span className="hidden sm:inline">Cuadrícula</span>
            </button>
          </div>
        )}

        {/* Viewport switcher (only in playground focus mode) */}
        {activeView === 'playground' && playgroundLayout === 'focus' && (
          <div className="hidden xl:flex items-center gap-1 border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/80 dark:bg-zinc-900/80 p-1 rounded-xl">
            <button
              type="button"
              id="viewport-responsive"
              onClick={() => onViewportChange('responsive')}
              title="Adaptable (100%)"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                viewportMode === 'responsive'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              id="viewport-desktop"
              onClick={() => onViewportChange('desktop')}
              title="Escritorio (1024px)"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                viewportMode === 'desktop'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              id="viewport-tablet"
              onClick={() => onViewportChange('tablet')}
              title="Tablet (768px)"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                viewportMode === 'tablet'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              id="viewport-mobile"
              onClick={() => onViewportChange('mobile')}
              title="Móvil (375px)"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors cursor-pointer ${
                viewportMode === 'mobile'
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Theme Toggle Button (Oscuro / Claro) */}
        <button
          type="button"
          id="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Tema actual: ${theme === 'dark' ? 'Oscuro' : 'Claro'}. Tipografía: ${typographyName}. Clic para alternar.`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-all hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white cursor-pointer shadow-xs"
        >
          {isDark ? (
            <>
              <Sun className="h-3.5 w-3.5 text-amber-400 transition-transform rotate-0 hover:rotate-45" />
              <span className="hidden sm:inline text-[11px]">Tema Claro</span>
            </>
          ) : (
            <>
              <Moon className="h-3.5 w-3.5 text-indigo-600 transition-transform -rotate-12 hover:rotate-0" />
              <span className="hidden sm:inline text-[11px]">Tema Oscuro</span>
            </>
          )}
        </button>

        {/* Generador de Paleta Tailwind */}
        {onOpenPaletteGenerator && (
          <button
            type="button"
            id="btn-open-palette-generator"
            onClick={onOpenPaletteGenerator}
            title="Generador visual de paletas cromáticas y tokens Tailwind"
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/80 dark:bg-indigo-950/40 px-2.5 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 transition-colors hover:bg-indigo-100 dark:hover:bg-indigo-900/60 hover:text-indigo-800 dark:hover:text-indigo-200 cursor-pointer shadow-2xs"
          >
            <Palette className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden md:inline">Paleta</span>
          </button>
        )}

        {/* Inspector de Elementos & HTML */}
        {onOpenInspector && (
          <button
            type="button"
            id="btn-open-element-inspector"
            onClick={onOpenInspector}
            title="Inspector de Elementos: Analizar HTML, Tailwind y estilos computados"
            className="inline-flex items-center gap-1.5 rounded-xl border border-purple-200 dark:border-purple-800/80 bg-purple-50/80 dark:bg-purple-950/40 px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300 transition-colors hover:bg-purple-100 dark:hover:bg-purple-900/60 hover:text-purple-800 dark:hover:text-purple-200 cursor-pointer shadow-2xs"
          >
            <Sliders className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
            <span className="hidden md:inline">Inspector</span>
          </button>
        )}

        {/* Tokens & Typo */}
        <button
          type="button"
          id="btn-open-tokens"
          onClick={onOpenTokens}
          title="Inspeccionar tokens de diseño y tipografía activa"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden lg:inline">Tokens</span>
        </button>

        {/* Export Modal trigger */}
        <button
          type="button"
          id="btn-open-export"
          onClick={onOpenExport}
          title="Exportar colección JSON"
          className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/90 px-2.5 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
        >
          <Download className="h-3.5 w-3.5 text-zinc-400" />
          <span className="hidden xl:inline">Exportar</span>
        </button>

        {/* New Component button */}
        <button
          type="button"
          id="btn-new-component"
          onClick={onOpenNewComponent}
          className="mono-label inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white dark:text-black transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer bg-indigo-600 dark:bg-none dark:[background-image:linear-gradient(90deg,#39ff14,#22d3ee)] dark:shadow-[0_0_16px_-2px_rgba(57,255,20,0.55)]"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Nueva Pieza</span>
          <span className="sm:hidden">Nueva</span>
        </button>
      </div>
    </header>
  );
}
