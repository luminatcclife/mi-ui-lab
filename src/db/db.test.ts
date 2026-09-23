import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  db,
  DEFAULT_FAVORITES,
  deleteCustomComponentFromDB,
  importComponentsToDB,
  loadCatalogFromDB,
  resetDBToDefaults,
  saveCustomComponentToDB,
  saveFavoritesToDB,
  saveTagOverrideToDB,
} from './db';
import { INITIAL_COMPONENTS } from '../data/initialComponents';
import { UIComponent } from '../types';

const piece = (id: string, extra: Partial<UIComponent> = {}): UIComponent => ({
  id,
  name: id,
  tagline: '',
  description: '',
  category: 'cards',
  sourceCode: '',
  usageSnippet: '',
  variants: [],
  props: [],
  tokensUsed: [],
  tags: [],
  isCustom: true,
  ...extra,
});

beforeEach(async () => {
  localStorage.clear();
  await Promise.all(db.tables.map((t) => t.clear()));
});

describe('loadCatalogFromDB', () => {
  it('returns the built-ins and default favorites on a fresh database', async () => {
    const catalog = await loadCatalogFromDB();
    expect(catalog.components.map((c) => c.id)).toEqual(INITIAL_COMPONENTS.map((c) => c.id));
    expect(catalog.favorites).toEqual(DEFAULT_FAVORITES);
  });

  it('default favorites point at pieces that exist', () => {
    const ids = new Set(INITIAL_COMPONENTS.map((c) => c.id));
    DEFAULT_FAVORITES.forEach((id) => expect(ids.has(id)).toBe(true));
  });

  it('appends custom pieces after the built-ins', async () => {
    await saveCustomComponentToDB(piece('mine'));
    const { components } = await loadCatalogFromDB();
    expect(components.at(-1)?.id).toBe('mine');
    expect(components).toHaveLength(INITIAL_COMPONENTS.length + 1);
  });

  it('lets a stored iteration of a built-in replace it instead of duplicating it', async () => {
    const base = INITIAL_COMPONENTS[0];
    await saveCustomComponentToDB({ ...base, version: '9.9.9' });
    const { components } = await loadCatalogFromDB();
    const matches = components.filter((c) => c.id === base.id);
    expect(matches).toHaveLength(1);
    expect(matches[0].version).toBe('9.9.9');
    expect(components[0].id).toBe(base.id); // keeps its position
  });

  it('applies tag overrides to built-ins', async () => {
    await saveTagOverrideToDB('accent-card', ['nuevo']);
    const { components } = await loadCatalogFromDB();
    expect(components.find((c) => c.id === 'accent-card')?.tags).toEqual(['nuevo']);
  });

  it('drops and purges favorites that point at missing pieces', async () => {
    await saveFavoritesToDB(['accent-card', 'custom-button']);
    const { favorites } = await loadCatalogFromDB();
    expect(favorites).toEqual(['accent-card']);
    expect(await db.favorites.get('custom-button')).toBeUndefined();
  });

  it('keeps favorites ordered as saved', async () => {
    await saveFavoritesToDB(['toggle-switch', 'accent-card', 'input-field']);
    expect((await loadCatalogFromDB()).favorites).toEqual(['toggle-switch', 'accent-card', 'input-field']);
  });
});

describe('localStorage migration', () => {
  it('moves legacy data into Dexie exactly once', async () => {
    localStorage.setItem('mi_ui_lab_custom_components', JSON.stringify([piece('legacy')]));
    localStorage.setItem('mi_ui_lab_favorite_components', JSON.stringify(['legacy']));
    localStorage.setItem('mi_ui_lab_component_tags_overrides', JSON.stringify({ 'accent-card': ['viejo'] }));

    const first = await loadCatalogFromDB();
    expect(first.components.some((c) => c.id === 'legacy')).toBe(true);
    expect(first.favorites).toEqual(['legacy']);
    expect(first.components.find((c) => c.id === 'accent-card')?.tags).toEqual(['viejo']);

    // Tras migrar, borrar en Dexie no debe "resucitar" desde localStorage
    await deleteCustomComponentFromDB('legacy');
    const second = await loadCatalogFromDB();
    expect(second.components.some((c) => c.id === 'legacy')).toBe(false);
  });

  it('survives corrupt legacy JSON', async () => {
    localStorage.setItem('mi_ui_lab_custom_components', '{not json');
    const { components } = await loadCatalogFromDB();
    expect(components).toHaveLength(INITIAL_COMPONENTS.length);
  });
});

describe('writes', () => {
  it('report success', async () => {
    expect(await saveCustomComponentToDB(piece('a'))).toBe(true);
    expect(await deleteCustomComponentFromDB('a')).toBe(true);
  });

  it('delete also removes the favorite and tag override', async () => {
    await saveCustomComponentToDB(piece('a'));
    await saveFavoritesToDB(['a']);
    await saveTagOverrideToDB('a', ['t']);
    await deleteCustomComponentFromDB('a');
    expect(await db.favorites.get('a')).toBeUndefined();
    expect(await db.tagOverrides.get('a')).toBeUndefined();
  });

  it('import never stores built-ins', async () => {
    await importComponentsToDB([{ ...INITIAL_COMPONENTS[0], isCustom: false }, piece('imp')]);
    expect((await db.customComponents.toArray()).map((c) => c.id)).toEqual(['imp']);
  });

  it('reset clears custom data and reseeds default favorites', async () => {
    await saveCustomComponentToDB(piece('a'));
    await saveTagOverrideToDB('accent-card', ['x']);
    await saveFavoritesToDB(['a']);
    expect(await resetDBToDefaults()).toBe(true);
    const catalog = await loadCatalogFromDB();
    expect(catalog.components).toHaveLength(INITIAL_COMPONENTS.length);
    expect(catalog.favorites).toEqual(DEFAULT_FAVORITES);
    expect(catalog.components.find((c) => c.id === 'accent-card')?.tags).toEqual(INITIAL_COMPONENTS[0].tags);
  });
});
