import { describe, expect, it } from 'vitest';
import { applyComponentEdits, formFromComponent, validateComponentEdit } from './componentEdits';
import { UIComponent } from '../types';

const base: UIComponent = {
  id: 'custom-x-1',
  name: 'X',
  tagline: 't',
  description: 'd',
  category: 'cards',
  sourceCode: 'export function X() {}',
  usageSnippet: '<X />',
  variants: [
    { id: 'default', name: 'Estándar', description: '', props: {}, codeSnippet: '<X />' },
    { id: 'other', name: 'Otra', description: '', props: {}, codeSnippet: '<X glow />' },
  ],
  props: [],
  tokensUsed: ['p-4'],
  tags: ['a'],
  isCustom: true,
  version: '1.2.0',
  versionHistory: [{ version: '1.2.0', date: '2026-01-01', notes: 'n' }],
};

describe('componentEdits', () => {
  it('round-trips a component through the form unchanged', () => {
    expect(applyComponentEdits(base, formFromComponent(base))).toEqual(base);
  });

  it('updates editable fields and keeps identity, version, history and tags', () => {
    const updated = applyComponentEdits(base, {
      ...formFromComponent(base),
      name: '  Nuevo  ',
      category: 'buttons',
      tokensUsed: 'p-2, , rounded-xl ',
      usageSnippet: '<Nuevo />',
    });
    expect(updated).toMatchObject({ id: base.id, name: 'Nuevo', category: 'buttons', version: '1.2.0', tags: ['a'] });
    expect(updated.tokensUsed).toEqual(['p-2', 'rounded-xl']);
    expect(updated.versionHistory).toBe(base.versionHistory);
  });

  it('moves variants that showed the old usage snippet to the new one, leaves the rest', () => {
    const updated = applyComponentEdits(base, { ...formFromComponent(base), usageSnippet: '<Nuevo />' });
    expect(updated.variants.map((v) => v.codeSnippet)).toEqual(['<Nuevo />', '<X glow />']);
  });

  it('sanitizes rawHtml for captured pieces and never adds it to hand-made ones', () => {
    const captured = { ...base, rawHtml: '<div>a</div>' };
    const edited = applyComponentEdits(captured, {
      ...formFromComponent(captured),
      rawHtml: '<div onclick="x()">b<script>1</script></div>',
    });
    expect(edited.rawHtml).toBe('<div>b</div>');
    expect('rawHtml' in applyComponentEdits(base, formFromComponent(base))).toBe(false);
  });

  it('validates name and non-empty captured HTML', () => {
    expect(validateComponentEdit(base, { ...formFromComponent(base), name: '  ' })).toMatch(/nombre/);
    const captured = { ...base, rawHtml: '<div>a</div>' };
    expect(validateComponentEdit(captured, { ...formFromComponent(captured), rawHtml: '<script>x</script>' })).toMatch(/HTML/);
    expect(validateComponentEdit(captured, formFromComponent(captured))).toBeNull();
  });
});
