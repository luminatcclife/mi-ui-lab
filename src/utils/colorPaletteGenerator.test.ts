import { describe, expect, it } from 'vitest';
import {
  generateHarmonies,
  generateTailwindShades,
  getContrastRatio,
  hexToRgb,
  hslToRgb,
  isValidHex,
  normalizeHex,
  rgbToHex,
  rgbToHsl,
} from './colorPaletteGenerator';

describe('hex helpers', () => {
  it('validates 3 and 6 digit hex, with or without #', () => {
    expect(isValidHex('#6366f1')).toBe(true);
    expect(isValidHex('abc')).toBe(true);
    expect(isValidHex('#12345')).toBe(false);
    expect(isValidHex('#gggggg')).toBe(false);
  });

  it('normalizes shorthand and case', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    expect(normalizeHex(' 6366F1 ')).toBe('#6366f1');
  });

  it('round-trips hex -> rgb -> hex', () => {
    expect(hexToRgb('#6366f1')).toEqual({ r: 99, g: 102, b: 241 });
    expect(rgbToHex({ r: 99, g: 102, b: 241 })).toBe('#6366f1');
  });

  it('round-trips rgb -> hsl -> rgb within rounding', () => {
    const rgb = { r: 99, g: 102, b: 241 };
    const back = hslToRgb(rgbToHsl(rgb));
    expect(Math.abs(back.r - rgb.r)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.g - rgb.g)).toBeLessThanOrEqual(2);
    expect(Math.abs(back.b - rgb.b)).toBeLessThanOrEqual(2);
  });
});

describe('getContrastRatio', () => {
  it('is 21:1 for black on white and 1:1 for identical colors', () => {
    const white = { r: 255, g: 255, b: 255 };
    const black = { r: 0, g: 0, b: 0 };
    expect(getContrastRatio(white, black)).toBeCloseTo(21, 0);
    expect(getContrastRatio(white, white)).toBeCloseTo(1, 5);
  });
});

describe('generateTailwindShades', () => {
  const shades = generateTailwindShades('#6366f1');

  it('produces the 11 Tailwind steps with the input as 500', () => {
    expect(shades.map((s) => s.step)).toEqual([
      '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950',
    ]);
    expect(shades.find((s) => s.step === '500')?.hex).toBe('#6366f1');
  });

  it('gets darker from 50 to 950', () => {
    for (let i = 1; i < shades.length; i++) {
      expect(shades[i].luminance).toBeLessThanOrEqual(shades[i - 1].luminance);
    }
  });

  it('emits valid hex for every step', () => {
    shades.forEach((s) => expect(isValidHex(s.hex)).toBe(true));
  });
});

describe('generateHarmonies', () => {
  it('returns valid colors for the primary', () => {
    const harmonies = generateHarmonies('#6366f1');
    expect(harmonies.length).toBeGreaterThan(0);
    harmonies.forEach((h) => expect(isValidHex(h.hex)).toBe(true));
  });
});
