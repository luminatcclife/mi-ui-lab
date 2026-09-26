import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useModalA11y } from './useModalA11y';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Modal({ isOpen, onClose, label }: { isOpen: boolean; onClose: () => void; label: string }) {
  const ref = useModalA11y(isOpen, onClose);
  if (!isOpen) return null;
  return (
    <div ref={ref} role="dialog" tabIndex={-1} aria-label={label}>
      <button type="button">{label}</button>
    </div>
  );
}

const pressEscape = () =>
  act(() => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

describe('useModalA11y', () => {
  it('Escape cierra el modal y el foco entra en él al abrir', () => {
    const onClose = vi.fn();
    act(() => root.render(<Modal isOpen onClose={onClose} label="a" />));
    expect(document.activeElement?.getAttribute('role')).toBe('dialog');
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('con dos modales apilados, Escape solo cierra el de arriba', () => {
    const closeBottom = vi.fn();
    const closeTop = vi.fn();
    act(() =>
      root.render(
        <>
          <Modal isOpen onClose={closeBottom} label="abajo" />
          <Modal isOpen onClose={closeTop} label="arriba" />
        </>,
      ),
    );
    pressEscape();
    expect(closeTop).toHaveBeenCalledTimes(1);
    expect(closeBottom).not.toHaveBeenCalled();
  });

  it('cerrado no reacciona y devuelve el foco al elemento que lo abrió', () => {
    const opener = document.createElement('button');
    document.body.appendChild(opener);
    opener.focus();
    const onClose = vi.fn();
    act(() => root.render(<Modal isOpen onClose={onClose} label="a" />));
    expect(document.activeElement).not.toBe(opener);
    act(() => root.render(<Modal isOpen={false} onClose={onClose} label="a" />));
    expect(document.activeElement).toBe(opener);
    pressEscape();
    expect(onClose).not.toHaveBeenCalled();
    opener.remove();
  });
});
