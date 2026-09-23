// src/components/ErrorBoundary.tsx
import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Qué mostrar si un hijo lanza al renderizar. Recibe el error y una función para reintentar. */
  fallback: (error: Error, reset: () => void) => React.ReactNode;
  /** Si cambia alguno de estos valores, el boundary se reinicia solo (p. ej. al cambiar de pieza). */
  resetKeys?: unknown[];
  label?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/** Aísla fallos de render: una pieza rota ya no tumba la pantalla (o la app) entera. */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(`[ErrorBoundary${this.props.label ? `: ${this.props.label}` : ''}]`, error, info.componentStack);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (!this.state.error) return;
    const prev = prevProps.resetKeys ?? [];
    const next = this.props.resetKeys ?? [];
    if (prev.length !== next.length || prev.some((v, i) => !Object.is(v, next[i]))) {
      this.reset();
    }
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) return this.props.fallback(this.state.error, this.reset);
    return this.props.children;
  }
}

/** Fallback compacto para una pieza que falla al renderizar. */
export function PieceErrorFallback({ name, error, onRetry }: { name: string; error: Error; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="w-full max-w-sm mx-auto rounded-2xl border border-rose-500/40 bg-rose-50 dark:bg-rose-950/30 p-4 text-xs text-rose-700 dark:text-rose-300"
    >
      <p className="font-semibold">No se pudo renderizar "{name}"</p>
      <p className="mt-1 font-mono text-[11px] opacity-80 break-words">{error.message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-lg border border-rose-500/40 px-2.5 py-1 font-medium hover:bg-rose-500/10 cursor-pointer"
      >
        Reintentar
      </button>
    </div>
  );
}

/** Fallback de pantalla completa: la app sigue navegable aunque una pantalla falle. */
export function ScreenErrorFallback({ error, onRetry, onHome }: { error: Error; onRetry: () => void; onHome: () => void }) {
  return (
    <div role="alert" className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border border-rose-500/30 bg-white dark:bg-zinc-900 p-6 text-sm shadow-xl">
        <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Esta pantalla ha fallado</h2>
        <p className="mt-2 font-mono text-xs text-rose-600 dark:text-rose-400 break-words">{error.message}</p>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          Tus piezas siguen guardadas en IndexedDB. Puedes reintentar o volver al inicio.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 cursor-pointer"
          >
            Reintentar
          </button>
          <button
            type="button"
            onClick={onHome}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
