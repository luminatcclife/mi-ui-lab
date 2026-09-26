import { MODAL_OVERLAY_CLASS, ModalHeader, modalBtn, modalPanelClass } from './ModalFrame';
import React, { useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import { Check, Copy, ArrowRight } from 'lucide-react';
import { DESIGN_TOKENS } from '../data/tokens';

interface TokensPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (msg: string) => void;
  onOpenPaletteGenerator?: () => void;
}

export function TokensPanel({ isOpen, onClose, onToast, onOpenPaletteGenerator }: TokensPanelProps) {
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedToken(text);
      onToast(`Token copiado: ${label}`);
      setTimeout(() => setCopiedToken(null), 2000);
    } catch {
      onToast('⚠ No se pudo copiar al portapapeles');
    }
  };

  return (
    <div
      id="tokens-modal-overlay"
      className={MODAL_OVERLAY_CLASS}
    >
      <div
        id="tokens-modal-container"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tokens-modal-title"
        tabIndex={-1}
        className={modalPanelClass('max-w-4xl')}
      >
        <ModalHeader
          caption="Sistema"
          title="Tokens y tipografía"
          titleId="tokens-modal-title"
          description="Los tokens de mi-ui-lab, sin dependencias externas, para el tema papel y el tema noche."
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-10">
            {onOpenPaletteGenerator && (
              <div className="flex flex-col gap-4 rounded-xl bg-violet-100 dark:bg-violet-900 px-5 py-4 sm:flex-row sm:items-center">
                <span className="mono-label self-start rounded-full bg-violet-600 px-3 py-1 text-xs text-white dark:bg-violet-400 dark:text-zinc-950 sm:self-center">
                  Truco
                </span>
                <p className="flex-1 text-base leading-[26px]">
                  ¿Quieres tu propia escala? El generador calcula los tonos del 50 al 950 a partir de un color y revisa sus contrastes.
                </p>
                <button
                  type="button"
                  id="btn-tokens-to-palette-generator"
                  onClick={() => {
                    onClose();
                    onOpenPaletteGenerator();
                  }}
                  className={modalBtn.ink}
                >
                  Abrir generador
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {DESIGN_TOKENS.map((category) => {
              return (
                <section key={category.category} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="font-display text-[22px] leading-7">{category.category}</h3>
                    <p className="text-base text-zinc-600 dark:text-zinc-300">{category.description}</p>
                  </div>

                  <div className={`grid gap-3 ${category.items[0]?.previewType === 'text' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                    {category.items.map((token) => {
                      const isCopied = copiedToken === token.tailwindClass;
                      return (
                        <button
                          type="button"
                          key={token.name}
                          onClick={() => handleCopy(token.tailwindClass, token.name)}
                          title="Copiar la clase"
                          className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-left transition-colors hover:border-zinc-500 dark:hover:border-zinc-500 cursor-pointer"
                        >
                          {token.previewType === 'color' && (
                            <span className="flex items-center gap-3">
                              <span
                                className="h-10 w-10 shrink-0 rounded-lg border border-zinc-300 dark:border-zinc-700"
                                style={{ backgroundColor: token.value }}
                              />
                              <span className="flex min-w-0 flex-col">
                                <span className="text-base font-semibold">{token.name}</span>
                                <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-300">{token.value}</span>
                              </span>
                            </span>
                          )}
                          {token.previewType === 'text' && (
                            <span className="flex flex-col gap-1">
                              <span className="flex items-baseline justify-between gap-3">
                                <span className="text-base font-semibold">{token.name}</span>
                                <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-300">{token.value}</span>
                              </span>
                              <span className={`block truncate ${token.tailwindClass}`}>Egun on, mi-ui-lab</span>
                            </span>
                          )}
                          {token.previewType === 'radius' && (
                            <span className="flex items-center gap-3">
                              <span className={`h-10 w-14 shrink-0 border-2 border-zinc-900 dark:border-zinc-50 bg-zinc-100 dark:bg-zinc-800 ${token.tailwindClass}`} />
                              <span className="flex flex-col">
                                <span className="text-base font-semibold">{token.name}</span>
                                <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-300">{token.value}</span>
                              </span>
                            </span>
                          )}
                          <span className="text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">{token.description}</span>
                          <span className="flex items-center justify-between gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-3">
                            <code className="truncate font-mono text-[13px]">{token.tailwindClass}</code>
                            {isCopied ? (
                              <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Copy className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className={modalBtn.secondary}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
