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
  Sun,
  Moon,
  Info,
} from 'lucide-react';

import {
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
import type { ExportFormat } from './palette/types';
import { PaletteShadesTab } from './palette/PaletteShadesTab';
import { PaletteHarmoniesTab } from './palette/PaletteHarmoniesTab';
import { PaletteExportTab } from './palette/PaletteExportTab';
import { PalettePreviewTab } from './palette/PalettePreviewTab';

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

  if (!isOpen) return null;

  // Dynamic styling helper for live preview
  const shade500 = shades.find((s) => s.step === '500')?.hex || '#6366f1';
  const shade600 = shades.find((s) => s.step === '600')?.hex || '#4f46e5';

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
            <PaletteShadesTab
              shades={shades}
              tokenPrefix={tokenPrefix}
              copiedKey={copiedKey}
              handleCopy={handleCopy}
            />
          )}

          {/* TAB 2: LIVE COMPONENT PREVIEW */}
          {activeTab === 'preview' && (
            <PalettePreviewTab
              shades={shades}
              primaryShade={primaryShade}
              previewThemeMode={previewThemeMode}
              tokenPrefix={tokenPrefix}
            />
          )}

          {/* TAB 3: HARMONIES & NEUTRALS */}
          {activeTab === 'harmonies' && (
            <PaletteHarmoniesTab
              harmonies={harmonies}
              tintedNeutrals={tintedNeutrals}
              tokenPrefix={tokenPrefix}
              copiedKey={copiedKey}
              handleCopy={handleCopy}
              handleHexChange={handleHexChange}
            />
          )}

          {/* TAB 4: EXPORT TAILWIND TOKENS */}
          {activeTab === 'export' && (
            <PaletteExportTab
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              formattedCode={formattedCode}
              primaryShade={primaryShade}
              tokenPrefix={tokenPrefix}
              copiedKey={copiedKey}
              handleCopy={handleCopy}
            />
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
