import { ComponentCategory, UIComponent } from '../types';

/** Filtros de «Colección»: agrupan piezas por origen o marca, no por tipo. */
export const COLLECTION_FILTERS: ComponentCategory[] = ['all', 'favorites', 'custom'];

/** Filtros por tipo de pieza. */
export const TYPE_FILTERS: ComponentCategory[] = ['cards', 'buttons', 'inputs', 'feedback', 'navigation', 'data'];

/** Nombre corto del filtro, para la barra lateral y los pies de tarjeta. */
export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  all: 'Todas',
  favorites: 'Favoritas',
  custom: 'Propias',
  cards: 'Tarjetas',
  buttons: 'Botones',
  inputs: 'Entradas',
  feedback: 'Feedback',
  navigation: 'Navegación',
  data: 'Datos',
};

/** Título de la cuadrícula cuando el filtro está activo. */
export const CATEGORY_TITLES: Record<ComponentCategory, string> = {
  all: 'Todas las piezas',
  favorites: 'Tus favoritas',
  custom: 'Tus piezas propias',
  cards: 'Tarjetas',
  buttons: 'Botones',
  inputs: 'Entradas',
  feedback: 'Feedback',
  navigation: 'Navegación',
  data: 'Datos',
};

export function countForCategory(cat: ComponentCategory, components: UIComponent[], favoriteIds: string[]): number {
  if (cat === 'all') return components.length;
  if (cat === 'favorites') return components.filter((c) => favoriteIds.includes(c.id)).length;
  if (cat === 'custom') return components.filter((c) => c.isCustom).length;
  return components.filter((c) => c.category === cat).length;
}
