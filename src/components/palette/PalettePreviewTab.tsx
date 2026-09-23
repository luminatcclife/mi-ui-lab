import { useState } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import type { PaletteShade } from '../../utils/colorPaletteGenerator';

export interface PalettePreviewTabProps {
  shades: PaletteShade[];
  primaryShade: PaletteShade;
  previewThemeMode: 'light' | 'dark';
  tokenPrefix: string;
}

/** Pestaña "Vista Previa de Componente": la paleta aplicada a controles de ejemplo. */
export function PalettePreviewTab({ shades, primaryShade, previewThemeMode, tokenPrefix }: PalettePreviewTabProps) {
  const [switchActive, setSwitchActive] = useState(true);
  const [sampleInputValue, setSampleInputValue] = useState('Texto de ejemplo...');
  const shadeHex = (step: string, fallback: string) => shades.find((s) => s.step === step)?.hex || fallback;
  const shade50 = shadeHex('50', '#f5f7ff');
  const shade100 = shadeHex('100', '#ebf0fe');
  const shade200 = shadeHex('200', '#d8e1fd');
  const shade300 = shadeHex('300', '#c7d2fe');
  const shade400 = shadeHex('400', '#818cf8');
  const shade500 = shadeHex('500', '#6366f1');
  const shade600 = shadeHex('600', '#4f46e5');
  const shade700 = shadeHex('700', '#4338ca');
  const shade800 = shadeHex('800', '#3730a3');
  const shade900 = shadeHex('900', '#312e81');
  const shade950 = shadeHex('950', '#1e1b4b');

  return (
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
  );
}
