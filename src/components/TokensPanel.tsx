import React, { useState } from 'react';
import { X, Check, Copy, Sparkles, Hash, Palette, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { DESIGN_TOKENS } from '../data/tokens';

interface TokensPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  onOpenPaletteGenerator?: () => void;
}

export function TokensPanel({ isOpen, onClose, onToast, onOpenPaletteGenerator }: TokensPanelProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(text);
    onToast(`Token copiado: ${label}`);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div
      id="tokens-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="tokens-modal-container"
        className="relative flex max-h-[85vh] w-full max-w-4xl flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Tokens & Tipografías de mi-ui-lab
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Tu sistema de diseño propio: tokens sin dependencias externas, con soporte para temas Claro y Oscuro.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Palette Generator Quick Action Banner */}
          {onOpenPaletteGenerator && (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-indigo-200 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/80 via-white to-purple-50/60 dark:from-indigo-950/40 dark:via-zinc-900/60 dark:to-purple-950/30 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs shrink-0">
                  <Palette className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Generador Visual de Paletas Tailwind
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Genera la escala completa 50-950 a partir de cualquier color primario, ratios de contraste WCAG y exporta tokens para tus componentes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="btn-tokens-to-palette-generator"
                onClick={() => {
                  onClose();
                  onOpenPaletteGenerator();
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
              >
                <span>Abrir Generador</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Typography System Information */}
          <div className="rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/50 dark:bg-indigo-950/20 p-5">
            <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">
              Sistemas Tipográficos por Tema
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    🌙 Tema Oscuro
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Plus Jakarta Sans
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Tipografía geométrica con alta apertura visual para contrastes nítidos sobre fondos oscuros.
                </p>
                <div className="mt-2 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  font-family: &apos;Plus Jakarta Sans&apos;, sans-serif
                </div>
              </div>

              <div className="rounded-xl bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    ☀️ Tema Claro
                  </span>
                  <span className="font-mono text-[10px] text-zinc-400">
                    Outfit
                  </span>
                </div>
                <p className="text-zinc-500 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Tipografía humanista de estudio que equilibra legibilidad cálida y jerarquía limpia en modo diurno.
                </p>
                <div className="mt-2 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  font-family: &apos;Outfit&apos;, sans-serif
                </div>
              </div>
            </div>
          </div>

          {DESIGN_TOKENS.map((category) => (
            <div key={category.category} className="space-y-3">
              <div className="border-b border-zinc-200 dark:border-zinc-800/60 pb-2">
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  {category.category}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{category.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {category.items.map((token) => {
                  const isCopied = copiedToken === token.tailwindClass;
                  return (
                    <motion.div
                      whileTap={{ scale: 0.98 }}
                      key={token.name}
                      onClick={() => handleCopy(token.tailwindClass, token.name)}
                      className={`group relative flex flex-col justify-between rounded-xl border p-3.5 transition-all duration-200 cursor-pointer shadow-xs ${
                        isCopied
                          ? 'border-emerald-500/60 bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-500/30'
                          : 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/60 hover:border-indigo-400 dark:hover:border-zinc-700 hover:bg-white dark:hover:bg-zinc-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {token.name}
                        </span>
                        <div
                          className={`transition-opacity ${
                            isCopied ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                          }`}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {isCopied ? (
                              <motion.span
                                key="check"
                                initial={{ scale: 0.5, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                exit={{ scale: 0.5 }}
                                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400"
                              >
                                <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="copy"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-zinc-400 hover:text-indigo-600 dark:hover:text-white"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                    {/* Preview visual depending on token type */}
                    {token.previewType === 'color' && (
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="h-6 w-6 rounded-md border border-zinc-300 dark:border-white/10 shrink-0 shadow-xs"
                          style={{
                            backgroundColor: token.value.split(' ')[0],
                          }}
                        />
                        <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                          {token.value}
                        </span>
                      </div>
                    )}

                    {token.previewType === 'text' && (
                      <div className="mb-2">
                        <span className={`block text-zinc-800 dark:text-zinc-200 ${token.tailwindClass}`}>
                          Aa Bb 123
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-1 block">
                          {token.value}
                        </span>
                      </div>
                    )}

                    {token.previewType === 'radius' && (
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`h-8 w-12 border border-indigo-500/40 bg-indigo-500/10 ${token.tailwindClass}`}
                        />
                        <span className="text-[11px] font-mono text-zinc-600 dark:text-zinc-400">
                          {token.value}
                        </span>
                      </div>
                    )}

                    <div className="mt-2 pt-2 border-t border-zinc-200 dark:border-zinc-800/60">
                      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                        <span className="truncate">{token.tailwindClass}</span>
                        <span className="shrink-0 text-indigo-600 dark:text-indigo-400 ml-1">clic para copiar</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-200 dark:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-700 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
