import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  History,
  RotateCcw,
  Check,
  Clock,
  Trash2,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ComponentConfigSnapshot } from '../types';

interface LocalHistoryControlProps {
  history: ComponentConfigSnapshot[];
  currentIndex: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onJumpTo: (index: number) => void;
  onResetToInitial: () => void;
  onClearHistory: () => void;
}

export function LocalHistoryControl({
  history,
  currentIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onJumpTo,
  onResetToInitial,
  onClearHistory,
}: LocalHistoryControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const currentSnapshot = history[currentIndex];
  const hasModifications = currentIndex > 0 || history.length > 1;

  const formatTime = (ts: number) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      ref={containerRef}
      id="local-history-container"
      className="relative flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/80 text-xs shadow-xs select-none"
    >
      {/* Undo Button */}
      <button
        type="button"
        id="btn-undo-history"
        onClick={onUndo}
        disabled={!canUndo}
        title={
          canUndo
            ? `Deshacer: ${history[currentIndex]?.actionLabel || ''} (Ctrl+Z / ⌘Z)`
            : 'Nada que deshacer'
        }
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium transition-colors cursor-pointer ${
          canUndo
            ? 'text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400'
            : 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
        }`}
      >
        <Undo2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-[11px]">Deshacer</span>
      </button>

      {/* Redo Button */}
      <button
        type="button"
        id="btn-redo-history"
        onClick={onRedo}
        disabled={!canRedo}
        title={
          canRedo
            ? `Rehacer: ${history[currentIndex + 1]?.actionLabel || ''} (Ctrl+Y / ⌘⇧Z)`
            : 'Nada que rehacer'
        }
        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 font-medium transition-colors cursor-pointer ${
          canRedo
            ? 'text-zinc-700 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400'
            : 'text-zinc-400 dark:text-zinc-600 cursor-not-allowed opacity-50'
        }`}
      >
        <Redo2 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline text-[11px]">Rehacer</span>
      </button>

      <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-700 mx-0.5" />

      {/* History Menu Dropdown Trigger */}
      <button
        type="button"
        id="btn-local-history-menu"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium transition-colors cursor-pointer ${
          isOpen
            ? 'bg-indigo-600 text-white shadow-xs'
            : hasModifications
            ? 'text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-zinc-700'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-white dark:hover:bg-zinc-700'
        }`}
        title="Ver historial local de cambios realizados en esta sesión"
      >
        <History className="h-3.5 w-3.5" />
        <span className="text-[11px] font-mono">
          Paso {currentIndex + 1}/{history.length}
        </span>
        <ChevronDown
          className={`h-3 w-3 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          id="local-history-dropdown-panel"
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-4 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-1.5">
                <History className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                  Historial Local de Sesión
                </h4>
              </div>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                Deshaz, rehaz o salta a cualquier configuración previa
              </p>
            </div>
            <span className="font-mono text-[10px] rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-zinc-600 dark:text-zinc-400">
              {history.length} estados
            </span>
          </div>

          {/* Shortcut Banner */}
          <div className="mt-2.5 mb-3 flex items-center justify-between rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/80 px-2.5 py-1.5 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
            <span>Atajos de teclado:</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              ⌘Z Deshacer · ⌘⇧Z / ⌘Y Rehacer
            </span>
          </div>

          {/* Snapshots List */}
          <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
            {history.map((item, idx) => {
              const isActive = idx === currentIndex;
              const isPast = idx < currentIndex;
              const isFuture = idx > currentIndex;

              const overrideKeys = Object.keys(item.propOverrides || {});

              return (
                <button
                  key={item.id || `${item.timestamp}-${idx}`}
                  type="button"
                  onClick={() => {
                    onJumpTo(idx);
                  }}
                  className={`w-full text-left rounded-xl p-2.5 transition-all cursor-pointer flex items-start justify-between gap-2 border ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-500/50 text-indigo-950 dark:text-indigo-200 shadow-xs'
                      : isPast
                      ? 'bg-zinc-50/70 dark:bg-zinc-950/40 border-zinc-200/70 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                      : 'bg-transparent border-transparent opacity-60 hover:opacity-100 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/40'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div
                      className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isActive
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : isPast
                          ? 'border-zinc-400 dark:border-zinc-600 text-zinc-500'
                          : 'border-zinc-300 dark:border-zinc-700'
                      }`}
                    >
                      {isActive && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">
                          {item.actionLabel}
                        </span>
                        {isActive && (
                          <span className="rounded bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2">
                            Actual
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-zinc-400">
                        <span className="font-mono">
                          Var: {item.selectedVariantId}
                        </span>
                        <span>·</span>
                        <span className="font-mono">Tono: {item.accentColor}</span>
                        {overrideKeys.length > 0 && (
                          <>
                            <span>·</span>
                            <span className="text-indigo-500 font-medium">
                              {overrideKeys.length} prop(s)
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                    {formatTime(item.timestamp)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <button
              type="button"
              id="btn-reset-history"
              onClick={() => {
                onResetToInitial();
                setIsOpen(false);
              }}
              disabled={!hasModifications}
              className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                hasModifications
                  ? 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400'
                  : 'text-zinc-400 dark:text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="h-3 w-3" />
              <span>Restablecer inicial</span>
            </button>

            <button
              type="button"
              id="btn-clear-history"
              onClick={() => {
                onClearHistory();
                setIsOpen(false);
              }}
              disabled={history.length <= 1}
              className={`inline-flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                history.length > 1
                  ? 'text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                  : 'text-zinc-400 dark:text-zinc-600 opacity-50 cursor-not-allowed'
              }`}
            >
              <Trash2 className="h-3 w-3" />
              <span>Limpiar historial</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
