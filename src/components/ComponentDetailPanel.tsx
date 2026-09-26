import React, { useState } from 'react';
import { Copy, Check, Star, Plus, X, ArrowRight } from 'lucide-react';
import { UIComponent } from '../types';
import { InteractiveComponentRenderer } from './InteractiveComponentRenderer';
import { CodeViewer } from './CodeViewer';
import { PropsTable } from './PropsTable';
import { CATEGORY_LABELS } from './libraryCategories';

type DetailTab = 'resumen' | 'code' | 'props' | 'tokens' | 'versions';

interface ComponentDetailPanelProps {
  component: UIComponent;
  onToast: (msg: string) => void;
  onOpenIteration?: (comp: UIComponent) => void;
  /** Solo se ofrece para piezas propias. */
  onEditComponent?: (comp: UIComponent) => void;
  onOpenCompare?: (componentId: string) => void;
  onPlayInPlayground: (componentId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  activeTags?: string[];
  onToggleTagFilter?: (tag: string) => void;
  onAddTagToComponent?: (componentId: string, newTag: string) => void;
  onRemoveTagFromComponent?: (componentId: string, tag: string) => void;
  onOpenPaletteGenerator?: (primaryHex?: string) => void;
}

const outlineBtn =
  'inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer';

const segmentBtn = (active: boolean) =>
  `min-h-9 rounded-lg px-3.5 text-sm transition-colors cursor-pointer ${
    active
      ? 'bg-white dark:bg-zinc-900 font-semibold text-zinc-900 dark:text-zinc-50 shadow-[var(--app-shadow-card)]'
      : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
  }`;

/**
 * Ficha de referencia de UNA pieza ya guardada: resumen visual de sus
 * variantes, código, props, tokens y versiones. A diferencia del
 * Playground, aquí no hay edición en vivo de props — es la "hoja técnica"
 * de la pieza; para jugar con ella de verdad está el botón
 * "Probar en Playground".
 */
export function ComponentDetailPanel({
  component,
  onToast,
  onOpenIteration,
  onEditComponent,
  onOpenCompare,
  onPlayInPlayground,
  isFavorite = false,
  onToggleFavorite,
  activeTags = [],
  onToggleTagFilter,
  onAddTagToComponent,
  onRemoveTagFromComponent,
  onOpenPaletteGenerator,
}: ComponentDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>('resumen');
  const [codeType, setCodeType] = useState<'implementation' | 'usage'>('implementation');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagText, setNewTagText] = useState('');

  const copy = async (text: string, key: string, toastMsg: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      onToast(toastMsg);
      setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
    } catch {
      onToast('No se pudo copiar al portapapeles');
    }
  };

  const confirmNewTag = () => {
    const clean = newTagText.trim().toLowerCase().replace(/^#/, '');
    if (clean && onAddTagToComponent) onAddTagToComponent(component.id, clean);
    setIsAddingTag(false);
    setNewTagText('');
  };

  const versionCount = component.versionHistory?.length || 1;
  const tabs: { id: DetailTab; label: string }[] = [
    { id: 'resumen', label: 'Variantes' },
    { id: 'code', label: 'Código' },
    { id: 'props', label: 'Props' },
    { id: 'tokens', label: `Tokens (${component.tokensUsed.length})` },
    { id: 'versions', label: `Versiones (${versionCount})` },
  ];

  const history =
    component.versionHistory && component.versionHistory.length > 0
      ? component.versionHistory
      : [
          {
            version: component.version || '1.0.0',
            date: component.createdAt?.split('T')[0] || '2026-09-15',
            notes: 'Versión base inicial registrada en la biblioteca.',
            changes: ['Lanzamiento inicial de la pieza'],
          },
        ];

  return (
    <section id="component-detail-panel" className="flex flex-col gap-8 text-zinc-900 dark:text-zinc-50">
      {/* Cabecera */}
      <header className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="mono-label text-xs text-zinc-600 dark:text-zinc-300">
            {CATEGORY_LABELS[component.category]} · <span className="font-mono normal-case tracking-normal">v{component.version || '1.0.0'}</span>
            {component.isCustom && <span className="text-emerald-600 dark:text-emerald-400"> · Propia</span>}
          </span>
          <h1 className="font-display text-[40px] leading-[46px]">{component.name}</h1>
          <p className="max-w-3xl text-[19px] leading-[30px] text-zinc-600 dark:text-zinc-300">{component.description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {component.tags.map((tag) => {
            const isTagActive = activeTags.includes(tag.toLowerCase());
            return (
              <span
                key={tag}
                className={`inline-flex items-center rounded-full border text-sm ${
                  isTagActive
                    ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                    : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onToggleTagFilter?.(tag)}
                  aria-pressed={isTagActive}
                  title={`${isTagActive ? 'Quitar filtro' : 'Filtrar por'} #${tag}`}
                  className={`py-1 pl-3 cursor-pointer ${onRemoveTagFromComponent ? 'pr-1' : 'pr-3'}`}
                >
                  #{tag}
                </button>
                {onRemoveTagFromComponent && (
                  <button
                    type="button"
                    onClick={() => onRemoveTagFromComponent(component.id, tag)}
                    aria-label={`Quitar la etiqueta #${tag}`}
                    className="mr-1 flex h-6 w-6 items-center justify-center rounded-full opacity-60 hover:opacity-100 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </span>
            );
          })}
          {onAddTagToComponent &&
            (!isAddingTag ? (
              <button
                type="button"
                onClick={() => {
                  setIsAddingTag(true);
                  setNewTagText('');
                }}
                className="inline-flex items-center gap-1 rounded-full border border-dashed border-zinc-500 dark:border-zinc-400 px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Añadir etiqueta
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-violet-600 dark:border-violet-400 bg-white dark:bg-zinc-900 py-0.5 pl-3 pr-1">
                <input
                  autoFocus
                  type="text"
                  aria-label="Nueva etiqueta"
                  placeholder="nueva etiqueta"
                  value={newTagText}
                  onChange={(e) => setNewTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      confirmNewTag();
                    } else if (e.key === 'Escape') {
                      setIsAddingTag(false);
                    }
                  }}
                  className="w-32 bg-transparent text-sm text-zinc-900 dark:text-zinc-50 outline-none"
                />
                <button type="button" onClick={confirmNewTag} aria-label="Añadir" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setIsAddingTag(false)} aria-label="Cancelar" className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            id="btn-play-in-playground"
            onClick={() => onPlayInPlayground(component.id)}
            title="Abrir esta pieza en el Playground para interactuar en vivo"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-indigo-600 px-5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-400 dark:text-zinc-950 dark:hover:bg-indigo-300 cursor-pointer"
          >
            Probar en Playground
            <ArrowRight className="h-4 w-4" />
          </button>
          {onToggleFavorite && (
            <button
              type="button"
              id="btn-toggle-favorite-detail"
              onClick={() => onToggleFavorite(component.id)}
              aria-pressed={isFavorite}
              className={outlineBtn}
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-amber-400' : ''}`} />
              {isFavorite ? 'Favorita' : 'Añadir a favoritas'}
            </button>
          )}
          <button
            type="button"
            id="btn-iterate-version-detail"
            onClick={() => onOpenIteration?.(component)}
            title="Registrar una nueva iteración o versión"
            className={outlineBtn}
          >
            Nueva iteración
          </button>
          {component.isCustom && onEditComponent && (
            <button
              type="button"
              id="btn-edit-component-detail"
              onClick={() => onEditComponent(component)}
              title="Editar nombre, descripción, categoría y código"
              className={outlineBtn}
            >
              Editar
            </button>
          )}
          {onOpenCompare && (
            <button type="button" id="btn-open-compare-from-detail" onClick={() => onOpenCompare(component.id)} className={outlineBtn}>
              Comparar
            </button>
          )}
        </div>
      </header>

      {/* Pestañas */}
      <div>
        <div role="tablist" aria-label="Secciones de la ficha" className="flex gap-6 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                id={`detail-tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px min-h-11 whitespace-nowrap border-b-2 text-base transition-colors cursor-pointer ${
                  active
                    ? 'border-indigo-600 dark:border-indigo-400 font-semibold text-zinc-900 dark:text-zinc-50'
                    : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" aria-labelledby={`detail-tab-btn-${activeTab}`} className="pt-8">
          {activeTab === 'resumen' && (
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {component.variants.map((variant) => {
                const isCopied = copiedKey === `snippet-${variant.id}`;
                return (
                  <article
                    key={variant.id}
                    className="flex flex-col overflow-hidden rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[var(--app-shadow-card)]"
                  >
                    <div className="flex min-h-[180px] items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 bg-[radial-gradient(var(--color-zinc-200)_1px,transparent_1px)] dark:bg-[radial-gradient(var(--color-zinc-800)_1px,transparent_1px)] [background-size:18px_18px] p-6">
                      <InteractiveComponentRenderer component={component} activeVariantProps={variant.props} onToast={onToast} compact />
                    </div>
                    <div className="flex flex-1 flex-col gap-3 px-6 py-5">
                      <div>
                        <h3 className="font-display text-[22px] leading-7">{variant.name}</h3>
                        {variant.description && (
                          <p className="mt-1 text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">{variant.description}</p>
                        )}
                      </div>
                      <div className="mt-auto flex items-start gap-3 rounded-xl bg-zinc-900 dark:bg-black px-4 py-3 text-zinc-50">
                        <pre className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] leading-5">{variant.codeSnippet}</pre>
                        <button
                          type="button"
                          onClick={() => copy(variant.codeSnippet, `snippet-${variant.id}`, `Snippet de ${variant.name} copiado`)}
                          className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border border-zinc-400 px-3 text-sm hover:bg-white/10 cursor-pointer"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                          {isCopied ? 'Copiado' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div role="group" aria-label="Qué código ver" className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                  <button type="button" aria-pressed={codeType === 'implementation'} onClick={() => setCodeType('implementation')} className={segmentBtn(codeType === 'implementation')}>
                    Implementación ({component.name}.tsx)
                  </button>
                  <button type="button" aria-pressed={codeType === 'usage'} onClick={() => setCodeType('usage')} className={segmentBtn(codeType === 'usage')}>
                    Ejemplo de uso
                  </button>
                </div>
                <span className="text-sm text-zinc-600 dark:text-zinc-300">Sin librerías externas · solo Tailwind</span>
              </div>
              <CodeViewer
                code={codeType === 'implementation' ? component.sourceCode : component.usageSnippet}
                title={codeType === 'implementation' ? `src/components/${component.name}.tsx` : 'Uso en tu proyecto'}
                onCopySuccess={onToast}
              />
            </div>
          )}

          {activeTab === 'props' && <PropsTable props={component.props} />}

          {activeTab === 'tokens' && (
            <div className="flex flex-col gap-6">
              <p className="text-base text-zinc-600 dark:text-zinc-300">Pulsa una clase para copiarla.</p>
              <div className="flex flex-wrap gap-2">
                {component.tokensUsed.map((token) => {
                  const isCopied = copiedKey === `token-${token}`;
                  return (
                    <button
                      key={token}
                      type="button"
                      onClick={() => copy(token, `token-${token}`, `Token copiado: ${token}`)}
                      className="inline-flex items-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-3.5 py-1.5 font-mono text-[13px] text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      {token}
                      {isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400" />}
                    </button>
                  );
                })}
              </div>
              {onOpenPaletteGenerator && (
                <div className="flex flex-col gap-4 rounded-xl bg-violet-100 dark:bg-violet-900 px-6 py-5 sm:flex-row sm:items-center">
                  <span className="mono-label self-start sm:self-center rounded-full bg-violet-600 dark:bg-violet-400 px-3 py-1 text-xs text-white dark:text-zinc-950">
                    Nota
                  </span>
                  <p className="flex-1 text-base">
                    ¿Necesitas tu propia paleta? Calcula tonos del 50 al 950, revisa contrastes y exporta los tokens.
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenPaletteGenerator()}
                    className="min-h-11 shrink-0 rounded-full bg-zinc-900 dark:bg-zinc-50 px-5 text-base font-semibold text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
                  >
                    Generar Paleta
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="flex max-w-3xl flex-col gap-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-base text-zinc-600 dark:text-zinc-300">
                  Versión actual <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">v{component.version || '1.0.0'}</span>
                </p>
                <button type="button" onClick={() => onOpenIteration?.(component)} className={outlineBtn}>
                  Registrar nueva iteración
                </button>
              </div>

              <ol className="flex flex-col">
                {history.map((iter, idx) => {
                  const isLatest = idx === 0;
                  const isLast = idx === history.length - 1;
                  return (
                    <li key={`${iter.version}-${idx}`} className="grid grid-cols-[24px_minmax(0,1fr)] gap-4">
                      <div className="flex flex-col items-center">
                        <span
                          className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                            isLatest ? 'border-indigo-600 bg-indigo-600 dark:border-indigo-400 dark:bg-indigo-400' : 'border-zinc-500 bg-zinc-50 dark:border-zinc-400 dark:bg-zinc-950'
                          }`}
                        />
                        {!isLast && <span className="w-px flex-1 bg-zinc-300 dark:bg-zinc-700" />}
                      </div>
                      <div className={`flex flex-col gap-2 ${isLast ? '' : 'pb-8'}`}>
                        <div className="flex flex-wrap items-baseline gap-3">
                          <span className="font-display text-[22px] leading-7">v{iter.version}</span>
                          {isLatest && <span className="mono-label text-xs text-indigo-700 dark:text-indigo-400">Activa</span>}
                          <span className="text-sm text-zinc-600 dark:text-zinc-300">{iter.date}</span>
                        </div>
                        <p className="text-base leading-[26px]">{iter.notes}</p>
                        {iter.changes && iter.changes.length > 0 && (
                          <ul className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                            {iter.changes.map((change, cIdx) => (
                              <li key={cIdx} className="flex gap-2">
                                <span aria-hidden="true">·</span>
                                {change}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
