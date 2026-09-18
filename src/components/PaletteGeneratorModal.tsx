import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  Dices,
  Eye,
  Code2,
  Sliders,
  Palette,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Info,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PaletteShade,
  ShadeStep,
  generateTailwindShades,
  generateHarmonies,
  generateTintedNeutrals,
  formatTailwindV4Css,
  formatTailwindV3Config,
  formatCssVariables,
  formatComponentThemeTokens,
  isValidHex,
  normalizeHex,
} from '../utils/colorPaletteGenerator';

interface PaletteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  initialPrimaryHex?: string;
  onApplyToLabTheme?: (hex: string, name: string) => void;
}

const PRESET_PRIMARIES = [
  { name: 'Indigo Eléctrico', hex: '#6366f1' },
  { name: 'Esmeralda Menta', hex: '#10b981' },
  { name: 'Violeta Profundo', hex: '#8b5cf6' },
  { name: 'Ámbar Cálido', hex: '#f59e0b' },
  { name: 'Rosa Carmesí', hex: '#f43f5e' },
  { name: 'Cian Neón', hex: '#06b6d4' },
  { name: 'Azul Cobalto', hex: '#2563eb' },
  { name: 'Naranja Fuego', hex: '#f97316' },
  { name: 'Fucsia Magenta', hex: '#d946ef' },
  { name: 'Pizarra Neutro', hex: '#64748b' },
  { name: 'Lima Fresca', hex: '#84cc16' },
];

type ModalTab = 'shades' | 'preview' | 'harmonies' | 'export';
type ExportFormat = 'tailwind-v4' | 'tailwind-v3' | 'css-vars' | 'ts-theme' | 'classes';

export function PaletteGeneratorModal({
  isOpen,
  onClose,
  onToast,
  initialPrimaryHex = '#6366f1',
  onApplyToLabTheme,
}: PaletteGeneratorModalProps) {
  const [primaryHex, setPrimaryHex] = useState<string>(initialPrimaryHex);
  const [hexInput, setHexInput] = useState<string>(initialPrimaryHex);
  const [tokenPrefix, setTokenPrefix] = useState<string>('brand');
  const [activeTab, setActiveTab] = useState<ModalTab>('shades');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('tailwind-v4');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [previewThemeMode, setPreviewThemeMode] = useState<'light' | 'dark'>('light');

  // Live component states in preview tab
  const [switchActive, setSwitchActive] = useState(true);
  const [sampleInputValue, setSampleInputValue] = useState('Texto de ejemplo...');

  // Computed shades and data
  const shades = useMemo(() => {
    const valid = isValidHex(primaryHex) ? primaryHex : '#6366f1';
    return generateTailwindShades(valid);
  }, [primaryHex]);

  const primaryShade = useMemo(() => {
    return shades.find((s) => s.step === '500') || shades[5];
  }, [shades]);

  const harmonies = useMemo(() => {
    const valid = isValidHex(primaryHex) ? primaryHex : '#6366f1';
    return generateHarmonies(valid);
  }, [primaryHex]);

  const tintedNeutrals = useMemo(() => {
    const valid = isValidHex(primaryHex) ? primaryHex : '#6366f1';
    return generateTintedNeutrals(valid);
  }, [primaryHex]);

  if (!isOpen) return null;

  const handleHexChange = (newHex: string) => {
    setHexInput(newHex);
    if (isValidHex(newHex)) {
      setPrimaryHex(normalizeHex(newHex));
    }
  };

  const handleRandomizeColor = () => {
    const randomHex =
      '#' +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0');
    setPrimaryHex(randomHex);
    setHexInput(randomHex);
    onToast(`Color aleatorio generado: ${randomHex.toUpperCase()}`);
  };

  const handleCopy = (text: string, key: string, message: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast(message);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const formattedCode = useMemo(() => {
    const prefix = tokenPrefix.trim() || 'brand';
    switch (exportFormat) {
      case 'tailwind-v4':
        return formatTailwindV4Css(prefix, shades);
      case 'tailwind-v3':
        return formatTailwindV3Config(prefix, shades);
      case 'css-vars':
        return formatCssVariables(prefix, shades);
      case 'ts-theme':
        return formatComponentThemeTokens(prefix, shades);
      case 'classes':
        return `// Clases útiles de Tailwind listas para usar con tu prefijo '${prefix}':\n
/* Botón Primario Sólido */
bg-${prefix}-500 hover:bg-${prefix}-600 active:bg-${prefix}-700 text-white shadow-xs focus:ring-4 focus:ring-${prefix}-500/20

/* Botón Secundario Outline */
border border-${prefix}-200 dark:border-${prefix}-800 text-${prefix}-700 dark:text-${prefix}-300 hover:bg-${prefix}-50 dark:hover:bg-${prefix}-950/40

/* Badge / Pill de Estado */
bg-${prefix}-50 dark:bg-${prefix}-950/60 border border-${prefix}-200 dark:border-${prefix}-800 text-${prefix}-700 dark:text-${prefix}-300

/* Borde / Anillo de Enfoque */
focus:border-${prefix}-500 focus:ring-2 focus:ring-${prefix}-500/30

/* Superficie con Acento Superior */
border-t-4 border-t-${prefix}-500 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800`;
      default:
        return '';
    }
  }, [exportFormat, tokenPrefix, shades]);

  // Dynamic styling helper for live preview
  const shade50 = shades.find((s) => s.step === '50')?.hex || '#f5f7ff';
  const shade100 = shades.find((s) => s.step === '100')?.hex || '#ebf0fe';
  const shade200 = shades.find((s) => s.step === '200')?.hex || '#d8e1fd';
  const shade300 = shades.find((s) => s.step === '300')?.hex || '#c7d2fe';
  const shade400 = shades.find((s) => s.step === '400')?.hex || '#818cf8';
  const shade500 = shades.find((s) => s.step === '500')?.hex || '#6366f1';
  const shade600 = shades.find((s) => s.step === '600')?.hex || '#4f46e5';
  const shade700 = shades.find((s) => s.step === '700')?.hex || '#4338ca';
  const shade800 = shades.find((s) => s.step === '800')?.hex || '#3730a3';
  const shade900 = shades.find((s) => s.step === '900')?.hex || '#312e81';
  const shade950 = shades.find((s) => s.step === '950')?.hex || '#1e1b4b';

  return (
    <div
      id="palette-generator-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 p-3 sm:p-6 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="palette-generator-container"
        className="relative flex h-full max-h-[92vh] w-full max-w-5xl flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Modal Top Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-2xl border shadow-xs transition-colors duration-300"
              style={{
                backgroundColor: shade500,
                borderColor: shade600,
                color: primaryShade.recommendedTextColor,
              }}
            >
              <Palette className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-mono">
                  Generador de Paletas & Tokens Tailwind
                </h2>
                <span className="rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide">
                  11 Escalas
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Calcula automáticamente la escala 50-950, ratios WCAG y exporta tokens CSS/Tailwind para tus componentes.
              </p>
            </div>
          </div>

          <button
            type="button"
            id="close-palette-generator-btn"
            onClick={onClose}
            className="rounded-xl p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            title="Cerrar generador de paletas"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Primary Color Controls Bar */}
        <div className="border-b border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/40 p-4 sm:p-5 shrink-0">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Left: Input, Picker & Randomizer (7 cols) */}
            <div className="lg:col-span-7 flex flex-wrap items-center gap-3">
              {/* Native Color Picker Circle */}
              <div className="relative flex items-center">
                <label
                  htmlFor="primary-color-picker-input"
                  className="relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-2xl border-2 shadow-xs transition-transform hover:scale-105"
                  style={{
                    backgroundColor: primaryShade.hex,
                    borderColor: primaryShade.isLight ? '#cbd5e1' : '#475569',
                  }}
                  title="Haz clic para abrir el selector de color nativo"
                >
                  <input
                    type="color"
                    id="primary-color-picker-input"
                    value={primaryShade.hex}
                    onChange={(e) => handleHexChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <Sliders
                    className="h-4 w-4 drop-shadow-sm"
                    style={{ color: primaryShade.recommendedTextColor }}
                  />
                </label>
              </div>

              {/* Hex Code Input */}
              <div className="relative flex items-center">
                <span className="absolute left-3 font-mono text-xs font-bold text-zinc-400">#</span>
                <input
                  type="text"
                  id="primary-hex-text-input"
                  value={hexInput.replace(/^#/, '')}
                  onChange={(e) => handleHexChange('#' + e.target.value)}
                  maxLength={7}
                  placeholder="6366F1"
                  className="h-10 w-28 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 pl-7 pr-3 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              {/* HSL and RGB indicators */}
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/60 px-2.5 py-2 rounded-xl border border-zinc-200/80 dark:border-zinc-700/60">
                <span>RGB({primaryShade.rgb.r}, {primaryShade.rgb.g}, {primaryShade.rgb.b})</span>
                <span className="text-zinc-300 dark:text-zinc-600">|</span>
                <span>HSL({primaryShade.hsl.h}°, {primaryShade.hsl.s}%, {primaryShade.hsl.l}%)</span>
              </div>

              {/* Random Color Button */}
              <button
                type="button"
                id="btn-random-primary-color"
                onClick={handleRandomizeColor}
                className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-2xs"
                title="Generar un color primario aleatorio para inspirarte"
              >
                <Dices className="h-4 w-4 text-indigo-500" />
                <span className="hidden sm:inline">Aleatorio</span>
              </button>
            </div>

            {/* Right: Token Name Prefix & Quick Copy (5 cols) */}
            <div className="lg:col-span-5 flex items-center justify-start lg:justify-end gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="token-prefix-input"
                  className="text-xs font-medium text-zinc-500 dark:text-zinc-400 shrink-0"
                >
                  Prefijo Token:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="token-prefix-input"
                    value={tokenPrefix}
                    onChange={(e) => setTokenPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    placeholder="brand"
                    maxLength={14}
                    className="h-9 w-24 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Quick Copy Primary 500 */}
              <button
                type="button"
                id="btn-copy-primary-hex"
                onClick={() =>
                  handleCopy(
                    primaryShade.hex,
                    'primary-hex',
                    `HEX ${primaryShade.hex} copiado al portapapeles`,
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/80 dark:bg-indigo-950/40 px-3 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors cursor-pointer"
                title="Copiar el código HEX del color primario"
              >
                {copiedKey === 'primary-hex' ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                <span>{copiedKey === 'primary-hex' ? '¡Copiado!' : 'Copiar 500'}</span>
              </button>
            </div>
          </div>

          {/* Quick Presets Swatches */}
          <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
              Presets:
            </span>
            {PRESET_PRIMARIES.map((preset) => {
              const isCurrent = primaryShade.hex.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  id={`preset-${preset.hex.replace('#', '')}`}
                  onClick={() => handleHexChange(preset.hex)}
                  title={`${preset.name} (${preset.hex})`}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1 text-xs font-medium transition-all cursor-pointer shrink-0 ${
                    isCurrent
                      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-semibold shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full ring-1 ring-black/10 shrink-0"
                    style={{ backgroundColor: preset.hex }}
                  />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs Header */}
        <div className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/30 px-6 py-2.5 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              id="tab-btn-shades"
              onClick={() => setActiveTab('shades')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'shades'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Palette className="h-3.5 w-3.5" />
              <span>Escala Tailwind (50-950)</span>
            </button>

            <button
              type="button"
              id="tab-btn-preview"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Vista Previa de Componente</span>
            </button>

            <button
              type="button"
              id="tab-btn-harmonies"
              onClick={() => setActiveTab('harmonies')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'harmonies'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Armonías & Neutros</span>
            </button>

            <button
              type="button"
              id="tab-btn-export"
              onClick={() => setActiveTab('export')}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'export'
                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-zinc-200/80 dark:border-zinc-700/80'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Exportar Tokens Tailwind</span>
            </button>
          </div>

          {/* Tab-specific info or actions */}
          <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500">
            {activeTab === 'shades' && (
              <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                <Info className="h-3 w-3" />
                Haz clic en cualquier tono para copiar su valor
              </span>
            )}
            {activeTab === 'preview' && (
              <div className="flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setPreviewThemeMode('light')}
                  className={`p-1 rounded ${
                    previewThemeMode === 'light'
                      ? 'bg-zinc-100 text-amber-500 font-bold'
                      : 'text-zinc-400'
                  }`}
                  title="Fondo Claro"
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewThemeMode('dark')}
                  className={`p-1 rounded ${
                    previewThemeMode === 'dark'
                      ? 'bg-zinc-900 text-indigo-400 font-bold'
                      : 'text-zinc-400'
                  }`}
                  title="Fondo Oscuro"
                >
                  <Moon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Modal Main Body Scroll Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: SHADES 50-950 */}
          {activeTab === 'shades' && (
            <div className="space-y-6">
              {/* Visual Strip Panorama */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm">
                <div className="grid grid-cols-11 h-14 sm:h-18">
                  {shades.map((shade) => {
                    const isAnchor = shade.step === '500';
                    return (
                      <div
                        key={shade.step}
                        onClick={() =>
                          handleCopy(
                            shade.hex,
                            `shade-strip-${shade.step}`,
                            `Tono ${tokenPrefix}-${shade.step} (${shade.hex}) copiado`,
                          )
                        }
                        className="relative group flex items-center justify-center cursor-pointer transition-all hover:opacity-90"
                        style={{ backgroundColor: shade.hex }}
                        title={`${tokenPrefix}-${shade.step}: ${shade.hex} (Clic para copiar)`}
                      >
                        {isAnchor && (
                          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-white ring-1 ring-black/40 shadow-xs" />
                        )}
                        <span
                          className="font-mono text-[10px] sm:text-xs font-bold transition-opacity opacity-70 group-hover:opacity-100"
                          style={{ color: shade.recommendedTextColor }}
                        >
                          {shade.step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Detailed Cards for Each Shade Step */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                {shades.map((shade) => {
                  const isAnchor = shade.step === '500';
                  const copyHexKey = `hex-${shade.step}`;
                  const copyClassKey = `class-${shade.step}`;
                  const isCopied = copiedKey === copyHexKey || copiedKey === copyClassKey;

                  return (
                    <div
                      key={shade.step}
                      id={`shade-card-${shade.step}`}
                      className={`relative flex flex-col rounded-2xl border p-4 transition-all duration-200 bg-white dark:bg-zinc-900/60 shadow-2xs hover:shadow-md ${
                        isAnchor
                          ? 'border-indigo-500/80 ring-2 ring-indigo-500/20'
                          : 'border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      {/* Top swatch and label */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="h-10 w-10 rounded-xl border border-black/10 shadow-xs shrink-0 flex items-center justify-center font-mono text-xs font-bold"
                            style={{
                              backgroundColor: shade.hex,
                              color: shade.recommendedTextColor,
                            }}
                          >
                            {shade.step}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {tokenPrefix}-{shade.step}
                              </span>
                              {isAnchor && (
                                <span className="rounded bg-indigo-100 dark:bg-indigo-950/80 px-1 py-0.2 font-mono text-[9px] font-bold text-indigo-600 dark:text-indigo-400">
                                  Base
                                </span>
                              )}
                            </div>
                            <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                              {shade.hex.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* WCAG AA indicator badge */}
                        <div
                          className="rounded-lg px-2 py-0.5 text-[10px] font-semibold border flex items-center gap-1"
                          style={{
                            backgroundColor: shade.isLight ? '#f4f4f5' : '#27272a',
                            color: shade.isLight ? '#18181b' : '#fafafa',
                            borderColor: shade.isLight ? '#e4e4e7' : '#3f3f46',
                          }}
                          title={`Contraste con texto recomendado: ${
                            shade.isLight ? shade.contrastOnBlack : shade.contrastOnWhite
                          }:1`}
                        >
                          <ShieldCheck className="h-3 w-3 text-emerald-500" />
                          <span>
                            {shade.isLight ? `${shade.contrastOnBlack}:1` : `${shade.contrastOnWhite}:1`}
                          </span>
                        </div>
                      </div>

                      {/* HSL specs */}
                      <div className="text-[10px] font-mono text-zinc-400 flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60 mb-3">
                        <span>H: {shade.hsl.h}°</span>
                        <span>S: {shade.hsl.s}%</span>
                        <span>L: {shade.hsl.l}%</span>
                      </div>

                      {/* Quick copy buttons */}
                      <div className="flex items-center gap-2 mt-auto">
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              shade.hex,
                              copyHexKey,
                              `HEX ${shade.hex} copiado`,
                            )
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          {copiedKey === copyHexKey ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-zinc-400" />
                          )}
                          <span>HEX</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              `bg-${tokenPrefix}-${shade.step}`,
                              copyClassKey,
                              `Clase bg-${tokenPrefix}-${shade.step} copiada`,
                            )
                          }
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 px-2 py-1.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          {copiedKey === copyClassKey ? (
                            <Check className="h-3 w-3 text-emerald-500" />
                          ) : (
                            <Copy className="h-3 w-3 text-zinc-400" />
                          )}
                          <span>Tailwind</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: LIVE COMPONENT PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Preview Stage Container */}
              <div
                className={`rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 transition-colors duration-200 ${
                  previewThemeMode === 'dark'
                    ? 'bg-zinc-950 text-zinc-100'
                    : 'bg-zinc-50/80 text-zinc-900'
                }`}
              >
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* Banner Header inside preview */}
                  <div
                    className="rounded-2xl p-5 border transition-all"
                    style={{
                      backgroundColor: previewThemeMode === 'dark' ? shade950 : shade50,
                      borderColor: previewThemeMode === 'dark' ? shade800 : shade200,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center shadow-xs"
                        style={{
                          backgroundColor: shade500,
                          color: primaryShade.recommendedTextColor,
                        }}
                      >
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <h4
                          className="text-sm font-bold tracking-tight"
                          style={{
                            color: previewThemeMode === 'dark' ? shade100 : shade900,
                          }}
                        >
                          Tema Personalizado &apos;{tokenPrefix}&apos; Activo
                        </h4>
                        <p
                          className="text-xs mt-0.5"
                          style={{
                            color: previewThemeMode === 'dark' ? shade200 : shade700,
                          }}
                        >
                          Comprobación visual en tiempo real de botones, tarjetas, inputs y badges con el color primario {primaryShade.hex}.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Component Showcase 1: Buttons & Actions */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      1. Botones & Acciones
                    </span>
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Solid Primary Button */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold shadow-xs transition-all cursor-pointer hover:opacity-95 active:scale-98"
                        style={{
                          backgroundColor: shade500,
                          color: primaryShade.recommendedTextColor,
                        }}
                      >
                        <span>Acción Primaria</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>

                      {/* Outline Secondary Button */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-semibold transition-all cursor-pointer hover:opacity-90"
                        style={{
                          borderColor: shade500,
                          color: previewThemeMode === 'dark' ? shade200 : shade700,
                          backgroundColor: previewThemeMode === 'dark' ? shade950 : shade50,
                        }}
                      >
                        <span>Secundario Outline</span>
                      </button>

                      {/* Subtle Ghost Button */}
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all cursor-pointer hover:opacity-80"
                        style={{
                          color: previewThemeMode === 'dark' ? shade200 : shade700,
                          backgroundColor: previewThemeMode === 'dark' ? `${shade900}80` : shade100,
                        }}
                      >
                        <span>Botón Sutil</span>
                      </button>
                    </div>
                  </div>

                  {/* Component Showcase 2: Badges & Chips */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      2. Badges & Píldoras de Estado
                    </span>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border"
                        style={{
                          backgroundColor: previewThemeMode === 'dark' ? shade950 : shade50,
                          borderColor: previewThemeMode === 'dark' ? shade800 : shade200,
                          color: previewThemeMode === 'dark' ? shade200 : shade700,
                        }}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: shade500 }}
                        />
                        <span>{tokenPrefix}-500 Activo</span>
                      </span>

                      <span
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-bold"
                        style={{
                          backgroundColor: shade500,
                          color: primaryShade.recommendedTextColor,
                        }}
                      >
                        Nuevo
                      </span>

                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-medium border"
                        style={{
                          backgroundColor: previewThemeMode === 'dark' ? `${shade900}60` : shade100,
                          borderColor: shade300,
                          color: previewThemeMode === 'dark' ? shade100 : shade900,
                        }}
                      >
                        HEX: {primaryShade.hex}
                      </span>
                    </div>
                  </div>

                  {/* Component Showcase 3: Form Controls & Inputs */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      3. Inputs & Controles Interactivos
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Text Input with Brand Focus Ring */}
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-zinc-500 dark:text-zinc-400">
                          Campo de Texto con Anillo de Foco
                        </label>
                        <input
                          type="text"
                          value={sampleInputValue}
                          onChange={(e) => setSampleInputValue(e.target.value)}
                          className="w-full h-10 rounded-xl px-3 text-xs border transition-all"
                          style={{
                            borderColor: shade500,
                            boxShadow: `0 0 0 3px ${shade500}33`,
                            backgroundColor: previewThemeMode === 'dark' ? '#18181b' : '#ffffff',
                            color: previewThemeMode === 'dark' ? '#f4f4f5' : '#18181b',
                          }}
                        />
                      </div>

                      {/* Toggle Switch */}
                      <div>
                        <label className="block text-xs font-medium mb-1.5 text-zinc-500 dark:text-zinc-400">
                          Interruptor Toggle
                        </label>
                        <div className="flex items-center gap-3 pt-1">
                          <button
                            type="button"
                            onClick={() => setSwitchActive(!switchActive)}
                            className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out"
                            style={{
                              backgroundColor: switchActive ? shade500 : '#71717a',
                            }}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                switchActive ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className="text-xs font-medium">
                            {switchActive ? 'Habilitado' : 'Deshabilitado'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Component Showcase 4: Accent Top-Border Card */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      4. Tarjeta con Acento Superior & Métrica
                    </span>
                    <div
                      className="rounded-2xl border p-5 transition-all shadow-md"
                      style={{
                        borderTopWidth: '4px',
                        borderTopColor: shade500,
                        backgroundColor: previewThemeMode === 'dark' ? '#18181b' : '#ffffff',
                        borderColor: previewThemeMode === 'dark' ? '#27272a' : '#e4e4e7',
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs font-medium text-zinc-400">
                            Métrica Clave
                          </span>
                          <h5 className="text-2xl font-bold font-mono tracking-tight mt-1">
                            84.6%
                          </h5>
                          <p className="text-xs text-zinc-500 mt-1">
                            Rendimiento optimizado con la paleta activa.
                          </p>
                        </div>
                        <span
                          className="rounded-lg px-2.5 py-1 text-xs font-bold"
                          style={{
                            backgroundColor: previewThemeMode === 'dark' ? shade950 : shade50,
                            color: previewThemeMode === 'dark' ? shade200 : shade700,
                            borderColor: shade300,
                          }}
                        >
                          +12.4%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: HARMONIES & NEUTRALS */}
          {activeTab === 'harmonies' && (
            <div className="space-y-8">
              {/* Color Harmonies Grid */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Armonías Cromáticas Derivadas
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Colores complementarios, análogos y triádicos calculados en el círculo cromático respecto a tu color primario.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {harmonies.map((harm) => {
                    const harmShade = generateTailwindShades(harm.hex)[5];
                    const isCopied = copiedKey === `harm-${harm.name}`;

                    return (
                      <div
                        key={harm.name}
                        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="h-9 w-9 rounded-xl border border-black/10 shadow-xs shrink-0"
                              style={{ backgroundColor: harm.hex }}
                            />
                            <div>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                                {harm.name}
                              </h4>
                              <span className="font-mono text-[11px] text-zinc-500">
                                {harm.hex.toUpperCase()} ({harm.angle > 0 ? `+${harm.angle}` : harm.angle}°)
                              </span>
                            </div>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-3 leading-relaxed">
                          {harm.description}
                        </p>

                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                          <button
                            type="button"
                            onClick={() => handleHexChange(harm.hex)}
                            className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 px-2 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-colors cursor-pointer"
                            title="Establecer como nuevo color primario del generador"
                          >
                            <span>Usar como Primario</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                harm.hex,
                                `harm-${harm.name}`,
                                `HEX ${harm.hex} copiado`,
                              )
                            }
                            className="p-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
                            title="Copiar HEX"
                          >
                            {isCopied ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tinted Neutrals Scale */}
              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Neutros Tintados con el Tono Primario ({tokenPrefix}-slate)
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Grises sofisticados tintados sutilmente con el matiz de tu color primario (~7% saturación). Diseñados para fondos, bordes y superficies en armonía visual perfecta.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
                  {tintedNeutrals.map((nShade) => (
                    <div
                      key={nShade.step}
                      onClick={() =>
                        handleCopy(
                          nShade.hex,
                          `neutral-${nShade.step}`,
                          `Neutro tintado ${tokenPrefix}-neutral-${nShade.step} (${nShade.hex}) copiado`,
                        )
                      }
                      className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-2.5 bg-white dark:bg-zinc-900/60 cursor-pointer hover:border-indigo-400 transition-all group"
                    >
                      <div
                        className="h-8 rounded-lg mb-2 shadow-2xs border border-black/5"
                        style={{ backgroundColor: nShade.hex }}
                      />
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="font-bold text-zinc-700 dark:text-zinc-300">
                          {nShade.step}
                        </span>
                        <span className="text-zinc-400">{nShade.hex.toUpperCase()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EXPORT TAILWIND TOKENS */}
          {activeTab === 'export' && (
            <div className="space-y-5">
              {/* Format selection buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExportFormat('tailwind-v4')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      exportFormat === 'tailwind-v4'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Tailwind v4 (@theme)
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('tailwind-v3')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      exportFormat === 'tailwind-v3'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Tailwind v3 (config)
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('css-vars')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      exportFormat === 'css-vars'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Variables CSS (:root)
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('ts-theme')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      exportFormat === 'ts-theme'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    TypeScript Theme Object
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('classes')}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                      exportFormat === 'classes'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                    }`}
                  >
                    Cheat Sheet Clases
                  </button>
                </div>

                {/* Copy full formatted code button */}
                <button
                  type="button"
                  id="btn-copy-all-tailwind-tokens"
                  onClick={() =>
                    handleCopy(
                      formattedCode,
                      'all-code',
                      '¡Tokens de Tailwind copiados al portapapeles!',
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {copiedKey === 'all-code' ? (
                    <Check className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  <span>{copiedKey === 'all-code' ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              {/* Code display block */}
              <div className="relative rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 text-zinc-200 p-4 font-mono text-xs overflow-x-auto shadow-inner">
                <pre className="leading-relaxed whitespace-pre font-mono">
                  {formattedCode}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: primaryShade.hex }}
            />
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Color activo: <strong className="font-mono text-zinc-800 dark:text-zinc-200">{primaryShade.hex.toUpperCase()}</strong> (Tono 500)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onApplyToLabTheme && (
              <button
                type="button"
                id="btn-apply-palette-to-lab"
                onClick={() => {
                  onApplyToLabTheme(primaryShade.hex, tokenPrefix);
                  onToast(`¡Paleta ${tokenPrefix} (${primaryShade.hex}) aplicada al laboratorio!`);
                  onClose();
                }}
                className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 px-3.5 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-colors cursor-pointer"
                title="Aplicar este color primario a la vista actual"
              >
                Aplicar al Laboratorio
              </button>
            )}

            <button
              type="button"
              id="btn-close-palette-modal-footer"
              onClick={onClose}
              className="rounded-xl bg-zinc-200 dark:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
