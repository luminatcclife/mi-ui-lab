import Dexie, { Table } from 'dexie';
import { UIComponent, ComponentCategory, ComponentDraft } from '../types';
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
  drafts!: Table<ComponentDraft, string>;
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
  }
}
// Single instance of the database
export const db = new MiUILabDatabase();

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

    // Merge built-in components with tag overrides
    const processedBuiltIns = INITIAL_COMPONENTS.map((comp) => {
      if (tagMap[comp.id]) {
        return { ...comp, tags: tagMap[comp.id] };
      }
      return comp;
    });

    // Merge with custom components
    const mergedComponents = [...processedBuiltIns, ...customList];

    // Favorites list sorted by addedAt descending
    const favoriteIds =
      favoriteRecords.length > 0
        ? favoriteRecords
            .sort((a, b) => b.addedAt - a.addedAt)
            .map((f) => f.id)
        : ['accent-card', 'custom-button'];

    return {
      components: mergedComponents,
      favorites: favoriteIds,
      tagOverrides: tagMap,
    };
  } catch (err) {
    console.error('Error loading data from Dexie IndexedDB:', err);
    return {
      components: INITIAL_COMPONENTS,
      favorites: ['accent-card', 'custom-button'],
      tagOverrides: {},
    };
  }
}

/**
 * Save or update a custom component in Dexie
 */
export async function saveCustomComponentToDB(component: UIComponent): Promise<void> {
  try {
    await db.customComponents.put(component);
  } catch (err) {
    console.error(`Error saving component ${component.id} to Dexie:`, err);
  }
}

/**
 * Delete a custom component from Dexie
 */
export async function deleteCustomComponentFromDB(id: string): Promise<void> {
  try {
    await db.customComponents.delete(id);
    await db.favorites.delete(id);
    await db.tagOverrides.delete(id);
  } catch (err) {
    console.error(`Error deleting component ${id} from Dexie:`, err);
  }
}

/**
 * Save or update component tags in Dexie
 */
export async function saveTagOverrideToDB(componentId: string, tags: string[]): Promise<void> {
  try {
    await db.tagOverrides.put({ id: componentId, tags });
  } catch (err) {
    console.error(`Error saving tag overrides for ${componentId} to Dexie:`, err);
  }
}

/**
 * Update the complete list of favorites in Dexie
 */
export async function saveFavoritesToDB(favoriteIds: string[]): Promise<void> {
  try {
    await db.transaction('rw', db.favorites, async () => {
      await db.favorites.clear();
      const entries: DBFavorite[] = favoriteIds.map((id, index) => ({
        id,
        addedAt: Date.now() - index * 100,
      }));
      await db.favorites.bulkPut(entries);
    });
  } catch (err) {
    console.error('Error saving favorites to Dexie:', err);
  }
}

/**
 * Import a collection of components into Dexie
 */
export async function importComponentsToDB(imported: UIComponent[]): Promise<void> {
  try {
    const builtInIds = new Set(INITIAL_COMPONENTS.map((c) => c.id));
    const customOnly = imported.filter((c) => c.isCustom || !builtInIds.has(c.id));

    if (customOnly.length > 0) {
      await db.customComponents.bulkPut(customOnly);
    }
  } catch (err) {
    console.error('Error importing components to Dexie:', err);
  }
}

/**
 * Reset all custom components and overrides from Dexie back to clean default state
 */
export async function resetDBToDefaults(): Promise<void> {
  try {
    await db.transaction('rw', [db.customComponents, db.favorites, db.tagOverrides], async () => {
      await db.customComponents.clear();
      await db.favorites.clear();
      await db.tagOverrides.clear();

      // Seed default favorites
      await db.favorites.bulkPut([
        { id: 'accent-card', addedAt: Date.now() },
        { id: 'custom-button', addedAt: Date.now() - 100 },
      ]);
    });
  } catch (err) {
    console.error('Error resetting Dexie database to defaults:', err);
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
/** Save or update a captured draft in Dexie */
export async function saveDraftToDB(draft: ComponentDraft): Promise<void> {
  try {
    await db.drafts.put(draft);
  } catch (err) {
    console.error(`Error saving draft ${draft.id} to Dexie:`, err);
  }
}
/** Load all captured drafts from Dexie, newest first */
export async function loadDraftsFromDB(): Promise<ComponentDraft[]> {
  try {
    const all = await db.drafts.toArray();
    return all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.error('Error loading drafts from Dexie:', err);
    return [];
  }
}

/** Delete a captured draft from Dexie (tras "Convertir a componente" o al descartarlo) */
export async function deleteDraftFromDB(id: string): Promise<void> {
  try {
    await db.drafts.delete(id);
  } catch (err) {
    console.error(`Error deleting draft ${id} from Dexie:`, err);
  }
}