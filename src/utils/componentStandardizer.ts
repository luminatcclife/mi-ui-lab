import { UIComponent, PropDoc, ComponentVariant, ComponentCategory, AccentColor } from '../types';
import { ElementTechSheet } from './elementInspector';

export interface AutoStandardizeOptions {
  name: string;
  category?: Exclude<ComponentCategory, 'all' | 'favorites'>;
  tagline?: string;
  description?: string;
  rawHtml: string;
  tokens?: string[];
  techSheet?: ElementTechSheet | null;
}

export interface StandardizedResult {
  component: UIComponent;
  inferredProps: PropDoc[];
  variants: ComponentVariant[];
  generatedTsx: string;
  usageSnippet: string;
  detectedTexts: {
    title?: string;
    subtitle?: string;
    badge?: string;
    actionLabel?: string;
  };
}

// Atributos HTML/SVG en kebab-case o minúsculas que JSX espera en camelCase.
// `class`, `for` y `tabindex` se manejan aparte porque no son 1:1 con su
// nombre en minúsculas. Sin este mapeo, HTML real (fechas, tablas, SVGs con
// stroke) compila pero React tira "Invalid DOM property" en consola.
const HTML_TO_JSX_ATTRS: Record<string, string> = {
  datetime: 'dateTime',
  readonly: 'readOnly',
  maxlength: 'maxLength',
  minlength: 'minLength',
  autoplay: 'autoPlay',
  autofocus: 'autoFocus',
  autocomplete: 'autoComplete',
  contenteditable: 'contentEditable',
  crossorigin: 'crossOrigin',
  spellcheck: 'spellCheck',
  srcset: 'srcSet',
  colspan: 'colSpan',
  rowspan: 'rowSpan',
  usemap: 'useMap',
  frameborder: 'frameBorder',
  allowfullscreen: 'allowFullScreen',
  charset: 'charSet',
  enctype: 'encType',
  novalidate: 'noValidate',
  formaction: 'formAction',
  accesskey: 'accessKey',
  hreflang: 'hrefLang',
  // Atributos de SVG en kebab-case
  'stroke-width': 'strokeWidth',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'fill-rule': 'fillRule',
  'clip-rule': 'clipRule',
  'clip-path': 'clipPath',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'text-anchor': 'textAnchor',
  'dominant-baseline': 'dominantBaseline',
  'font-family': 'fontFamily',
};

/** Renombra atributos HTML/SVG a su equivalente JSX (camelCase). */
export function renameAttributesToJsx(html: string): string {
  return Object.entries(HTML_TO_JSX_ATTRS).reduce(
    (acc, [htmlAttr, jsxAttr]) => acc.replace(new RegExp(`\\b${htmlAttr}=`, 'g'), `${jsxAttr}=`),
    html,
  );
}

/**
 * Convierte comentarios HTML (`<!-- ... -->`) a comentarios JSX (`{/* ... *\/}`).
 * El HTML real capturado de otros sitios trae comentarios de documentación
 * con frecuencia (p. ej. "<!-- Dropdown menu -->"); JSX no entiende la
 * sintaxis HTML y no compila si queda tal cual.
 */
export function convertHtmlComments(html: string): string {
  return html.replace(/<!--([\s\S]*?)-->/g, (_match, inner) => `{/*${inner}*/}`);
}

// Elementos HTML "void": nunca llevan cierre propio ni hijos. El HTML real
// casi nunca los auto-cierra (`<input ...>`), pero JSX lo exige (`<input ... />`)
// o directamente no compila.
const VOID_ELEMENTS = [
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
];
const VOID_ELEMENT_PATTERN = new RegExp(`<(${VOID_ELEMENTS.join('|')})((?:"[^"]*"|'[^']*'|[^>])*)>`, 'gi');

/**
 * Auto-cierra elementos void (`<input ...>` -> `<input ... />`) que vengan
 * sin cerrar desde HTML plano, dejando intactos los que ya están bien
 * formados (`<br />`).
 */
export function closeVoidElements(html: string): string {
  return html.replace(VOID_ELEMENT_PATTERN, (match, tag, attrs) => {
    if (attrs.trimEnd().endsWith('/')) {
      return match;
    }
    return `<${tag}${attrs} />`;
  });
}

/**
 * Parses DOM structure from HTML to intelligently detect semantic text slots
 */
export function extractSemanticSlots(html: string): {
  title?: string;
  subtitle?: string;
  badge?: string;
  actionLabel?: string;
} {
  if (typeof window === 'undefined' || !html) {
    return {};
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const body = doc.body;

    // 1. Detect Title (h1-h6, or strong/b, or elements with font-bold/semibold)
    let title: string | undefined;
    const heading = body.querySelector('h1, h2, h3, h4, h5, h6, [class*="font-bold"], [class*="font-semibold"]');
    if (heading && heading.textContent?.trim()) {
      const cleanText = heading.textContent.trim().replace(/\s+/g, ' ');
      // Avoid badges being picked as titles if they are very short (<= 3 chars)
      if (cleanText.length > 2 && cleanText.length < 80) {
        title = cleanText;
      }
    }

    // 2. Detect Action Label (button, link, or elements with cursor-pointer / role="button")
    let actionLabel: string | undefined;
    const actionEl = body.querySelector('button, a, [role="button"]');
    if (actionEl && actionEl.textContent?.trim()) {
      const cleanBtn = actionEl.textContent.trim().replace(/\s+/g, ' ').replace(/↗|→|›|»/g, '').trim();
      if (cleanBtn.length > 0 && cleanBtn.length < 40) {
        actionLabel = cleanBtn;
      }
    }

    // 3. Detect Badge / Pill / Number (elements with rounded-full, text-[10px], or text-xs with uppercase)
    let badge: string | undefined;
    const badgeEl = body.querySelector('[class*="rounded-full"], [class*="uppercase"][class*="text-xs"], [class*="tracking-"]');
    if (badgeEl && badgeEl !== heading && badgeEl !== actionEl) {
      const badgeText = badgeEl.textContent?.trim().replace(/\s+/g, ' ');
      if (badgeText && badgeText.length > 0 && badgeText.length <= 25) {
        badge = badgeText;
      }
    }

    // 4. Detect Subtitle / Description (paragraphs or text-zinc-400 / text-sm / text-xs)
    let subtitle: string | undefined;
    const textEls = Array.from(body.querySelectorAll('p, span, div')) as HTMLElement[];
    for (const el of textEls) {
      if (el === heading || el === actionEl || el === badgeEl || el.contains(heading) || el.contains(actionEl)) {
        continue;
      }
      const txt = el.textContent?.trim().replace(/\s+/g, ' ');
      if (txt && txt.length > 15 && txt !== title && txt !== actionLabel) {
        subtitle = txt;
        break;
      }
    }

    return { title, subtitle, badge, actionLabel };
  } catch (e) {
    console.warn('Could not parse semantic slots', e);
    return {};
  }
}

/**
 * Automates the entire transformation of an HTML snippet into a standard UIComponent
 */
export function standardizeToUIComponent(options: AutoStandardizeOptions): StandardizedResult {
  const { name, rawHtml, techSheet } = options;

  const sanitizedName = name
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('') || 'CustomComponent';

  const slug = name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  const uniqueId = `custom-${slug}-${Date.now()}`;
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Extract semantic slots
  const slots = extractSemanticSlots(rawHtml);
  const defaultTitle = slots.title || name;
  const defaultSubtitle = slots.subtitle || 'Descripción del componente adaptada al sistema de diseño.';
  const defaultBadge = slots.badge;
  const defaultAction = slots.actionLabel;

  // 2. Build Inferred Props
  const inferredProps: PropDoc[] = [
    {
      name: 'variant',
      type: "'default' | 'glow' | 'compact'",
      defaultValue: "'default'",
      description: 'Estilo visual de la superficie y atmósfera del componente.',
      required: false,
    },
    {
      name: 'accentColor',
      type: "'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'fuchsia' | 'zinc'",
      defaultValue: "'indigo'",
      description: 'Tono cromático aplicado a bordes activos, botones o acentos.',
      required: false,
    },
  ];

  if (slots.title || true) {
    inferredProps.push({
      name: 'title',
      type: 'string',
      defaultValue: `'${defaultTitle.replace(/'/g, "\\'")}'`,
      description: 'Texto principal del encabezado.',
      required: true,
    });
  }

  if (slots.subtitle) {
    inferredProps.push({
      name: 'subtitle',
      type: 'string',
      defaultValue: `'${defaultSubtitle.replace(/'/g, "\\'")}'`,
      description: 'Texto descriptivo o secundario.',
      required: false,
    });
  }

  if (slots.badge) {
    inferredProps.push({
      name: 'badge',
      type: 'string',
      defaultValue: `'${slots.badge.replace(/'/g, "\\'")}'`,
      description: 'Insignia o pill en la esquina superior.',
      required: false,
    });
  }

  if (slots.actionLabel) {
    inferredProps.push({
      name: 'actionLabel',
      type: 'string',
      defaultValue: `'${slots.actionLabel.replace(/'/g, "\\'")}'`,
      description: 'Texto de la llamada a la acción.',
      required: false,
    });
    inferredProps.push({
      name: 'onAction',
      type: '() => void',
      defaultValue: 'undefined',
      description: 'Callback ejecutado al hacer clic en la acción.',
      required: false,
    });
  }

  // 3. Build 3 Standard Variants
  const variants: ComponentVariant[] = [
    {
      id: 'default',
      name: 'Estándar',
      description: 'Aspecto fiel al original capturado, con elevación suave.',
      props: {
        variant: 'default',
        accentColor: 'indigo',
        title: defaultTitle,
        subtitle: defaultSubtitle,
        ...(defaultBadge ? { badge: defaultBadge } : {}),
        ...(defaultAction ? { actionLabel: defaultAction } : {}),
      },
      codeSnippet: `<${sanitizedName}
  variant="default"
  title="${defaultTitle}"${defaultAction ? `\n  actionLabel="${defaultAction}"` : ''}
/>`,
    },
    {
      id: 'glow',
      name: 'Ambient Glow',
      description: 'Superficie de cristal oscuro con resplandor perimetral y contraste de alta gama.',
      props: {
        variant: 'glow',
        accentColor: 'violet',
        title: `${defaultTitle} (Glow)`,
        subtitle: defaultSubtitle,
        ...(defaultBadge ? { badge: 'Glow Edition' } : {}),
        ...(defaultAction ? { actionLabel: defaultAction } : {}),
      },
      codeSnippet: `<${sanitizedName}
  variant="glow"
  accentColor="violet"
  title="${defaultTitle}"
/>`,
    },
    {
      id: 'compact',
      name: 'Compacto',
      description: 'Versión ajustada con menor padding y tipografía densa para barras laterales.',
      props: {
        variant: 'compact',
        accentColor: 'emerald',
        title: defaultTitle,
        subtitle: defaultSubtitle,
        ...(defaultBadge ? { badge: defaultBadge } : {}),
        ...(defaultAction ? { actionLabel: defaultAction } : {}),
      },
      codeSnippet: `<${sanitizedName}
  variant="compact"
  title="${defaultTitle}"
/>`,
    },
  ];

  // 4. Generate Clean React TSX
  const cleanJsx = closeVoidElements(
    renameAttributesToJsx(
      convertHtmlComments(rawHtml)
        .replace(/\bclass=/g, 'className=')
        .replace(/\bfor=/g, 'htmlFor=')
        .replace(/\btabindex=/g, 'tabIndex=')
        .replace(/style="[^"]*"/g, ''), // strip inline styles for clean tailwind classes
    ),
  );

  const generatedTsx = `import React from 'react';

export type ${sanitizedName}Variant = 'default' | 'glow' | 'compact';
export type ${sanitizedName}Accent = 'indigo' | 'emerald' | 'violet' | 'amber' | 'rose' | 'cyan' | 'fuchsia' | 'zinc';

export interface ${sanitizedName}Props {
  variant?: ${sanitizedName}Variant;
  accentColor?: ${sanitizedName}Accent;
  title?: string;${slots.subtitle ? `\n  subtitle?: string;` : ''}${slots.badge ? `\n  badge?: string;` : ''}${slots.actionLabel ? `\n  actionLabel?: string;\n  onAction?: () => void;` : ''}
  className?: string;
}

export function ${sanitizedName}({
  variant = 'default',
  accentColor = 'indigo',
  title = '${defaultTitle.replace(/'/g, "\\'")}',${slots.subtitle ? `\n  subtitle = '${defaultSubtitle.replace(/'/g, "\\'")}',` : ''}${slots.badge ? `\n  badge = '${defaultBadge?.replace(/'/g, "\\'")}',` : ''}${slots.actionLabel ? `\n  actionLabel = '${defaultAction?.replace(/'/g, "\\'")}',\n  onAction,` : ''}
  className = '',
}: ${sanitizedName}Props) {
  // Configuración de variantes visuales
  const variantStyles = {
    default: 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shadow-lg',
    glow: 'border-indigo-500/40 bg-zinc-950/95 shadow-[0_0_30px_rgba(99,102,241,0.15)] backdrop-blur-xl',
    compact: 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 shadow-sm text-sm',
  }[variant];

  return (
    <div className={\`relative transition-all duration-300 \${variantStyles} \${className}\`}>
      ${cleanJsx}
    </div>
  );
}`;

  // 5. Usage Snippet
  const usageSnippet = `import { ${sanitizedName} } from './components/ui/${sanitizedName}';

export default function Pagina() {
  return (
    <${sanitizedName}
      variant="default"
      title="${defaultTitle}"${defaultAction ? `\n      actionLabel="${defaultAction}"\n      onAction={() => console.log('Clic!')}` : ''}
    />
  );
}`;

  // 6. Tokens
  const tokensArray = Array.from(
    new Set([
      ...(options.tokens || []),
      ...(techSheet?.rawClassNames || []),
      'transition-all',
      'duration-300',
    ])
  ).filter(Boolean);

  const tags = Array.from(
    new Set([
      'custom',
      'estandarizado',
      options.category || 'cards',
      ...(slots.badge ? ['badge'] : []),
      ...(slots.actionLabel ? ['action', 'interactive'] : []),
      ...tokensArray.slice(0, 4).map((c) => c.replace(/[^a-zA-Z0-9]/g, '')),
    ])
  ).filter(Boolean);

  const component: UIComponent = {
    id: uniqueId,
    name: options.name.trim(),
    version: '1.0.0',
    versionHistory: [
      {
        version: '1.0.0',
        date: todayStr,
        notes: 'Componente estandarizado automáticamente al modelo UIComponent (contrato dorado).',
        changes: [
          'Inferencia automática de interfaz de Props tipada',
          'Generación de 3 variantes interactivas (Estándar, Ambient Glow, Compacto)',
          'Extracción y clasificación de tokens Tailwind',
          'Soporte de temas y colores de acento',
        ],
      },
    ],
    tagline: options.tagline?.trim() || `Componente <${techSheet?.tagName || 'div'}> con arquitectura estandarizada`,
    description:
      options.description?.trim() ||
      `Pieza importada y estandarizada al modelo de AccentCard con soporte para props reactivas y selector de variantes.`,
    category: options.category || 'cards',
    sourceCode: generatedTsx,
    usageSnippet,
    variants,
    props: inferredProps,
    tokensUsed: tokensArray,
    tags,
    isCustom: true,
    createdAt: todayStr,
  };

  return {
    component,
    inferredProps,
    variants,
    generatedTsx,
    usageSnippet,
    detectedTexts: slots,
  };
}
