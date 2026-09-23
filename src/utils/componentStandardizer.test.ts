import { describe, expect, it } from 'vitest';
import {
  closeVoidElements,
  convertHtmlComments,
  extractSemanticSlots,
  renameAttributesToJsx,
  standardizeToUIComponent,
} from './componentStandardizer';

describe('HTML -> JSX transforms', () => {
  it('renames kebab-case SVG attributes to camelCase', () => {
    expect(renameAttributesToJsx('<path stroke-width="2" fill-rule="evenodd">')).toBe(
      '<path strokeWidth="2" fillRule="evenodd">',
    );
  });

  it('converts HTML comments to JSX comments', () => {
    expect(convertHtmlComments('<div><!-- Dropdown --></div>')).toBe('<div>{/* Dropdown */}</div>');
  });

  it('self-closes void elements and leaves well-formed ones alone', () => {
    expect(closeVoidElements('<input type="text"><br />')).toBe('<input type="text" /><br />');
    expect(closeVoidElements('<img alt="a > b" src="x">')).toBe('<img alt="a > b" src="x" />');
  });
});

describe('extractSemanticSlots', () => {
  it('picks the heading as title and button text as action', () => {
    const slots = extractSemanticSlots('<div><h3>Plan Pro</h3><p>Todo incluido</p><button>Comprar</button></div>');
    expect(slots.title).toBe('Plan Pro');
    expect(slots.actionLabel).toBe('Comprar');
  });
});

describe('standardizeToUIComponent', () => {
  const html = '<div class="p-4 rounded-xl"><h3 class="font-bold">Hola</h3><label for="x">X</label><button>Ir</button></div>';
  const { component } = standardizeToUIComponent({
    name: 'Tarjeta Hola',
    category: 'cards',
    tagline: 't',
    description: 'd',
    rawHtml: html,
    tokens: ['p-4'],
  });

  it('builds a custom UIComponent that keeps the raw HTML', () => {
    expect(component.isCustom).toBe(true);
    expect(component.category).toBe('cards');
    expect(component.rawHtml).toBe(html);
    expect(component.variants.length).toBeGreaterThan(0);
  });

  it('generates TSX with JSX attribute names', () => {
    expect(component.sourceCode).toContain('className="p-4 rounded-xl"');
    expect(component.sourceCode).toContain('htmlFor="x"');
    expect(component.sourceCode).not.toMatch(/\sclass="/);
  });
});
