import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';

// Habilita act() fuera de un runner de React Testing Library
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function Bomb({ explode }: { explode: boolean }) {
  if (explode) throw new Error('boom');
  return <p>ok</p>;
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const render = (explode: boolean, key = 'a') =>
  act(() =>
    root.render(
      <div>
        <ErrorBoundary resetKeys={[key]} fallback={(e, reset) => <button onClick={reset}>fallo: {e.message}</button>}>
          <Bomb explode={explode} />
        </ErrorBoundary>
        <span>vecino</span>
      </div>,
    ),
  );

describe('ErrorBoundary', () => {
  it('renders children when nothing throws', () => {
    render(false);
    expect(container.textContent).toContain('ok');
  });

  it('contains a render error and keeps siblings alive', () => {
    render(true);
    expect(container.textContent).toContain('fallo: boom');
    expect(container.textContent).toContain('vecino');
  });

  it('recovers via reset once the cause is gone', () => {
    render(true);
    render(false); // mismo resetKey: sigue mostrando el fallback
    expect(container.textContent).toContain('fallo: boom');
    act(() => container.querySelector('button')!.click());
    expect(container.textContent).toContain('ok');
  });

  it('resets automatically when resetKeys change', () => {
    render(true, 'a');
    render(false, 'b');
    expect(container.textContent).toContain('ok');
  });
});
