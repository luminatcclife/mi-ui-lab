import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import type { AppScreen } from './HomeScreen';

interface HeaderProps {
  screen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  customComponentsCount?: number;
}

const NAV_ITEMS: { screen: AppScreen; label: string }[] = [
  { screen: 'home', label: 'Inicio' },
  { screen: 'biblioteca', label: 'Biblioteca' },
  { screen: 'laboratorio', label: 'Laboratorio' },
  { screen: 'playground', label: 'Playground' },
];

/**
 * Barra global: marca (vuelve a Inicio), navegación entre pantallas y cambio de tema.
 * Cada pantalla trae su propia barra de herramientas con lo que le corresponde.
 */
export function Header({ screen, onNavigate, customComponentsCount = 0 }: HeaderProps) {
  const { theme, toggleTheme, isDark, typographyName } = useTheme();

  return (
    <header
      id="header-nav"
      className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-4 sm:px-8 lg:px-12"
    >
      <button
        type="button"
        id="header-brand-home"
        onClick={() => onNavigate('home')}
        title="Volver a Inicio"
        className="flex shrink-0 items-center gap-3 cursor-pointer"
      >
        <span className="font-display text-[22px] font-semibold text-zinc-900 dark:text-zinc-50">mi-ui-lab</span>
        {customComponentsCount > 0 && (
          <span className="mono-label hidden sm:inline rounded-full bg-emerald-100 dark:bg-emerald-900 px-2.5 py-0.5 text-[11px] text-zinc-900 dark:text-zinc-50">
            +{customComponentsCount} {customComponentsCount === 1 ? 'propia' : 'propias'}
          </span>
        )}
      </button>

      <nav aria-label="Pantallas" className="flex h-full items-stretch gap-4 sm:gap-8 overflow-x-auto">
        {NAV_ITEMS.map((item) => {
          const active = item.screen === screen;
          return (
            <button
              key={item.screen}
              type="button"
              id={`header-nav-${item.screen}`}
              onClick={() => onNavigate(item.screen)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center border-b-2 text-[15px] sm:text-base transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'border-indigo-600 dark:border-indigo-400 font-semibold text-zinc-900 dark:text-zinc-50'
                  : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
              } ${item.screen === 'home' ? 'hidden md:flex' : ''}`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        id="theme-toggle-btn"
        onClick={toggleTheme}
        title={`Tema actual: ${theme === 'dark' ? 'Noche' : 'Papel'}. Tipografía: ${typographyName}. Clic para alternar.`}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-4 text-sm font-semibold text-zinc-900 dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span className="hidden sm:inline">{isDark ? 'Tema papel' : 'Tema noche'}</span>
      </button>
    </header>
  );
}
