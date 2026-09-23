// src/utils/componentEdits.ts
// Aplica la edición de metadatos/código de una pieza propia. El id, la versión, el historial,
// las variantes (salvo su snippet) y las etiquetas no se tocan aquí: tienen sus propios flujos.

import { ComponentCategory, UIComponent } from '../types';
import { sanitizeHtml } from './sanitizeHtml';

export interface ComponentEditForm {
  name: string;
  tagline: string;
  description: string;
  category: Exclude<ComponentCategory, 'all' | 'favorites'>;
  tokensUsed: string;
  usageSnippet: string;
  sourceCode: string;
  /** Solo para piezas capturadas (las que tienen rawHtml). */
  rawHtml?: string;
}

export function formFromComponent(comp: UIComponent): ComponentEditForm {
  return {
    name: comp.name,
    tagline: comp.tagline,
    description: comp.description,
    category: comp.category,
    tokensUsed: comp.tokensUsed.join(', '),
    usageSnippet: comp.usageSnippet,
    sourceCode: comp.sourceCode,
    rawHtml: comp.rawHtml,
  };
}

/** Devuelve un mensaje de error o null si el formulario es válido para esa pieza. */
export function validateComponentEdit(comp: UIComponent, form: ComponentEditForm): string | null {
  if (!form.name.trim()) return 'El nombre no puede estar vacío.';
  if (comp.rawHtml && !sanitizeHtml(form.rawHtml ?? '').trim()) {
    return 'El HTML no puede quedar vacío (tras sanearlo no queda contenido).';
  }
  return null;
}

export function applyComponentEdits(comp: UIComponent, form: ComponentEditForm): UIComponent {
  const usageSnippet = form.usageSnippet.trim();
  const updated: UIComponent = {
    ...comp,
    name: form.name.trim(),
    tagline: form.tagline.trim(),
    description: form.description.trim(),
    category: form.category,
    tokensUsed: form.tokensUsed
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    usageSnippet,
    sourceCode: form.sourceCode.trim(),
    // Las variantes que mostraban el snippet de uso anterior siguen al nuevo
    variants: comp.variants.map((v) =>
      v.codeSnippet === comp.usageSnippet ? { ...v, codeSnippet: usageSnippet } : v,
    ),
  };
  if (comp.rawHtml !== undefined) {
    updated.rawHtml = sanitizeHtml(form.rawHtml ?? '');
  }
  return updated;
}
