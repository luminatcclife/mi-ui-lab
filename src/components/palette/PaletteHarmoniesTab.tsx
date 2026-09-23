import React from 'react';
import { Copy, Check } from 'lucide-react';
import { generateTailwindShades } from '../../utils/colorPaletteGenerator';
import type { CopyHandler } from './types';
import type { ColorHarmony, PaletteShade } from '../../utils/colorPaletteGenerator';

export interface PaletteHarmoniesTabProps {
  harmonies: ColorHarmony[];
  tintedNeutrals: PaletteShade[];
  tokenPrefix: string;
  copiedKey: string | null;
  handleCopy: CopyHandler;
  handleHexChange: (newHex: string) => void;
}

/** Pestaña "Armonías & Neutros": colores armónicos y neutros teñidos del primario. */
export function PaletteHarmoniesTab({ harmonies, tintedNeutrals, tokenPrefix, copiedKey, handleCopy, handleHexChange }: PaletteHarmoniesTabProps) {
  return (
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
  );
}
