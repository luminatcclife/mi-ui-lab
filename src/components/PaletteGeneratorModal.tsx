import { MODAL_OVERLAY_CLASS, ModalHeader, modalBtn, modalPanelClass } from './ModalFrame';
import React, { useState, useMemo } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import { Copy, Check, Dices } from 'lucide-react';

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

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  // Dynamic styling helper for live preview
  const shade500 = shades.find((s) => s.step === '500')?.hex || '#6366f1';
  const shade600 = shades.find((s) => s.step === '600')?.hex || '#4f46e5';

  return (
    <div
      id="palette-generator-modal-overlay"
      className={MODAL_OVERLAY_CLASS}
    >
      <div
        id="palette-generator-container"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="palette-modal-title"
        tabIndex={-1}
        className={modalPanelClass('max-w-5xl', 'h-full')}
      >
        <ModalHeader
          caption="Paleta"
          title="Generador de paletas"
          titleId="palette-modal-title"
          description="Calcula la escala del 50 al 950, revisa contrastes WCAG y exporta los tokens en CSS o Tailwind."
          onClose={onClose}
          closeButtonId="close-palette-generator-btn"
          leading={
            <span
              aria-hidden="true"
              className="mt-1 hidden h-12 w-12 shrink-0 rounded-xl border sm:block"
              style={{ backgroundColor: shade500, borderColor: shade600 }}
            />
          }
        />

        {/* Color de partida */}
        <div className="flex shrink-0 flex-col gap-4 border-b border-zinc-200 dark:border-zinc-800 px-6 py-5 sm:px-8">
          <div className="flex flex-wrap items-center gap-3">
            <label
              htmlFor="primary-color-picker-input"
              className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border-2"
              style={{ backgroundColor: primaryShade.hex, borderColor: primaryShade.isLight ? '#8a7660' : '#2a1f1a' }}
              title="Abrir el selector de color"
            >
              <span className="sr-only">Elegir color</span>
              <input
                type="color"
                id="primary-color-picker-input"
                value={primaryShade.hex}
                onChange={(e) => handleHexChange(e.target.value)}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </label>

            <label className="relative flex items-center">
              <span className="sr-only">Color en hexadecimal</span>
              <span className="pointer-events-none absolute left-3.5 font-mono text-base text-zinc-600 dark:text-zinc-300">#</span>
              <input
                type="text"
                id="primary-hex-text-input"
                value={hexInput.replace(/^#/, '')}
                onChange={(e) => handleHexChange('#' + e.target.value)}
                maxLength={7}
                placeholder="6366F1"
                className="h-11 w-32 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 pl-7 pr-3 font-mono text-base uppercase text-zinc-900 dark:text-zinc-50"
              />
            </label>

            <span className="hidden font-mono text-sm text-zinc-600 dark:text-zinc-300 md:inline">
              rgb({primaryShade.rgb.r}, {primaryShade.rgb.g}, {primaryShade.rgb.b}) · hsl({primaryShade.hsl.h}°, {primaryShade.hsl.s}%, {primaryShade.hsl.l}%)
            </span>

            <button
              type="button"
              id="btn-random-primary-color"
              onClick={handleRandomizeColor}
              title="Probar un color al azar"
              className={modalBtn.secondary}
            >
              <Dices className="h-4 w-4" />
              Al azar
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label htmlFor="token-prefix-input" className="text-sm text-zinc-600 dark:text-zinc-300">
                Prefijo
              </label>
              <input
                type="text"
                id="token-prefix-input"
                value={tokenPrefix}
                onChange={(e) => setTokenPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                placeholder="brand"
                maxLength={14}
                className="h-11 w-28 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3 font-mono text-base text-zinc-900 dark:text-zinc-50"
              />
              <button
                type="button"
                id="btn-copy-primary-hex"
                onClick={() => handleCopy(primaryShade.hex, 'primary-hex', `HEX ${primaryShade.hex} copiado al portapapeles`)}
                title="Copiar el HEX del tono 500"
                className={modalBtn.secondary}
              >
                {copiedKey === 'primary-hex' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedKey === 'primary-hex' ? 'Copiado' : 'Copiar 500'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="mono-label shrink-0 text-xs text-zinc-600 dark:text-zinc-300">Empieza con</span>
            {PRESET_PRIMARIES.map((preset) => {
              const isCurrent = primaryShade.hex.toLowerCase() === preset.hex.toLowerCase();
              return (
                <button
                  key={preset.hex}
                  type="button"
                  id={`preset-${preset.hex.replace('#', '')}`}
                  onClick={() => handleHexChange(preset.hex)}
                  aria-pressed={isCurrent}
                  title={`${preset.name} (${preset.hex})`}
                  className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors cursor-pointer ${
                    isCurrent
                      ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                      : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/15" style={{ backgroundColor: preset.hex }} />
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Pestañas */}
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 px-6 sm:px-8">
          <div role="tablist" aria-label="Secciones de la paleta" className="flex gap-6 overflow-x-auto">
            {(
              [
                ['shades', 'Escala 50–950'],
                ['preview', 'Vista previa'],
                ['harmonies', 'Armonías y neutros'],
                ['export', 'Exportar'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                id={`tab-btn-${id}`}
                aria-selected={activeTab === id}
                onClick={() => setActiveTab(id)}
                className={`-mb-px min-h-11 whitespace-nowrap border-b-2 text-base transition-colors cursor-pointer ${
                  activeTab === id
                    ? 'border-indigo-600 dark:border-indigo-400 font-semibold text-zinc-900 dark:text-zinc-50'
                    : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden pb-2 md:block">
            {activeTab === 'shades' && <span className="text-sm text-zinc-600 dark:text-zinc-300">Pulsa un tono para copiarlo</span>}
            {activeTab === 'preview' && (
              <div role="group" aria-label="Fondo de la vista previa" className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                {(
                  [
                    ['light', 'Claro'],
                    ['dark', 'Oscuro'],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={previewThemeMode === mode}
                    onClick={() => setPreviewThemeMode(mode)}
                    className={`min-h-8 rounded-lg px-3 text-sm cursor-pointer ${
                      previewThemeMode === mode
                        ? 'bg-white dark:bg-zinc-900 font-semibold text-zinc-900 dark:text-zinc-50 shadow-[var(--app-shadow-card)]'
                        : 'text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Main Body Scroll Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 space-y-6">
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

        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 sm:px-8">
          <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <span className="h-4 w-4 shrink-0 rounded-full border border-black/15" style={{ backgroundColor: primaryShade.hex }} />
            Tono 500: <strong className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">{primaryShade.hex.toUpperCase()}</strong>
          </span>
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
                title="Aplicar este color a la vista actual"
                className={modalBtn.primary}
              >
                Aplicar al laboratorio
              </button>
            )}
            <button type="button" id="btn-close-palette-modal-footer" onClick={onClose} className={modalBtn.secondary}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
