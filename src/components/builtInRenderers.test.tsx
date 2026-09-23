import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { describe, expect, it, vi } from 'vitest';
import { BUILT_IN_RENDERERS } from './builtInRenderers';
import { InteractiveComponentRenderer } from './InteractiveComponentRenderer';
import { ThemeProvider } from '../context/ThemeContext';
import { INITIAL_COMPONENTS } from '../data/initialComponents';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe('BUILT_IN_RENDERERS', () => {
  it('has a renderer for every built-in piece, and nothing else', () => {
    expect(Object.keys(BUILT_IN_RENDERERS).sort()).toEqual(INITIAL_COMPONENTS.map((c) => c.id).sort());
  });

  const cases = INITIAL_COMPONENTS.flatMap((comp) =>
    comp.variants.flatMap((variant) =>
      [false, true].map((compact) => ({ comp, variant, compact })),
    ),
  );

  it.each(cases.map((c) => [`${c.comp.id} / ${c.variant.id}${c.compact ? ' (compact)' : ''}`, c] as const))(
    'renders %s without falling back to the error card',
    (_label, { comp, variant, compact }) => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const container = document.createElement('div');
      const root = createRoot(container);
      act(() =>
        root.render(
          <ThemeProvider>
            <InteractiveComponentRenderer component={comp} activeVariantProps={variant.props} compact={compact} />
          </ThemeProvider>,
        ),
      );
      expect(container.querySelector('[role="alert"]')).toBeNull();
      expect(container.textContent?.length).toBeGreaterThan(0);
      expect(errorSpy).not.toHaveBeenCalled();
      act(() => root.unmount());
      errorSpy.mockRestore();
    },
  );
});
