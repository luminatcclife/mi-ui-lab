// src/utils/elementInspector.ts
// Utility to analyze a rendered DOM element or a raw HTML string and extract:
// - Tailwind tokens (categorized by spacing, typography, colors, borders, layout, effects)
// - Filtered computed styles via window.getComputedStyle()
// - DOM structure and attributes summary
// - Technical spec sheet ready to export or inspect

import { sanitizeHtml } from './sanitizeHtml';

export interface TailwindCategorizedTokens {
  layout: string[];
  spacing: string[];
  typography: string[];
  colors: string[];
  borders: string[];
  effects: string[];
  interactive: string[];
  others: string[];
}

export interface FilteredComputedStyles {
  color: string;
  backgroundColor: string;
  borderColor: string;
  fontSize: string;
  fontWeight: string;
  lineHeight: string;
  fontFamily: string;
  borderRadius: string;
  boxShadow: string;
  padding: string;
  margin: string;
  display: string;
  dimensions: {
    width: number;
    height: number;
  };
}

export interface DomChildSummary {
  tagName: string;
  className: string;
  textContent: string;
  tokenCount: number;
}

export interface ElementTechSheet {
  tagName: string;
  id?: string;
  totalClassesCount: number;
  rawClassNames: string[];
  tailwindTokens: TailwindCategorizedTokens;
  computedStyles: FilteredComputedStyles;
  attributes: Record<string, string>;
  hasChildren: boolean;
  childrenCount: number;
  childrenSummary: DomChildSummary[];
  analyzedAt: string;
  sourceType: 'rendered-dom' | 'html-string';
  cleanHtml: string;
  /** true si el HTML pegado tenía varios elementos raíz y se envolvieron en un <div>. */
  wrappedMultipleRoots?: boolean;
}

/**
 * Categorizes an individual Tailwind class name into design token systems.
 */
export function categorizeTailwindClass(cls: string): keyof TailwindCategorizedTokens {
  const clean = cls.trim();
  if (!clean) return 'others';

  // Interactive / state variants
  if (
    clean.startsWith('hover:') ||
    clean.startsWith('focus:') ||
    clean.startsWith('active:') ||
    clean.startsWith('disabled:') ||
    clean.startsWith('group-hover:') ||
    clean.startsWith('dark:')
  ) {
    return 'interactive';
  }

  // Spacing
  if (
    /^(p|m|px|py|pt|pb|pl|pr|mx|my|mt|mb|ml|mr|gap|gap-x|gap-y|space-x|space-y|inset|top|bottom|left|right)-/.test(
      clean
    )
  ) {
    return 'spacing';
  }

  // Typography
  if (
    /^(text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)|font-|tracking-|leading-|italic|uppercase|lowercase|capitalize|truncate|underline|line-through)/.test(
      clean
    )
  ) {
    return 'typography';
  }

  // Colors
  if (
    /^(bg|text|border|fill|stroke|ring|outline|accent|from|to|via)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black|transparent|current)/.test(
      clean
    )
  ) {
    return 'colors';
  }

  // Borders & outlines
  if (/^(rounded|border|divide|ring|outline)/.test(clean)) {
    return 'borders';
  }

  // Layout & Flexbox & Grid
  if (
    /^(flex|inline-flex|grid|inline-grid|block|inline-block|inline|hidden|items-|justify-|content-|self-|grid-cols-|col-span-|row-span-|flex-col|flex-row|flex-wrap|grow|shrink|order-|z-|relative|absolute|fixed|sticky|w-|h-|min-w-|max-w-|min-h-|max-h-|overflow)/.test(
      clean
    )
  ) {
    return 'layout';
  }

  // Effects & Transitions & Filters
  if (
    /^(shadow|opacity|blur|backdrop|transition|duration|ease|animate|scale|rotate|translate|cursor-|pointer-events|select-)/.test(
      clean
    )
  ) {
    return 'effects';
  }

  return 'others';
}

/**
 * Inspects either a real rendered HTMLElement or a raw HTML string.
 * Mounts temporarily in an isolated container to compute exact layout and styles if given an HTML string.
 */
export function inspectElementOrHTML(
  source: HTMLElement | string,
  containerToMountIfHTML?: HTMLElement
): ElementTechSheet {
  let targetEl: HTMLElement;
  let offscreenWrapper: HTMLElement | null = null;
  let wrappedMultipleRoots = false;
  let sourceType: 'rendered-dom' | 'html-string' = 'rendered-dom';

  if (typeof source === 'string') {
    sourceType = 'html-string';
    const parser = new DOMParser();
    // Se sanea antes de montar en el documento principal: un <img onerror> se ejecutaría al insertarlo.
    const doc = parser.parseFromString(sanitizeHtml(source.trim()), 'text/html');
    // Varios elementos raíz (o texto suelto junto a ellos): se envuelven en un <div> para no perder nada,
    // ya que la ficha, la vista previa y la pieza guardada parten de un único elemento.
    const hasLooseText = Array.from(doc.body.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim() !== '',
    );
    if (doc.body.childElementCount > 1 || (doc.body.childElementCount === 1 && hasLooseText)) {
      const group = doc.createElement('div');
      group.append(...Array.from(doc.body.childNodes));
      doc.body.appendChild(group);
      wrappedMultipleRoots = true;
    }
    const firstEl = doc.body.firstElementChild as HTMLElement;

    if (!firstEl) {
      throw new Error(
        'No se pudo encontrar ningún elemento HTML raíz válido en el código proporcionado. Asegúrate de incluir etiquetas como <div>, <button>, etc.'
      );
    }

    // Se monta fuera de pantalla para que el navegador calcule estilos y medidas. La ocultación va en un
    // envoltorio, no en el elemento: así su atributo style original queda intacto en la ficha y en cleanHtml.
    // El envoltorio se ajusta al contenido (como #preview-root en la vista previa) y nunca debe quedar dentro
    // de un display:none, o las medidas saldrían 0 × 0.
    const mountPoint = containerToMountIfHTML || document.body;
    targetEl = firstEl.cloneNode(true) as HTMLElement;
    offscreenWrapper = document.createElement('div');
    offscreenWrapper.setAttribute('data-inspecting-sandbox', 'true');
    offscreenWrapper.style.cssText =
      'position:absolute;top:0;left:-9999px;visibility:hidden;pointer-events:none;width:max-content;max-width:1024px;';
    offscreenWrapper.appendChild(targetEl);
    mountPoint.appendChild(offscreenWrapper);
  } else {
    targetEl = source;
  }

  try {
    // 1. Extract class names and categorize
    const rawClassAttr = targetEl.getAttribute('class') || '';
    const rawClassNames = rawClassAttr
      .split(/\s+/)
      .map((c) => c.trim())
      .filter(Boolean);

    const tailwindTokens: TailwindCategorizedTokens = {
      layout: [],
      spacing: [],
      typography: [],
      colors: [],
      borders: [],
      effects: [],
      interactive: [],
      others: [],
    };

    rawClassNames.forEach((cls) => {
      const category = categorizeTailwindClass(cls);
      tailwindTokens[category].push(cls);
    });

    // 2. Extract curated computed styles
    const computed = window.getComputedStyle(targetEl);
    const rect = targetEl.getBoundingClientRect();

    const computedStyles: FilteredComputedStyles = {
      color: computed.color || 'inherit',
      backgroundColor: computed.backgroundColor || 'transparent',
      borderColor: computed.borderColor || 'transparent',
      fontSize: computed.fontSize || '16px',
      fontWeight: computed.fontWeight || '400',
      lineHeight: computed.lineHeight || 'normal',
      fontFamily: (computed.fontFamily || 'inherit').split(',')[0].replace(/['"]/g, ''),
      borderRadius: computed.borderRadius || '0px',
      boxShadow: computed.boxShadow && computed.boxShadow !== 'none' ? computed.boxShadow : 'none',
      padding: `${computed.paddingTop} ${computed.paddingRight} ${computed.paddingBottom} ${computed.paddingLeft}`,
      margin: `${computed.marginTop} ${computed.marginRight} ${computed.marginBottom} ${computed.marginLeft}`,
      display: computed.display || 'block',
      dimensions: {
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      },
    };

    // 3. Extract attributes
    const attributes: Record<string, string> = {};
    Array.from(targetEl.attributes).forEach((attr) => {
      attributes[attr.name] = attr.value;
    });

    // 4. Summarize direct children elements
    const childrenSummary: DomChildSummary[] = Array.from(targetEl.children).slice(0, 15).map((child) => {
      const el = child as HTMLElement;
      const childClasses = (el.getAttribute('class') || '')
        .split(/\s+/)
        .filter(Boolean);
      return {
        tagName: el.tagName.toLowerCase(),
        className: el.getAttribute('class') || '',
        textContent: (el.textContent || '').trim().slice(0, 50),
        tokenCount: childClasses.length,
      };
    });

    return {
      tagName: targetEl.tagName.toLowerCase(),
      id: targetEl.id || undefined,
      totalClassesCount: rawClassNames.length,
      rawClassNames,
      tailwindTokens,
      computedStyles,
      attributes,
      hasChildren: targetEl.children.length > 0,
      childrenCount: targetEl.children.length,
      childrenSummary,
      analyzedAt: new Date().toLocaleTimeString(),
      sourceType,
      cleanHtml: targetEl.outerHTML,
      wrappedMultipleRoots,
    };
  } finally {
    offscreenWrapper?.remove();
  }
}