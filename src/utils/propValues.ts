// src/utils/propValues.ts
// Valores de props de variantes y del editor del Playground. Vienen de datos (catálogo, IndexedDB,
// JSON importado), no del compilador, así que se tipan como JSON y se leen con accesores que
// comprueban el tipo en runtime: un valor corrupto cae al valor por defecto en vez de romper el render.

export type PropValue = string | number | boolean | null | PropValue[] | { [key: string]: PropValue };
export type PropValues = Record<string, PropValue | undefined>;

export const isPropObject = (v: unknown): v is { [key: string]: PropValue } =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Texto (los números se aceptan como texto). */
export function readString(v: unknown): string | undefined {
  if (typeof v === 'string') return v;
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  return undefined;
}

export function readBool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

export function readOneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return typeof v === 'string' && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

/** Array cuyos elementos pasan `parse`; los que no, se descartan. undefined si no es un array. */
export function readArray<T>(v: unknown, parse: (item: unknown) => T | undefined): T[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map(parse).filter((x): x is T => x !== undefined);
}

export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error && err.message ? err.message : fallback;
}
