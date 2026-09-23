import Dexie, { Table } from 'dexie';
import { UIComponent } from '../types';
import { INITIAL_COMPONENTS } from '../data/initialComponents';

export interface DBFavorite {
  id: string;
  addedAt: number;
}

export interface DBTagOverride {
  id: string;
  tags: string[];
}

export interface DBMeta {
  key: string;
  value: any;
}

/**
 * IndexedDB Database definition for mi-ui-lab using Dexie.js
 * Provides local, persistent, unlimited browser storage without external cloud requirements.
 */
export class MiUILabDatabase extends Dexie {
  customComponents!: Table<UIComponent, string>;
  favorites!: Table<DBFavorite, string>;
  tagOverrides!: Table<DBTagOverride, string>;
  meta!: Table<DBMeta, string>;
  constructor() {
    super('MiUILabDatabase');
    
    // Schema version 1
    this.version(1).stores({
      customComponents: 'id, name, category, isCustom, version, *tags, createdAt',
      favorites: 'id, addedAt',
      tagOverrides: 'id',
      meta: 'key',
    });

    // Schema version 2: añade la tabla de borradores capturados desde el Inspector
    this.version(2).stores({
      customComponents: 'id, name, category, isCustom, version, *tags, createdAt',
      favorites: 'id, addedAt',
      tagOverrides: 'id',
      meta: 'key',
      drafts: 'id, name, category, createdAt',
    });

    // Schema version 3: se elimina `drafts` (la UI de borradores se descartó; nunca se leía)
    this.version(3).stores({
      drafts: null,
    });
  }
}
// Single instance of the database
export const db = new MiUILabDatabase();

/** Favoritos sembrados en una base nueva o tras restablecer. */
export const DEFAULT_FAVORITES = ['accent-card', 'primary-button'];

// Legacy LocalStorage Keys for Migration
const LEGACY_CUSTOM_KEY = 'mi_ui_lab_custom_components';
const LEGACY_FAVORITES_KEY = 'mi_ui_lab_favorite_components';
const LEGACY_TAGS_KEY = 'mi_ui_lab_component_tags_overrides';

/**
 * Migrates existing data from localStorage to Dexie (IndexedDB) if not already migrated.
 */
export async function migrateFromLocalStorageIfNeeded(): Promise<void> {
  try {
    const migrationMeta = await db.meta.get('migrated_from_localstorage_v1');
    if (migrationMeta?.value === true) {
      return; // Already migrated
    }

    // 1. Migrate custom components
    const savedCustom = localStorage.getItem(LEGACY_CUSTOM_KEY);
    if (savedCustom) {
      try {
        const parsed: UIComponent[] = JSON.parse(savedCustom);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await db.customComponents.bulkPut(parsed);
        }
      } catch (e) {
        console.warn('Could not parse legacy custom components for migration', e);
      }
    }

    // 2. Migrate favorites
    const savedFavorites = localStorage.getItem(LEGACY_FAVORITES_KEY);
    if (savedFavorites) {
      try {
        const parsedFavs: string[] = JSON.parse(savedFavorites);
        if (Array.isArray(parsedFavs)) {
          const favoriteEntries: DBFavorite[] = parsedFavs.map((id, index) => ({
            id,
            addedAt: Date.now() - index * 1000,
          }));
          await db.favorites.bulkPut(favoriteEntries);
        }
      } catch (e) {
        console.warn('Could not parse legacy favorites for migration', e);
      }
    }

    // 3. Migrate tag overrides
    const savedTags = localStorage.getItem(LEGACY_TAGS_KEY);
    if (savedTags) {
      try {
        const parsedTags: Record<string, string[]> = JSON.parse(savedTags);
        const tagEntries: DBTagOverride[] = Object.entries(parsedTags).map(([id, tags]) => ({
          id,
          tags,
        }));
        if (tagEntries.length > 0) {
          await db.tagOverrides.bulkPut(tagEntries);
        }
      } catch (e) {
        console.warn('Could not parse legacy tag overrides for migration', e);
      }
    }

    // Mark as migrated
    await db.meta.put({ key: 'migrated_from_localstorage_v1', value: true });
  } catch (error) {
    console.error('Dexie migration from localStorage error:', error);
  }
}

/**
 * Load complete components catalog (Built-in + Dexie Custom Components + Tag Overrides)
 */
export async function loadCatalogFromDB(): Promise<{
  components: UIComponent[];
  favorites: string[];
  tagOverrides: Record<string, string[]>;
}> {
  try {
    await migrateFromLocalStorageIfNeeded();

    const [customList, favoriteRecords, tagRecords] = await Promise.all([
      db.customComponents.toArray(),
      db.favorites.toArray(),
      db.tagOverrides.toArray(),
    ]);

    // Construct tag overrides dictionary
    const tagMap: Record<string, string[]> = {};
    for (const record of tagRecords) {
      tagMap[record.id] = record.tags;
    }

    // Una entrada guardada con el id de una pieza base (p. ej. tras registrar una iteración)
    // la reemplaza en su posición en vez de duplicarla.
    const storedById = new Map(customList.map((c) => [c.id, c]));
    const builtIns = INITIAL_COMPONENTS.map((comp) => storedById.get(comp.id) ?? comp);
    const builtInIds = new Set(INITIAL_COMPONENTS.map((c) => c.id));
    const customOnly = customList.filter((c) => !builtInIds.has(c.id));

    // Los overrides de tags aplican a las piezas base (las propias guardan sus tags en su registro)
    const mergedComponents = [...builtIns, ...customOnly].map((comp) =>
      !comp.isCustom && tagMap[comp.id] ? { ...comp, tags: tagMap[comp.id] } : comp,
    );

    // Favorites list sorted by addedAt descending; se descartan ids que ya no existen
    const existingIds = new Set(mergedComponents.map((c) => c.id));
    const favoriteIds =
      favoriteRecords.length > 0
        ? favoriteRecords
            .sort((a, b) => b.addedAt - a.addedAt)
            .map((f) => f.id)
            .filter((id) => existingIds.has(id))
        : DEFAULT_FAVORITES;

    // Purga favoritos huérfanos (p. ej. el antiguo 'custom-button' sembrado por defecto)
    const orphanFavorites = favoriteRecords.map((f) => f.id).filter((id) => !existingIds.has(id));
    if (orphanFavorites.length > 0) {
      await db.favorites.bulkDelete(orphanFavorites);
    }

    return {
      components: mergedComponents,
      favorites: favoriteIds,
      tagOverrides: tagMap,
    };
  } catch (err) {
    console.error('Error loading data from Dexie IndexedDB:', err);
    return {
      components: INITIAL_COMPONENTS,
      favorites: DEFAULT_FAVORITES,
      tagOverrides: {},
    };
  }
}

/**
 * Save or update a custom component in Dexie.
 * Las funciones de escritura devuelven false si IndexedDB falla, para que la UI lo comunique.
 */
export async function saveCustomComponentToDB(component: UIComponent): Promise<boolean> {
  try {
    await db.customComponents.put(component);
    return true;
  } catch (err) {
    console.error(`Error saving component ${component.id} to Dexie:`, err);
    return false;
  }
}

/**
 * Delete a custom component from Dexie
 */
export async function deleteCustomComponentFromDB(id: string): Promise<boolean> {
  try {
    await db.customComponents.delete(id);
    await db.favorites.delete(id);
    await db.tagOverrides.delete(id);
    return true;
  } catch (err) {
    console.error(`Error deleting component ${id} from Dexie:`, err);
    return false;
  }
}

/**
 * Save or update component tags in Dexie
 */
export async function saveTagOverrideToDB(componentId: string, tags: string[]): Promise<boolean> {
  try {
    await db.tagOverrides.put({ id: componentId, tags });
    return true;
  } catch (err) {
    console.error(`Error saving tag overrides for ${componentId} to Dexie:`, err);
    return false;
  }
}

/**
 * Update the complete list of favorites in Dexie
 */
export async function saveFavoritesToDB(favoriteIds: string[]): Promise<boolean> {
  try {
    await db.transaction('rw', db.favorites, async () => {
      await db.favorites.clear();
      const entries: DBFavorite[] = favoriteIds.map((id, index) => ({
        id,
        addedAt: Date.now() - index * 100,
      }));
      await db.favorites.bulkPut(entries);
    });
    return true;
  } catch (err) {
    console.error('Error saving favorites to Dexie:', err);
    return false;
  }
}

/**
 * Import a collection of components into Dexie
 */
export async function importComponentsToDB(imported: UIComponent[]): Promise<boolean> {
  try {
    const builtInIds = new Set(INITIAL_COMPONENTS.map((c) => c.id));
    const customOnly = imported.filter((c) => c.isCustom || !builtInIds.has(c.id));

    if (customOnly.length > 0) {
      await db.customComponents.bulkPut(customOnly);
    }
    return true;
  } catch (err) {
    console.error('Error importing components to Dexie:', err);
    return false;
  }
}

/**
 * Reset all custom components and overrides from Dexie back to clean default state
 */
export async function resetDBToDefaults(): Promise<boolean> {
  try {
    await db.transaction('rw', [db.customComponents, db.favorites, db.tagOverrides], async () => {
      await db.customComponents.clear();
      await db.favorites.clear();
      await db.tagOverrides.clear();

      // Seed default favorites
      await db.favorites.bulkPut(
        DEFAULT_FAVORITES.map((id, index) => ({ id, addedAt: Date.now() - index * 100 })),
      );
    });
    return true;
  } catch (err) {
    console.error('Error resetting Dexie database to defaults:', err);
    return false;
  }
}

/**
 * Get database statistics and status
 */
export async function getDBStats(): Promise<{
  isReady: boolean;
  customCount: number;
  favoritesCount: number;
  tagOverridesCount: number;
  databaseName: string;
}> {
  try {
    const [customCount, favoritesCount, tagOverridesCount] = await Promise.all([
      db.customComponents.count(),
      db.favorites.count(),
      db.tagOverrides.count(),
    ]);

    return {
      isReady: true,
      customCount,
      favoritesCount,
      tagOverridesCount,
      databaseName: db.name,
    };
  } catch (err) {
    return {
      isReady: false,
      customCount: 0,
      favoritesCount: 0,
      tagOverridesCount: 0,
      databaseName: 'MiUILabDatabase',
    };
  }
}
