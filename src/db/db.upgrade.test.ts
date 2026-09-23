import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { describe, expect, it } from 'vitest';

describe('schema v2 -> v3 upgrade', () => {
  it('drops the drafts table and keeps pieces and favorites', async () => {
    // Base de datos tal y como la dejaba la versión anterior de la app (schema v2, con `drafts`)
    const legacy = new Dexie('MiUILabDatabase');
    legacy.version(2).stores({
      customComponents: 'id, name, category, isCustom, version, *tags, createdAt',
      favorites: 'id, addedAt',
      tagOverrides: 'id',
      meta: 'key',
      drafts: 'id, name, category, createdAt',
    });
    await legacy.table('customComponents').put({ id: 'mine', name: 'Mía', category: 'cards', tags: [], isCustom: true });
    await legacy.table('favorites').put({ id: 'mine', addedAt: 1 });
    await legacy.table('drafts').put({ id: 'd1', name: 'Borrador', category: 'cards', createdAt: '' });
    await legacy.table('meta').put({ key: 'migrated_from_localstorage_v1', value: true });
    legacy.close();

    // Se importa después de crear la base antigua: el módulo abre la suya en la primera consulta
    const { db, loadCatalogFromDB } = await import('./db');
    const catalog = await loadCatalogFromDB();

    expect(db.verno).toBe(3);
    expect(db.tables.map((t) => t.name)).not.toContain('drafts');
    expect(catalog.components.some((c) => c.id === 'mine')).toBe(true);
    expect(catalog.favorites).toEqual(['mine']);
  });
});
