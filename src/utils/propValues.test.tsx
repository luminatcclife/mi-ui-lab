import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { readArray, readBool, readOneOf, readString, errorMessage, PropValues } from './propValues';
import { validateImportedCollection } from './validateImport';
import { InteractiveComponentRenderer } from '../components/InteractiveComponentRenderer';
import { ThemeProvider } from '../context/ThemeContext';
import { INITIAL_COMPONENTS } from '../data/initialComponents';
import { UIComponent } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('accessors', () => {
  it('read only the expected type, falling back otherwise', () => {
    expect(readString('a')).toBe('a');
    expect(readString(3)).toBe('3');
    expect(readString({})).toBeUndefined();
    expect(readBool('true', false)).toBe(false);
    expect(readBool(true, false)).toBe(true);
    expect(readOneOf('glow', ['default', 'glow'] as const, 'default')).toBe('glow');
    expect(readOneOf('"><script>', ['default', 'glow'] as const, 'default')).toBe('default');
    expect(readArray([1, 'a', 2], (x) => (typeof x === 'number' ? x : undefined))).toEqual([1, 2]);
    expect(readArray('no', () => 1)).toBeUndefined();
    expect(errorMessage(new Error('x'), 'f')).toBe('x');
    expect(errorMessage('raro', 'f')).toBe('f');
  });
});

function render(node: React.ReactNode) {
  const container = document.createElement('div');
  const root = createRoot(container);
  act(() => root.render(<ThemeProvider>{node}</ThemeProvider>));
  return { container, unmount: () => act(() => root.unmount()) };
}

describe('built-in pieces with corrupt props', () => {
  // Cada prop con un tipo que el componente no espera (objetos donde va texto, etc.)
  const corrupt: PropValues = {
    title: { x: 1 }, label: ['a'], subtitle: 5, badge: true, message: { m: 1 }, description: [1],
    variant: 'no-existe', status: 42, type: null, checked: 'sí', withDot: 'no', loading: 'x',
    options: [{ id: 1 }, 'x', { id: 'ok', label: 'OK' }], steps: [{ title: {} }, 'x'], trend: 'up',
    value: { v: 1 }, placeholder: false, accentColor: 'no-es-un-color',
  };

  it.each(INITIAL_COMPONENTS.map((c) => [c.id, c] as const))('%s falls back to defaults instead of crashing', (_id, comp) => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container, unmount } = render(<InteractiveComponentRenderer component={comp} activeVariantProps={corrupt} />);
    expect(container.querySelector('[role="alert"]')).toBeNull();
    expect(errorSpy).not.toHaveBeenCalled();
    unmount();
    errorSpy.mockRestore();
  });
});

describe('captured pieces', () => {
  it('never interpolate an unknown accentColor into the sandbox document', () => {
    const comp: UIComponent = {
      id: 'c', name: 'C', tagline: '', description: '', category: 'cards', sourceCode: '', usageSnippet: '',
      variants: [], props: [], tokensUsed: [], tags: [], isCustom: true, rawHtml: '<p>hola</p>',
    };
    const payload = '"><img src=x onerror=alert(1)>';
    const { container, unmount } = render(
      <InteractiveComponentRenderer component={comp} activeVariantProps={{ variant: 'glow', accentColor: payload }} />,
    );
    const srcDoc = container.querySelector('iframe')?.getAttribute('srcdoc') ?? '';
    expect(srcDoc).toContain('<p>hola</p>');
    expect(srcDoc).not.toContain('onerror');
    expect(srcDoc).toContain('border-indigo-500/40'); // cae al tono por defecto
    unmount();
  });
});

describe('import keeps only JSON prop values', () => {
  it('drops non-JSON and non-finite values from variant props', () => {
    const [c] = validateImportedCollection(
      [{ id: 'p', name: 'P', variants: [{ id: 'v', props: { a: 'x', n: Infinity, nested: { ok: [1, 'b'] } } }] }],
      new Set(),
    ).valid;
    expect(c.variants[0].props).toEqual({ a: 'x', nested: { ok: [1, 'b'] } });
  });
});
