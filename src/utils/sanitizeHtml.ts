import DOMPurify from 'dompurify';

/**
 * Sanea HTML de terceros (pegado en el Inspector, importado vía JSON o heredado de IndexedDB)
 * antes de parsearlo, montarlo o persistirlo. Elimina <script>, manejadores inline (onerror, onclick…),
 * URLs javascript: y elementos embebidos; conserva clases, estilos, SVG y atributos data-* / aria-*
 * (necesarios para Tailwind, Radix o Flowbite).
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'base', 'meta', 'link'],
    ALLOW_DATA_ATTR: true,
    ALLOW_ARIA_ATTR: true,
  });
}
