import { describe, expect, it } from 'vitest';
import { inspectElementOrHTML } from './elementInspector';

describe('inspectElementOrHTML (HTML pegado)', () => {
  it('conserva el style inline propio del elemento raíz', () => {
    const sheet = inspectElementOrHTML('<div class="p-4" style="color: red; margin-top: 3px">Hola</div>');
    expect(sheet.cleanHtml).toContain('style="color: red; margin-top: 3px"');
    expect(sheet.attributes.style).toBe('color: red; margin-top: 3px');
  });

  it('no deja rastro del montaje temporal en el HTML ni en el documento', () => {
    const mount = document.createElement('div');
    document.body.appendChild(mount);
    const sheet = inspectElementOrHTML('<button class="px-5 py-2">Ok</button>', mount);
    expect(sheet.cleanHtml).toBe('<button class="px-5 py-2">Ok</button>');
    expect(sheet.cleanHtml).not.toMatch(/data-inspecting-sandbox|visibility|-9999px/);
    expect(mount.childElementCount).toBe(0);
    mount.remove();
  });

  it('agrupa varios elementos raíz en un <div> en vez de quedarse con el primero', () => {
    const sheet = inspectElementOrHTML('<span class="a">uno</span><span class="b">dos</span>');
    expect(sheet.wrappedMultipleRoots).toBe(true);
    expect(sheet.cleanHtml).toBe('<div><span class="a">uno</span><span class="b">dos</span></div>');
  });

  it('no envuelve un único elemento raíz rodeado de espacios', () => {
    const sheet = inspectElementOrHTML('  \n<div class="p-2">x</div>\n  ');
    expect(sheet.wrappedMultipleRoots).toBe(false);
    expect(sheet.cleanHtml).toBe('<div class="p-2">x</div>');
  });

  it('sanea el HTML antes de montarlo', () => {
    const sheet = inspectElementOrHTML('<div><img src="x" onerror="window.__pwned=1">t</div>');
    expect(sheet.cleanHtml).not.toMatch(/onerror/);
  });
});
