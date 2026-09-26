import React from 'react';
import { X } from 'lucide-react';

/** Fondo común de los modales: tinta translúcida, sin desenfoque. */
export const MODAL_OVERLAY_CLASS =
  'fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 dark:bg-black/70 p-3 sm:p-6';

/** Panel del modal: papel, esquinas amplias y borde fino. `maxWidth` es una clase `max-w-*`. */
export function modalPanelClass(maxWidth: string, extra = ''): string {
  return `outline-none relative flex max-h-[90vh] w-full ${maxWidth} flex-col overflow-hidden rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 shadow-[0_24px_48px_-12px_rgba(42,31,26,0.35)] ${extra}`;
}

interface ModalHeaderProps {
  /** Etiqueta corta en mayúsculas sobre el título (máximo tres palabras). */
  caption: string;
  title: React.ReactNode;
  /** id del h2, al que apunta aria-labelledby del diálogo. */
  titleId: string;
  description?: React.ReactNode;
  onClose: () => void;
  closeButtonId?: string;
  /** Contenido extra a la derecha, antes del botón de cerrar. */
  actions?: React.ReactNode;
  /** Elemento visual opcional a la izquierda del título (p. ej. la muestra de color de la paleta). */
  leading?: React.ReactNode;
}

/** Cabecera común de los modales: etiqueta, título en Fraunces, descripción y cerrar. */
export function ModalHeader({ caption, title, titleId, description, onClose, closeButtonId, actions, leading }: ModalHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 sm:px-8">
      <div className="flex min-w-0 items-start gap-4">
        {leading}
        <div className="flex min-w-0 flex-col gap-1">
          <span className="mono-label text-xs text-indigo-700 dark:text-indigo-400">{caption}</span>
          <h2 id={titleId} className="font-display text-[28px] leading-[34px]">
            {title}
          </h2>
          {description && <p className="max-w-2xl text-base leading-[26px] text-zinc-600 dark:text-zinc-300">{description}</p>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        <button
          type="button"
          id={closeButtonId}
          onClick={onClose}
          aria-label="Cerrar"
          title="Cerrar"
          className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-200/70 dark:hover:bg-zinc-800 cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

/** Clases de botón compartidas por los modales. */
export const modalBtn = {
  primary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-400 dark:text-zinc-950 dark:hover:bg-indigo-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
  secondary:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
  ink:
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 text-base font-semibold text-zinc-50 transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
};

/** Campo de formulario de los modales. */
export const modalField =
  'w-full rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2.5 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400';

export const modalLabel = 'mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50';
