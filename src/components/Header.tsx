import React from 'react';
import { Layers, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  onNavigateHome: () => void;
  customComponentsCount?: number;
}

/**
 * Barra global mínima: marca (vuelve a Inicio) + toggle de tema. Cada
 * pantalla (Biblioteca/Laboratorio/Playground) trae su propia barra de
 * herramientas con lo que le corresponde a ella — ver el resto en
 * BibliotecaScreen/LaboratorioScreen/PlaygroundScreen.
 */
export function Header({ onNavigateHome, customComponentsCount = 0 }: HeaderProps) {
  const { theme, toggleTheme, isDark, typographyName } = useTheme();

  return (
    <header
      id="header-nav"
      className="panel-glow sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-zinc-200 dark:border-transparent dark:shadow-[0_1px_0_0_rgba(139,92,246,0.25)] bg-white/90 dark:bg-zinc-950/90 px-3 sm:px-4 backdrop-blur-md transition-colors duration-200"
    >
      <button
        type="button"
        id="header-brand-home"
        onClick={onNavigateHome}
        title="Volver a Inicio"
        className="flex items-center gap-3 shrink-0 cursor-pointer"
      >
        <div className="border-gradient-pill flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/10 dark:bg-black border border-indigo-500/20 dark:shadow-[0_0_10px_-2px_rgba(139,92,246,0.6)] text-indigo-600 dark:text-emerald-400">
          <Layers className="h-4 w-4" />
        </div>
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
      </button>

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
    </header>
  );
}
