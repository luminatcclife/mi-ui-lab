import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  Layers,
  Code2,
  BookOpen,
  ArrowRight,
  Sliders,
  Sparkles,
  Star,
} from 'lucide-react';
import { UIComponent } from '../types';

interface SearchResultMatch {
  component: UIComponent;
  matchType: 'name' | 'tag' | 'prop' | 'description' | 'variant' | 'token';
  matchDetail?: string;
}

interface SearchBarProps {
  components: UIComponent[];
  onSelectComponent: (id: string) => void;
  onNavigateToDocs?: (id: string) => void;
  currentSearchQuery?: string;
  onSearchChange?: (query: string) => void;
  favoriteIds?: string[];
}

export function SearchBar({
  components,
  onSelectComponent,
  onNavigateToDocs,
  currentSearchQuery = '',
  onSearchChange,
  favoriteIds,
}: SearchBarProps) {
  const [query, setQuery] = useState(currentSearchQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal query if external query changes
  useEffect(() => {
    setQuery(currentSearchQuery);
  }, [currentSearchQuery]);

  // Handle global shortcut (Cmd/Ctrl + K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (val: string) => {
    setQuery(val);
    onSearchChange?.(val);
    setIsOpen(true);
    setSelectedIndex(0);
  };

  const handleClear = () => {
    setQuery('');
    onSearchChange?.('');
    inputRef.current?.focus();
  };

  // Perform dynamic matching across name, description, props, variants, and tokens
  const trimmedQuery = query.trim().toLowerCase();

  const searchResults: SearchResultMatch[] = React.useMemo(() => {
    if (!trimmedQuery) return [];

    const results: SearchResultMatch[] = [];

    for (const comp of components) {
      const nameMatch = comp.name.toLowerCase().includes(trimmedQuery);
      if (nameMatch) {
        results.push({
          component: comp,
          matchType: 'name',
          matchDetail: comp.name,
        });
        continue;
      }

      // Check tags
      const matchedTag = comp.tags?.find((t) =>
        t.toLowerCase().includes(trimmedQuery),
      );
      if (matchedTag) {
        results.push({
          component: comp,
          matchType: 'tag',
          matchDetail: `#${matchedTag}`,
        });
        continue;
      }

      // Check props
      const matchedProp = comp.props.find(
        (p) =>
          p.name.toLowerCase().includes(trimmedQuery) ||
          p.description.toLowerCase().includes(trimmedQuery) ||
          p.type.toLowerCase().includes(trimmedQuery),
      );
      if (matchedProp) {
        results.push({
          component: comp,
          matchType: 'prop',
          matchDetail: `Prop: ${matchedProp.name} (${matchedProp.type})`,
        });
        continue;
      }

      // Check variants
      const matchedVariant = comp.variants.find(
        (v) =>
          v.name.toLowerCase().includes(trimmedQuery) ||
          v.description.toLowerCase().includes(trimmedQuery),
      );
      if (matchedVariant) {
        results.push({
          component: comp,
          matchType: 'variant',
          matchDetail: `Variante: ${matchedVariant.name}`,
        });
        continue;
      }

      // Check description and tagline
      const descMatch =
        comp.description.toLowerCase().includes(trimmedQuery) ||
        comp.tagline.toLowerCase().includes(trimmedQuery);
      if (descMatch) {
        results.push({
          component: comp,
          matchType: 'description',
          matchDetail: comp.tagline,
        });
        continue;
      }

      // Check tokens
      const matchedToken = comp.tokensUsed.find((t) =>
        t.toLowerCase().includes(trimmedQuery),
      );
      if (matchedToken) {
        results.push({
          component: comp,
          matchType: 'token',
          matchDetail: `Token: ${matchedToken}`,
        });
        continue;
      }
    }

    return results;
  }, [components, trimmedQuery]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(
        (prev) => (prev - 1 + searchResults.length) % searchResults.length,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = searchResults[selectedIndex];
      if (target) {
        onSelectComponent(target.component.id);
        setIsOpen(false);
      }
    }
  };

  const getMatchBadge = (match: SearchResultMatch) => {
    switch (match.matchType) {
      case 'tag':
        return (
          <span className="rounded bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 px-1.5 py-0.5 text-[10px] font-mono text-sky-600 dark:text-sky-400">
            {match.matchDetail}
          </span>
        );
      case 'prop':
        return (
          <span className="rounded bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 px-1.5 py-0.5 text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
            {match.matchDetail}
          </span>
        );
      case 'variant':
        return (
          <span className="rounded bg-violet-500/10 dark:bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400">
            {match.matchDetail}
          </span>
        );
      case 'token':
        return (
          <span className="rounded bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 px-1.5 py-0.5 text-[10px] font-mono text-amber-600 dark:text-amber-400">
            {match.matchDetail}
          </span>
        );
      case 'name':
        return (
          <span className="rounded bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 px-1.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            Coincidencia en Nombre
          </span>
        );
      default:
        return (
          <span className="rounded bg-zinc-500/10 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
            En descripción
          </span>
        );
    }
  };

  const quickFilterTags = [
    { label: 'accentColor', query: 'accentColor' },
    { label: 'variant', query: 'variant' },
    { label: 'loading', query: 'loading' },
    { label: 'metric', query: 'metric' },
    { label: 'tarjetas', query: 'tarjeta' },
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search className="absolute left-3 h-4 w-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          id="global-search-input"
          placeholder="Buscar piezas por nombre, prop (ej: accentColor), tokens..."
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-9 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 pl-9 pr-18 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />

        <div className="absolute right-2.5 flex items-center gap-1.5">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Limpiar búsqueda"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-zinc-200 dark:border-zinc-700/80 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-500 dark:text-zinc-400">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Dynamic Results Dropdown */}
      {isOpen && query.trim() !== '' && (
        <div
          id="search-results-dropdown"
          className="absolute left-0 right-0 top-full mt-2 z-50 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header count indicator */}
          <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800/80">
            <span>
              Resultados dinámicos ({searchResults.length}{' '}
              {searchResults.length === 1 ? 'coincidencia' : 'coincidencias'})
            </span>
            <span className="text-[10px] text-zinc-400">Usa ↑↓ y Enter</span>
          </div>

          <div className="max-h-72 overflow-y-auto py-1 space-y-1">
            {searchResults.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  No se encontraron piezas con el término &ldquo;{query}&rdquo;.
                </p>
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                    Prueba buscando por prop:
                  </span>
                  {quickFilterTags.map((tag) => (
                    <button
                      key={tag.query}
                      type="button"
                      onClick={() => handleInputChange(tag.query)}
                      className="rounded bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-mono text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                    >
                      {tag.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              searchResults.map((result, idx) => {
                const isSelected = idx === selectedIndex;
                const { component } = result;

                return (
                  <div
                    key={`${component.id}-${idx}`}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    onClick={() => {
                      onSelectComponent(component.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start justify-between gap-3 rounded-xl p-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30'
                        : 'border border-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {favoriteIds?.includes(component.id) && (
                          <Star className="h-3 w-3 fill-amber-400 text-amber-500 shrink-0" />
                        )}
                        <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          {component.name}
                        </span>
                        <span className="rounded bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 text-[9px] font-medium text-zinc-600 dark:text-zinc-400">
                          {component.category}
                        </span>
                        {getMatchBadge(result)}
                      </div>

                      <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 leading-snug">
                        {component.tagline}
                      </p>

                      {/* Matching props snippet if prop match */}
                      {result.matchType === 'prop' && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">
                          <Sliders className="h-3 w-3" />
                          <span>{result.matchDetail}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0 self-center">
                      {onNavigateToDocs && (
                        <button
                          type="button"
                          title="Ver en Documentación"
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateToDocs(component.id);
                            setIsOpen(false);
                          }}
                          className="p-1 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-700/60 transition-colors cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <ArrowRight className="h-3.5 w-3.5 text-zinc-400 group-hover:text-indigo-500" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer with suggested search chips */}
          <div className="mt-1 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80 pt-2 px-2">
            <span className="text-[10px] text-zinc-400">Sugerencias:</span>
            <div className="flex items-center gap-1 flex-wrap">
              {quickFilterTags.map((tag) => (
                <button
                  key={tag.query}
                  type="button"
                  onClick={() => handleInputChange(tag.query)}
                  className="rounded bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 text-[10px] font-mono text-zinc-600 dark:text-zinc-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
