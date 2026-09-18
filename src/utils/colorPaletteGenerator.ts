export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface HslColor {
  h: number;
  s: number;
  l: number;
}

export type ShadeStep =
  | '50'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900'
  | '950';

export interface PaletteShade {
  step: ShadeStep;
  hex: string;
  rgb: RgbColor;
  hsl: HslColor;
  luminance: number;
  isLight: boolean;
  contrastOnWhite: number;
  contrastOnBlack: number;
  recommendedTextColor: string;
}

export interface ColorHarmony {
  name: string;
  description: string;
  hex: string;
  angle: number;
}

export function isValidHex(hex: string): boolean {
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
}

export function normalizeHex(hex: string): string {
  let cleaned = hex.trim().replace(/^#/, '');
  if (cleaned.length === 3) {
    cleaned = cleaned
      .split('')
      .map((c) => c + c)
      .join('');
  }
  return `#${cleaned.toLowerCase()}`;
}

export function hexToRgb(hex: string): RgbColor {
  const norm = normalizeHex(hex).slice(1);
  const r = parseInt(norm.substring(0, 2), 16) || 0;
  const g = parseInt(norm.substring(2, 4), 16) || 0;
  const b = parseInt(norm.substring(4, 6), 16) || 0;
  return { r, g, b };
}

export function rgbToHex({ r, g, b }: RgbColor): string {
  const clamp = (val: number) => Math.max(0, Math.min(255, Math.round(val)));
  const toHex = (n: number) => clamp(n).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }: RgbColor): HslColor {
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

export function hslToRgb({ h, s, l }: HslColor): RgbColor {
  const hNorm = ((h % 360) + 360) % 360 / 360;
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;

  if (sNorm === 0) {
    const val = Math.round(lNorm * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    let tNorm = t;
    if (tNorm < 0) tNorm += 1;
    if (tNorm > 1) tNorm -= 1;
    if (tNorm < 1 / 6) return p + (q - p) * 6 * tNorm;
    if (tNorm < 1 / 2) return q;
    if (tNorm < 2 / 3) return p + (q - p) * (2 / 3 - tNorm) * 6;
    return p;
  };

  const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
  const p = 2 * lNorm - q;

  const r = Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255);
  const g = Math.round(hue2rgb(p, q, hNorm) * 255);
  const b = Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255);

  return { r, g, b };
}

// Relative luminance according to WCAG 2.1
export function getRelativeLuminance({ r, g, b }: RgbColor): number {
  const transform = (c: number) => {
    const norm = c / 255;
    return norm <= 0.03928 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * transform(r) + 0.7152 * transform(g) + 0.0722 * transform(b);
}

// WCAG Contrast ratio (1 to 21)
export function getContrastRatio(rgb1: RgbColor, rgb2: RgbColor): number {
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  const brightest = Math.max(l1, l2);
  const darkest = Math.min(l1, l2);
  return (brightest + 0.05) / (darkest + 0.05);
}

// Standard step targets for Tailwind-like color scaling
const SHADE_SPECS: { step: ShadeStep; targetL: number; satFactor: number }[] = [
  { step: '50', targetL: 97, satFactor: 0.75 },
  { step: '100', targetL: 93, satFactor: 0.82 },
  { step: '200', targetL: 85, satFactor: 0.88 },
  { step: '300', targetL: 74, satFactor: 0.94 },
  { step: '400', targetL: 62, satFactor: 0.98 },
  { step: '500', targetL: 50, satFactor: 1.0 }, // Base Primary anchor
  { step: '600', targetL: 42, satFactor: 1.0 },
  { step: '700', targetL: 34, satFactor: 0.98 },
  { step: '800', targetL: 26, satFactor: 0.94 },
  { step: '900', targetL: 18, satFactor: 0.88 },
  { step: '950', targetL: 10, satFactor: 0.82 },
];

export function generateTailwindShades(primaryHex: string): PaletteShade[] {
  const normalized = normalizeHex(primaryHex);
  const baseRgb = hexToRgb(normalized);
  const baseHsl = rgbToHsl(baseRgb);

  const whiteRgb: RgbColor = { r: 255, g: 255, b: 255 };
  const blackRgb: RgbColor = { r: 9, g: 9, b: 11 };

  return SHADE_SPECS.map((spec) => {
    let hex: string;
    let rgb: RgbColor;
    let hsl: HslColor;

    if (spec.step === '500') {
      // Step 500 is directly the user's selected primary color
      hex = normalized;
      rgb = baseRgb;
      hsl = baseHsl;
    } else {
      // Calculate adjusted lightness and saturation
      const isLighter = parseInt(spec.step, 10) < 500;
      let computedL: number;

      if (isLighter) {
        // Interpolate between baseHsl.l and targetL
        const factor = (500 - parseInt(spec.step, 10)) / 500;
        computedL = baseHsl.l + (spec.targetL - baseHsl.l) * factor;
        computedL = Math.min(99, Math.max(baseHsl.l, computedL));
      } else {
        // Interpolate downwards
        const factor = (parseInt(spec.step, 10) - 500) / 450;
        computedL = baseHsl.l - (baseHsl.l - spec.targetL) * factor;
        computedL = Math.max(5, Math.min(baseHsl.l, computedL));
      }

      const computedS = Math.round(Math.max(15, Math.min(100, baseHsl.s * spec.satFactor)));
      hsl = {
        h: baseHsl.h,
        s: computedS,
        l: Math.round(computedL),
      };
      rgb = hslToRgb(hsl);
      hex = rgbToHex(rgb);
    }

    const lum = getRelativeLuminance(rgb);
    const contrastOnWhite = parseFloat(getContrastRatio(rgb, whiteRgb).toFixed(2));
    const contrastOnBlack = parseFloat(getContrastRatio(rgb, blackRgb).toFixed(2));
    const isLight = lum > 0.4;
    const recommendedTextColor = isLight ? '#09090b' : '#ffffff';

    return {
      step: spec.step,
      hex,
      rgb,
      hsl,
      luminance: parseFloat(lum.toFixed(3)),
      isLight,
      contrastOnWhite,
      contrastOnBlack,
      recommendedTextColor,
    };
  });
}

export function generateHarmonies(primaryHex: string): ColorHarmony[] {
  const norm = normalizeHex(primaryHex);
  const rgb = hexToRgb(norm);
  const hsl = rgbToHsl(rgb);

  const makeHarmony = (angle: number, name: string, desc: string): ColorHarmony => {
    const newH = (hsl.h + angle + 360) % 360;
    const newHex = rgbToHex(hslToRgb({ h: newH, s: hsl.s, l: hsl.l }));
    return {
      name,
      description: desc,
      hex: newHex,
      angle,
    };
  };

  return [
    makeHarmony(180, 'Complementario', 'Opuesto directo (180°), ideal para acentos y llamadas a la acción.'),
    makeHarmony(30, 'Análogo Derecho', 'Tono adyacente cálido (+30°), crea una sensación suave y armónica.'),
    makeHarmony(-30, 'Análogo Izquierdo', 'Tono adyacente frío (-30°), coherente y natural para elementos secundarios.'),
    makeHarmony(120, 'Triádico 1', 'Separación de un tercio (120°), ofrece vibración y riqueza cromática equilibrada.'),
    makeHarmony(240, 'Triádico 2', 'Separación de dos tercios (240°), contraste vivo sin tensión visual.'),
    makeHarmony(150, 'Split Complementario', 'Variación suave del complementario (150°), vibrante pero menos severo.'),
  ];
}

// Generate a subtle neutral palette tinted with the primary hue (modern design system convention)
export function generateTintedNeutrals(primaryHex: string): PaletteShade[] {
  const norm = normalizeHex(primaryHex);
  const baseHsl = rgbToHsl(hexToRgb(norm));
  // Keep hue, but crush saturation to 6-8%
  const neutralHex = rgbToHex(hslToRgb({ h: baseHsl.h, s: 7, l: 50 }));
  return generateTailwindShades(neutralHex);
}

// Formatters for exporting
export function formatTailwindV4Css(tokenPrefix: string, shades: PaletteShade[]): string {
  const lines = shades.map((s) => `  --color-${tokenPrefix}-${s.step}: ${s.hex};`);
  return `@theme {\n${lines.join('\n')}\n}`;
}

export function formatTailwindV3Config(tokenPrefix: string, shades: PaletteShade[]): string {
  const inner = shades.map((s) => `      '${s.step}': '${s.hex}',`).join('\n');
  return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: {\n        ${tokenPrefix}: {\n${inner}\n        },\n      },\n    },\n  },\n};`;
}

export function formatCssVariables(tokenPrefix: string, shades: PaletteShade[]): string {
  const lines = shades.map((s) => `  --${tokenPrefix}-${s.step}: ${s.hex};`);
  return `:root {\n${lines.join('\n')}\n}`;
}

export function formatComponentThemeTokens(tokenPrefix: string, shades: PaletteShade[]): string {
  const getShade = (step: ShadeStep) => shades.find((s) => s.step === step)?.hex || '#6366f1';
  const getContrast = (step: ShadeStep) =>
    shades.find((s) => s.step === step)?.recommendedTextColor || '#ffffff';

  return `// Tokens Semánticos para el Tema del Componente\nexport const ${tokenPrefix}Theme = {\n  primary: '${getShade('500')}',\n  primaryHover: '${getShade('600')}',\n  primaryActive: '${getShade('700')}',\n  primarySubtle: '${getShade('50')}',\n  primarySurface: '${getShade('100')}',\n  primaryBorder: '${getShade('200')}',\n  primaryDarkBorder: '${getShade('800')}',\n  primaryText: '${getShade('600')}',\n  primaryContrast: '${getContrast('500')}',\n};`;
}
