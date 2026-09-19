import React, { useState } from 'react';
import {
  Copy,
  Check,
  Code2,
  FileText,
  Palette,
  History,
  GitCommit,
  Clock,
  Star,
  Tag,
  Plus,
  X,
  ArrowLeftRight,
  Eye,
  Wand2,
  ArrowRight,
} from 'lucide-react';
import { UIComponent } from '../types';
import { InteractiveComponentRenderer } from './InteractiveComponentRenderer';
import { CodeViewer } from './CodeViewer';
import { PropsTable } from './PropsTable';

type DetailTab = 'resumen' | 'code' | 'props' | 'tokens' | 'versions';

interface ComponentDetailPanelProps {
  component: UIComponent;
  onToast: (msg: string) => void;
  onOpenIteration?: (comp: UIComponent) => void;
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

/**
 * Ficha de referencia de UNA pieza ya guardada: resumen visual de sus
 * variantes, código, props, tokens y versiones. A diferencia del
 * Playground, acá no hay edición en vivo de props — es la "hoja técnica"
 * de la pieza; para jugar con ella de verdad está el botón
 * "Probar en Playground".
 */
export function ComponentDetailPanel({
  component,
  onToast,
  onOpenIteration,
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

  const copy = (text: string, key: string, toastMsg: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast(toastMsg);
    setTimeout(() => setCopiedKey((prev) => (prev === key ? null : prev)), 2000);
  };

  const tabs: { id: DetailTab; label: string; icon: React.ReactNode }[] = [
    { id: 'resumen', label: 'Resumen', icon: <Eye className="h-3.5 w-3.5" /> },
    { id: 'code', label: 'Código Fuente', icon: <Code2 className="h-3.5 w-3.5" /> },
    { id: 'props', label: 'Props & Tipos', icon: <FileText className="h-3.5 w-3.5" /> },
    {
      id: 'tokens',
      label: `Tokens (${component.tokensUsed.length})`,
      icon: <Palette className="h-3.5 w-3.5" />,
    },
    {
      id: 'versions',
      label: `Versiones (${component.versionHistory?.length || 1})`,
      icon: <History className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <main
      id="component-detail-panel"
      className="flex-1 flex flex-col h-full overflow-y-auto bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200"
    >
      {/* Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 px-6 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white font-mono">
                {component.name}
              </h1>
              <span className="rounded-md border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                v{component.version || '1.0.0'}
              </span>
              <span className="rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:text-zinc-300 capitalize">
                {component.category}
              </span>
              {component.isCustom && (
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Pieza Personal
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 max-w-2xl leading-relaxed">
              {component.description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                <Tag className="h-3 w-3 text-indigo-500" />
                <span>Palabras clave:</span>
              </span>
              {component.tags.map((tag) => {
                const isTagActive = activeTags.includes(tag.toLowerCase());
                return (
                  <span
                    key={tag}
                    onClick={() => onToggleTagFilter?.(tag)}
                    title={onToggleTagFilter ? `${isTagActive ? 'Quitar filtro' : 'Filtrar por'} #${tag}` : `#${tag}`}
                    className={`group/tag inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium transition-all cursor-pointer ${
                      isTagActive
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/90 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span>#{tag}</span>
                    {onRemoveTagFromComponent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTagFromComponent(component.id, tag);
                        }}
                        className="opacity-0 group-hover/tag:opacity-100 hover:text-rose-600 ml-0.5 cursor-pointer"
                      >
                        <X className="h-2.5 w-2.5" />
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
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-zinc-300 dark:border-zinc-700 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:text-zinc-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Añadir</span>
                  </button>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-400 bg-white dark:bg-zinc-900 px-2 py-0.5 shadow-2xs">
                    <input
                      autoFocus
                      type="text"
                      value={newTagText}
                      onChange={(e) => setNewTagText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const clean = newTagText.trim().toLowerCase().replace(/^#/, '');
                          if (clean) {
                            onAddTagToComponent(component.id, clean);
                            setIsAddingTag(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsAddingTag(false);
                        }
                      }}
                      className="w-24 text-[11px] bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
                    />
                    <button type="button" onClick={() => setIsAddingTag(false)} className="text-zinc-400 hover:text-zinc-600 cursor-pointer">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {onToggleFavorite && (
              <button
                type="button"
                id="btn-toggle-favorite-detail"
                onClick={() => onToggleFavorite(component.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                  isFavorite
                    ? 'border-amber-400/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-amber-500'
                }`}
              >
                <Star className={`h-3.5 w-3.5 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
                <span>{isFavorite ? 'En Favoritos' : 'Favorito'}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-iterate-version-detail"
              onClick={() => onOpenIteration?.(component)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer shadow-xs"
              title="Registrar nueva iteración o versión"
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Nueva Iteración</span>
            </button>

            {onOpenCompare && (
              <button
                type="button"
                id="btn-open-compare-from-detail"
                onClick={() => onOpenCompare(component.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer shadow-xs"
              >
                <ArrowLeftRight className="h-3.5 w-3.5 text-indigo-500" />
                <span>Comparar</span>
              </button>
            )}

            <button
              type="button"
              id="btn-play-in-playground"
              onClick={() => onPlayInPlayground(component.id)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
              title="Abrir esta pieza en el Playground para interactuar en vivo"
            >
              <Wand2 className="h-3.5 w-3.5" />
              <span>Probar en Playground</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex gap-2 border-b border-zinc-200 dark:border-zinc-800/80 -mb-4 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              id={`detail-tab-btn-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 border-b-2 px-3 py-2 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-500 dark:text-indigo-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6">
        {activeTab === 'resumen' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {component.variants.map((variant) => {
              const isCopied = copiedKey === `snippet-${variant.id}`;
              return (
                <div
                  key={variant.id}
                  className="flex flex-col rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/60 p-5"
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                      {variant.name}
                    </h4>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400 leading-snug">
                      {variant.description}
                    </p>
                  </div>
                  <div className="my-2 flex-1 flex items-center justify-center rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 p-4 shadow-inner min-h-[140px]">
                    <InteractiveComponentRenderer
                      component={component}
                      activeVariantProps={variant.props}
                      onToast={onToast}
                      compact
                    />
                  </div>
                  <div className="relative mt-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-100 dark:bg-zinc-900 p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono uppercase text-zinc-400 font-medium">
                        JSX Snippet
                      </span>
                      <button
                        type="button"
                        onClick={() => copy(variant.codeSnippet, `snippet-${variant.id}`, `¡Snippet de ${variant.name} copiado!`)}
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                      >
                        {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        <span>{isCopied ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-[11px] font-mono text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {variant.codeSnippet}
                    </pre>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCodeType('implementation')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    codeType === 'implementation'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Implementación Completa ({component.name}.tsx)
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType('usage')}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    codeType === 'usage'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  Ejemplo de Uso
                </button>
              </div>
              <span className="text-xs text-zinc-500 font-mono">Cero librerías externas · 100% Tailwind</span>
            </div>
            <CodeViewer
              code={codeType === 'implementation' ? component.sourceCode : component.usageSnippet}
              title={
                codeType === 'implementation'
                  ? `src/components/${component.name}.tsx`
                  : 'Uso en tu proyecto'
              }
              onCopySuccess={onToast}
            />
          </div>
        )}

        {activeTab === 'props' && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              Props y Configuración de {component.name}
            </h3>
            <PropsTable props={component.props} />
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <div className="border-b border-zinc-200 dark:border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Tokens Tailwind Utilizados en {component.name}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Haz clic en cualquier clase para copiarla a tu portapapeles.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {component.tokensUsed.map((token) => (
                <button
                  key={token}
                  type="button"
                  onClick={() => copy(token, `token-${token}`, `Token copiado: ${token}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 px-3 py-1.5 font-mono text-xs text-indigo-600 dark:text-indigo-300 hover:border-indigo-500/40 transition-colors cursor-pointer"
                >
                  <span>{token}</span>
                  <Copy className="h-3 w-3 text-zinc-400 dark:text-zinc-500" />
                </button>
              ))}
            </div>
            {onOpenPaletteGenerator && (
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Palette className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      ¿Necesitas una paleta de tokens personalizada?
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                      Calculá tonos 50-950, contrastes WCAG y exportá tokens CSS/Tailwind.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenPaletteGenerator()}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Palette className="h-3.5 w-3.5" />
                  <span>Generar Paleta</span>
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6 max-w-4xl">
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                    Versión actual:
                  </span>
                  <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-500/30 px-2.5 py-0.5">
                    v{component.version || '1.0.0'}
                  </span>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                  Historial de iteraciones y changelog documentado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenIteration?.(component)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-medium text-white hover:bg-indigo-500 transition-colors shadow-sm cursor-pointer shrink-0"
              >
                <GitCommit className="h-3.5 w-3.5" />
                <span>Registrar Nueva Iteración</span>
              </button>
            </div>

            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {(component.versionHistory && component.versionHistory.length > 0
                ? component.versionHistory
                : [
                    {
                      version: component.version || '1.0.0',
                      date: component.createdAt?.split('T')[0] || '2026-09-15',
                      notes: 'Versión base inicial registrada en la biblioteca.',
                      changes: ['Lanzamiento inicial de la pieza'],
                    },
                  ]
              ).map((iter, idx) => {
                const isLatest = idx === 0;
                return (
                  <div key={`${iter.version}-${idx}`} className="relative">
                    <div
                      className={`absolute -left-6 top-1.5 h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        isLatest
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900'
                      }`}
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-current" />
                    </div>
                    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 p-4 shadow-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                            v{iter.version}
                          </span>
                          {isLatest && (
                            <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.2 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                              Versión Activa
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {iter.date}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium">
                        {iter.notes}
                      </p>
                      {iter.changes && iter.changes.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                          {iter.changes.map((change, cIdx) => (
                            <span
                              key={cIdx}
                              className="rounded-md bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] text-zinc-600 dark:text-zinc-400"
                            >
                              {change}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
