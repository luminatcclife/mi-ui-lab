import React from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import type { CopyHandler } from './types';
import type { PaletteShade } from '../../utils/colorPaletteGenerator';

export interface PaletteShadesTabProps {
  shades: PaletteShade[];
  tokenPrefix: string;
  copiedKey: string | null;
  handleCopy: CopyHandler;
}

/** Pestaña "Escala Tailwind (50-950)" del generador de paletas. */
export function PaletteShadesTab({ shades, tokenPrefix, copiedKey, handleCopy }: PaletteShadesTabProps) {
  return (
    <div className="space-y-6">
      {/* Visual Strip Panorama */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
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
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-white ring-1 ring-black/40" />
                )}
                <span
                  className="font-mono text-sm sm:text-xs font-semibold transition-opacity opacity-70 group-hover:opacity-100"
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
              className={`relative flex flex-col rounded-xl border p-4 transition-all duration-200 bg-white dark:bg-zinc-900 ${
                isAnchor
                  ? 'border-2 border-violet-600 dark:border-violet-400'
                  : 'border-zinc-200 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              {/* Top swatch and label */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className="h-10 w-10 rounded-xl border border-black/10 shrink-0 flex items-center justify-center font-mono text-sm font-semibold"
                    style={{
                      backgroundColor: shade.hex,
                      color: shade.recommendedTextColor,
                    }}
                  >
                    {shade.step}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {tokenPrefix}-{shade.step}
                      </span>
                      {isAnchor && (
                        <span className="rounded bg-indigo-100 dark:bg-indigo-950/80 px-1 py-0.2 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                          Base
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                      {shade.hex.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* WCAG AA indicator badge */}
                <div
                  className="rounded-lg px-2 py-0.5 text-sm font-semibold border flex items-center gap-1"
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
              <div className="text-sm font-mono text-zinc-600 dark:text-zinc-400 flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/60 mb-3">
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
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-500 dark:border-zinc-400 px-2 text-sm text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  {copiedKey === copyHexKey ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
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
                  className="inline-flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-zinc-500 dark:border-zinc-400 px-2 text-sm text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  {copiedKey === copyClassKey ? (
                    <Check className="h-3 w-3 text-emerald-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                  )}
                  <span>Tailwind</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
