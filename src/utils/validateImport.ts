// src/utils/validateImport.ts
// Valida y normaliza una colección JSON importada antes de que toque el estado o IndexedDB.
// Todo lo importado se trata como no confiable: se comprueba la forma, se descarta lo inválido
// y el rawHtml se sanea.

import { ComponentCategory, ComponentVariant, PropDoc, UIComponent } from '../types';
import { sanitizeHtml } from './sanitizeHtml';
import { PropValue, PropValues } from './propValues';

type PieceCategory = Exclude<ComponentCategory, 'all' | 'favorites'>;

const CATEGORIES: readonly PieceCategory[] = [
  'cards',
  'buttons',
  'inputs',
  'feedback',
  'navigation',
  'data',
  'custom',
];

const MAX_ITEMS = 500;
const MAX_TEXT = 200_000;

export interface ImportValidationResult {
  valid: UIComponent[];
  errors: string[];
}

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const str = (v: unknown, fallback = ''): string =>
  typeof v === 'string' ? v.slice(0, MAX_TEXT) : fallback;

const strArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 200)) : [];

/** Solo valores JSON (sin profundidad excesiva); el resto se descarta. */
function parsePropValue(v: unknown, depth = 0): PropValue | undefined {
  if (v === null || typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.slice(0, MAX_TEXT);
  if (typeof v === 'number') return Number.isFinite(v) ? v : undefined;
  if (depth >= 6) return undefined;
  if (Array.isArray(v)) {
    return v.map((x) => parsePropValue(x, depth + 1)).filter((x): x is PropValue => x !== undefined);
  }
  if (isObject(v)) {
    const out: { [key: string]: PropValue } = {};
    for (const [k, val] of Object.entries(v)) {
      const parsed = parsePropValue(val, depth + 1);
      if (parsed !== undefined) out[k] = parsed;
    }
    return out;
  }
  return undefined;
}

function parsePropValues(v: unknown): PropValues {
  const parsed = isObject(v) ? parsePropValue(v) : undefined;
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function parseVariants(v: unknown): ComponentVariant[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObject).flatMap((item) => {
    const id = str(item.id);
    if (!id) return [];
    return [
      {
        id,
        name: str(item.name, id),
        description: str(item.description),
        props: parsePropValues(item.props),
        codeSnippet: str(item.codeSnippet),
      },
    ];
  });
}

function parseProps(v: unknown): PropDoc[] {
  if (!Array.isArray(v)) return [];
  return v.filter(isObject).flatMap((item) => {
    const name = str(item.name);
    if (!name) return [];
    return [
      {
        name,
        type: str(item.type, 'unknown'),
        defaultValue: str(item.defaultValue),
        description: str(item.description),
        required: item.required === true,
      },
    ];
  });
}

function parseComponent(raw: unknown, index: number): { component?: UIComponent; error?: string } {
  const label = `Elemento #${index + 1}`;
  if (!isObject(raw)) return { error: `${label}: no es un objeto.` };

  const id = str(raw.id).trim();
  const name = str(raw.name).trim();
  if (!id || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) {
    return { error: `${label}: "id" ausente o con caracteres no permitidos.` };
  }
  if (!name) return { error: `${label} (${id}): falta "name".` };

  const category = CATEGORIES.includes(raw.category as PieceCategory)
    ? (raw.category as PieceCategory)
    : 'custom';

  const component: UIComponent = {
    id,
    name: name.slice(0, 200),
    tagline: str(raw.tagline),
    description: str(raw.description),
    category,
    sourceCode: str(raw.sourceCode),
    usageSnippet: str(raw.usageSnippet),
    variants: parseVariants(raw.variants),
    props: parseProps(raw.props),
    tokensUsed: strArray(raw.tokensUsed),
    tags: strArray(raw.tags).map((t) => t.trim().toLowerCase().replace(/^#/, '')).filter(Boolean),
    // Todo lo importado es una pieza propia: nunca puede suplantar a una pieza base.
    isCustom: true,
    createdAt: str(raw.createdAt) || new Date().toISOString(),
    version: str(raw.version) || '1.0.0',
  };

  if (Array.isArray(raw.versionHistory)) {
    component.versionHistory = raw.versionHistory.filter(isObject).map((it) => ({
      version: str(it.version),
      date: str(it.date),
      notes: str(it.notes),
      changes: strArray(it.changes),
    }));
  }

  if (typeof raw.rawHtml === 'string' && raw.rawHtml.trim()) {
    component.rawHtml = sanitizeHtml(raw.rawHtml.slice(0, MAX_TEXT));
  }

  return { component };
}

/**
 * Valida el JSON de una colección. `reservedIds` son los ids de las piezas base, que se omiten
 * (el import nunca las sobrescribe).
 */
export function validateImportedCollection(
  data: unknown,
  reservedIds: Set<string>,
): ImportValidationResult {
  if (!Array.isArray(data)) {
    return { valid: [], errors: ['El JSON debe ser un arreglo de componentes.'] };
  }
  if (data.length > MAX_ITEMS) {
    return { valid: [], errors: [`La colección supera el máximo de ${MAX_ITEMS} piezas.`] };
  }

  const valid: UIComponent[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  data.forEach((raw, index) => {
    // Las piezas base viajan en todo export: se omiten en silencio, no son un error.
    if (isObject(raw) && typeof raw.id === 'string' && reservedIds.has(raw.id)) return;

    const { component, error } = parseComponent(raw, index);
    if (error) {
      errors.push(error);
      return;
    }
    if (component && seen.has(component.id)) {
      errors.push(`Elemento #${index + 1}: id duplicado "${component.id}".`);
      return;
    }
    if (component) {
      seen.add(component.id);
      valid.push(component);
    }
  });

  return { valid, errors };
}
