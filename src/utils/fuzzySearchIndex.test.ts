import { describe, expect, it } from 'vitest';
import { ComponentFuzzyIndex, fuzzyMatchWord, normalizeText, tokenizeText } from './fuzzySearchIndex';
import { INITIAL_COMPONENTS } from '../data/initialComponents';

describe('text helpers', () => {
  it('normalizes case and accents', () => {
    expect(normalizeText('  Botón Ácido ')).toBe('boton acido');
  });

  it('splits camelCase and kebab-case, adding the joined form', () => {
    expect(tokenizeText('AccentCard')).toEqual(expect.arrayContaining(['accent', 'card', 'accentcard']));
    expect(tokenizeText('toggle-switch')).toEqual(expect.arrayContaining(['toggle', 'switch', 'toggleswitch']));
  });
});

describe('fuzzyMatchWord', () => {
  it('scores exact > prefix > typo > unrelated', () => {
    const exact = fuzzyMatchWord('button', 'button');
    const prefix = fuzzyMatchWord('butt', 'button');
    const typo = fuzzyMatchWord('buton', 'button');
    const none = fuzzyMatchWord('xyz', 'button');
    expect(exact).toBe(1);
    expect(prefix).toBeLessThan(exact);
    expect(typo).toBeGreaterThan(0);
    expect(none).toBe(0);
  });
});

describe('ComponentFuzzyIndex', () => {
  const index = new ComponentFuzzyIndex(INITIAL_COMPONENTS);

  it('finds a piece by name despite a typo', () => {
    const results = index.search('toogle');
    expect(results[0]?.component.id).toBe('toggle-switch');
  });

  it('matches accent-insensitive tags', () => {
    const ids = index.search('boton').map((r) => r.component.id);
    expect(ids).toContain('primary-button');
  });

  it('applies category and favorites filters', () => {
    expect(index.search('', 'buttons').every((r) => r.component.category === 'buttons')).toBe(true);
    const favs = index.search('', 'favorites', ['accent-card']);
    expect(favs.map((r) => r.component.id)).toEqual(['accent-card']);
  });

  it('returns every piece for an empty query', () => {
    expect(index.search('').length).toBe(INITIAL_COMPONENTS.length);
  });
});
