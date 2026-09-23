// src/hooks/useCatalog.ts
// Estado del catálogo (piezas + favoritos) con IndexedDB (Dexie) como única fuente de verdad.
// Las mutaciones actualizan la UI de inmediato y persisten en segundo plano; si IndexedDB falla,
// se avisa con un toast en lugar de dar el guardado por bueno en silencio.

import { useCallback, useEffect, useState } from 'react';
import { UIComponent } from '../types';
import { INITIAL_COMPONENTS } from '../data/initialComponents';
import {
  DEFAULT_FAVORITES,
  loadCatalogFromDB,
  saveCustomComponentToDB,
  deleteCustomComponentFromDB,
  saveTagOverrideToDB,
  saveFavoritesToDB,
  importComponentsToDB,
  resetDBToDefaults,
} from '../db/db';

const BUILT_IN_IDS = new Set(INITIAL_COMPONENTS.map((c) => c.id));

export function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/^#/, '');
}

export function useCatalog(onToast: (msg: string) => void) {
  const [components, setComponents] = useState<UIComponent[]>(INITIAL_COMPONENTS);
  const [favoriteIds, setFavoriteIds] = useState<string[]>(DEFAULT_FAVORITES);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from Dexie (includes the one-time migration from legacy localStorage keys)
  useEffect(() => {
    let isMounted = true;
    loadCatalogFromDB().then((catalog) => {
      if (!isMounted) return;
      setComponents(catalog.components);
      setFavoriteIds(catalog.favorites);
      setIsHydrated(true);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const persist = useCallback(
    (write: Promise<boolean>, failMsg: string) => {
      write.then((ok) => {
        if (!ok) onToast(`⚠ ${failMsg}: no se pudo escribir en IndexedDB`);
      });
    },
    [onToast],
  );

  const toggleFavorite = (componentId: string): boolean => {
    const isFav = favoriteIds.includes(componentId);
    const updated = isFav
      ? favoriteIds.filter((id) => id !== componentId)
      : [...favoriteIds, componentId];
    setFavoriteIds(updated);
    persist(saveFavoritesToDB(updated), 'Favoritos sin guardar');
    return !isFav;
  };

  const addComponent = (comp: UIComponent) => {
    setComponents((prev) => [comp, ...prev.filter((c) => c.id !== comp.id)]);
    persist(saveCustomComponentToDB(comp), `"${comp.name}" sin guardar`);
  };

  /** Reemplaza una pieza existente (p. ej. nueva iteración). Vale también para piezas base. */
  const updateComponent = (comp: UIComponent) => {
    setComponents((prev) => prev.map((c) => (c.id === comp.id ? comp : c)));
    persist(saveCustomComponentToDB(comp), `"${comp.name}" sin guardar`);
  };

  const deleteComponent = (id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
    setFavoriteIds((prev) => prev.filter((fid) => fid !== id));
    persist(deleteCustomComponentFromDB(id), 'La pieza no se borró de la base de datos');
  };

  const setTags = (componentId: string, tags: string[]) => {
    const cleaned = Array.from(new Set(tags.map(normalizeTag).filter(Boolean)));
    const target = components.find((c) => c.id === componentId);
    if (!target) return;
    const updatedComp = { ...target, tags: cleaned };
    setComponents((prev) => prev.map((c) => (c.id === componentId ? updatedComp : c)));
    persist(
      target.isCustom ? saveCustomComponentToDB(updatedComp) : saveTagOverrideToDB(componentId, cleaned),
      'Etiquetas sin guardar',
    );
  };

  /**
   * Añade/actualiza las piezas importadas (ya validadas) conservando las propias existentes.
   * Devuelve las que se integraron.
   */
  const importComponents = (imported: UIComponent[]): UIComponent[] => {
    const newItems = imported.filter((item) => !BUILT_IN_IDS.has(item.id));
    if (newItems.length === 0) return [];
    const incoming = new Map(newItems.map((c) => [c.id, c]));
    setComponents((prev) => [
      ...prev.map((c) => incoming.get(c.id) ?? c),
      ...newItems.filter((c) => !prev.some((p) => p.id === c.id)),
    ]);
    persist(importComponentsToDB(newItems), 'Importación sin guardar');
    return newItems;
  };

  const resetToDefaults = () => {
    setComponents(INITIAL_COMPONENTS);
    setFavoriteIds(DEFAULT_FAVORITES);
    persist(resetDBToDefaults(), 'No se pudo restablecer la base de datos');
  };

  return {
    components,
    favoriteIds,
    isHydrated,
    toggleFavorite,
    addComponent,
    updateComponent,
    deleteComponent,
    setTags,
    importComponents,
    resetToDefaults,
  };
}
