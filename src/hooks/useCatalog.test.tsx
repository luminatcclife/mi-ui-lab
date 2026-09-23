import 'fake-indexeddb/auto';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCatalog } from './useCatalog';
import * as dbModule from '../db/db';
import { INITIAL_COMPONENTS } from '../data/initialComponents';
import { UIComponent } from '../types';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type Catalog = ReturnType<typeof useCatalog>;

const piece = (id: string): UIComponent => ({
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
});

async function mountCatalog(onToast = vi.fn()) {
  const ref: { current: Catalog | null } = { current: null };
  function Probe() {
    ref.current = useCatalog(onToast);
    return null;
  }
  const root = createRoot(document.createElement('div'));
  await act(async () => root.render(<Probe />));
  // Espera a la hidratación desde IndexedDB
  await act(async () => {
    for (let i = 0; i < 50 && !ref.current?.isHydrated; i++) await new Promise((r) => setTimeout(r, 10));
  });
  return { get: () => ref.current!, onToast, unmount: () => act(() => root.unmount()) };
}

beforeEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(dbModule.db.tables.map((t) => t.clear()));
});

describe('useCatalog', () => {
  it('hydrates from IndexedDB', async () => {
    await dbModule.saveCustomComponentToDB(piece('stored'));
    const c = await mountCatalog();
    expect(c.get().isHydrated).toBe(true);
    expect(c.get().components.map((x) => x.id)).toContain('stored');
    c.unmount();
  });

  it('import keeps existing custom pieces and replaces same-id ones', async () => {
    await dbModule.saveCustomComponentToDB(piece('a'));
    const c = await mountCatalog();
    await act(async () => {
      c.get().importComponents([{ ...piece('a'), name: 'A2' }, piece('b')]);
    });
    const custom = c.get().components.filter((x) => x.isCustom);
    expect(custom.map((x) => [x.id, x.name])).toEqual([['a', 'A2'], ['b', 'b']]);
    c.unmount();
  });

  it('delete removes the piece from favorites too', async () => {
    const c = await mountCatalog();
    await act(async () => c.get().addComponent(piece('fav')));
    await act(async () => {
      c.get().toggleFavorite('fav');
    });
    expect(c.get().favoriteIds).toContain('fav');
    await act(async () => c.get().deleteComponent('fav'));
    expect(c.get().favoriteIds).not.toContain('fav');
    c.unmount();
  });

  it('reset restores built-ins and default favorites', async () => {
    const c = await mountCatalog();
    await act(async () => c.get().addComponent(piece('x')));
    await act(async () => c.get().resetToDefaults());
    expect(c.get().components).toHaveLength(INITIAL_COMPONENTS.length);
    expect(c.get().favoriteIds).toEqual(dbModule.DEFAULT_FAVORITES);
    c.unmount();
  });

  it('warns with a toast when an IndexedDB write fails', async () => {
    const c = await mountCatalog();
    vi.spyOn(dbModule, 'saveCustomComponentToDB').mockResolvedValue(false);
    await act(async () => {
      c.get().addComponent(piece('nope'));
      await Promise.resolve();
    });
    expect(c.onToast).toHaveBeenCalledWith(expect.stringMatching(/⚠ "nope" sin guardar/));
    // La UI refleja el cambio igualmente (actualización optimista)
    expect(c.get().components.some((x) => x.id === 'nope')).toBe(true);
    c.unmount();
  });
});
