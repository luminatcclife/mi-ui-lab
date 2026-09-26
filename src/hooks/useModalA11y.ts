// src/hooks/useModalA11y.ts
// Comportamiento de teclado común a los modales: Escape cierra, el foco entra al abrir, Tab no se escapa
// del modal y, al cerrarlo, el foco vuelve al elemento que lo abrió.
// Los modales pueden apilarse (Tokens abre el generador de paletas encima): solo el de arriba reacciona.

import { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

const openStack: symbol[] = [];

/** Devuelve el ref que hay que poner en el contenedor con role="dialog". */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>(isOpen: boolean, onClose: () => void) {
  const dialogRef = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;
    const id = Symbol('modal');
    openStack.push(id);
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // El foco entra en el contenedor (no en el primer campo, para no abrir teclados ni seleccionar texto)
    dialogRef.current?.focus({ preventScroll: true });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== id) return;
      const dialog = dialogRef.current;
      if (!dialog) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (e.key === 'Tab') {
        const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
          (el) => el.offsetParent !== null || el === document.activeElement,
        );
        if (items.length === 0) {
          e.preventDefault();
          dialog.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && (active === first || active === dialog || !dialog.contains(active))) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && (active === last || !dialog.contains(active))) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const idx = openStack.indexOf(id);
      if (idx !== -1) openStack.splice(idx, 1);
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, [isOpen]);

  return dialogRef;
}
