import { describe, expect, it } from 'vitest';
import { sanitizeHtml } from './sanitizeHtml';
import { buildSandboxDocument } from './sandboxDocument';
import { validateImportedCollection } from './validateImport';

describe('sanitizeHtml', () => {
  it('strips scripts, inline handlers and javascript: URLs', () => {
    const out = sanitizeHtml(
      '<div><img src="x" onerror="alert(1)"><a href="javascript:alert(2)">a</a><script>alert(3)</script></div>',
    );
    expect(out).not.toMatch(/onerror|javascript:|<script/i);
  });

  it('drops embeds but keeps their surroundings', () => {
    expect(sanitizeHtml('<p>a</p><iframe src="//evil"></iframe>')).toBe('<p>a</p>');
  });

  it('keeps classes, styles, data-*, aria-* and SVG', () => {
    const html =
      '<button class="px-4 bg-indigo-600" style="color: red;" data-dropdown-toggle="m" aria-expanded="false"><svg viewBox="0 0 24 24"><path d="M0 0h24"></path></svg></button>';
    expect(sanitizeHtml(html)).toBe(html);
  });
});

describe('buildSandboxDocument', () => {
  it('embeds the HTML and only adds the bridge script when requested', () => {
    const plain = buildSandboxDocument({ html: '<p id="x">hola</p>', theme: 'dark' });
    expect(plain).toContain('<p id="x">hola</p>');
    expect(plain).toContain('class="dark"');
    expect(plain).not.toContain('mi-ui-lab-sandbox');

    const bridged = buildSandboxDocument({ html: '<p>hola</p>', theme: 'light', bridge: true });
    expect(bridged).toContain('mi-ui-lab-sandbox');
    expect(bridged).not.toContain('class="dark"');
  });
});

describe('validateImportedCollection', () => {
  const reserved = new Set(['accent-card']);

  it('rejects non-arrays', () => {
    expect(validateImportedCollection({ id: 'a' }, reserved).errors).toHaveLength(1);
  });

  it('skips built-in ids silently and reports invalid items', () => {
    const { valid, errors } = validateImportedCollection(
      [{ id: 'accent-card', name: 'x' }, { id: 'ok', name: 'Ok' }, { name: 'sin id' }, { id: 'bad id!', name: 'x' }, 'str'],
      reserved,
    );
    expect(valid.map((c) => c.id)).toEqual(['ok']);
    expect(errors).toHaveLength(3);
  });

  it('rejects duplicate ids', () => {
    const { valid, errors } = validateImportedCollection([{ id: 'a', name: 'A' }, { id: 'a', name: 'A2' }], reserved);
    expect(valid).toHaveLength(1);
    expect(errors[0]).toMatch(/duplicado/);
  });

  it('normalizes fields, forces isCustom and sanitizes rawHtml', () => {
    const [c] = validateImportedCollection(
      [
        {
          id: 'p1',
          name: 'P1',
          category: 'nope',
          isCustom: false,
          tags: ['#Hola', 42, ' X '],
          variants: [{ id: 'v', props: 'bad' }, { noId: true }],
          rawHtml: '<div onclick="x()">a</div>',
        },
      ],
      reserved,
    ).valid;
    expect(c.category).toBe('custom');
    expect(c.isCustom).toBe(true);
    expect(c.tags).toEqual(['hola', 'x']);
    expect(c.variants).toEqual([{ id: 'v', name: 'v', description: '', props: {}, codeSnippet: '' }]);
    expect(c.rawHtml).toBe('<div>a</div>');
    expect(c.version).toBe('1.0.0');
  });
});
