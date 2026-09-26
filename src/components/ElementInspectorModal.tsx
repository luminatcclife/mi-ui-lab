// src/components/ElementInspectorModal.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Copy, Check, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';
import { inspectElementOrHTML, ElementTechSheet } from '../utils/elementInspector';
import { analyzeSnippetDependencies } from '../utils/dependencyDetector';
import {
  standardizeToUIComponent,
  extractSemanticSlots,
  closeVoidElements,
  renameAttributesToJsx,
  convertHtmlComments,
} from '../utils/componentStandardizer';
import { buildSandboxDocument, SandboxTheme } from '../utils/sandboxDocument';
import { sanitizeHtml } from '../utils/sanitizeHtml';
import { errorMessage } from '../utils/propValues';
import { ComponentCategory, UIComponent } from '../types';
import { InspectorSpecsTab } from './inspector/InspectorSpecsTab';
import { InspectorTsxTab } from './inspector/InspectorTsxTab';

export interface ElementInspectorModalProps {
  activeComponent?: UIComponent;
  onToast?: (message: string) => void;
  onSaveComponent?: (component: UIComponent) => void;
}

type PreviewTheme = SandboxTheme;
type ViewportSize = 'fluid' | 'tablet' | 'mobile';

const SAMPLE_SNIPPETS = [
  {
    name: 'Botón con Icono Lucide',
    category: 'buttons' as const,
    code: `<button class="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 focus:ring-2 focus:ring-indigo-400 focus:outline-none">
  <svg class="lucide lucide-sparkles h-4 w-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
  <span>Confirmar con Lucide</span>
</button>`,
  },
  {
    name: 'Tarjeta con Radix & Motion',
    category: 'cards' as const,
    code: `<div data-state="open" class="framer-motion-card rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5 shadow-xl backdrop-blur-sm max-w-sm flex flex-col gap-3">
  <div class="flex items-center justify-between">
    <span class="rounded-full bg-indigo-500/10 px-2.5 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">data-state Radix</span>
    <span class="text-xs text-zinc-400 font-mono">v2.4</span>
  </div>
  <h3 class="text-base font-bold text-zinc-100">Sensor Ultrasonido v2</h3>
  <p class="text-xs text-zinc-400 leading-relaxed">Módulo de telemetría de alta frecuencia compatible con ESP32.</p>
</div>`,
  },
  {
    name: 'Artículo Typography (Prose)',
    category: 'custom' as const,
    code: `<article class="prose prose-invert prose-sm max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/90 p-5">
  <h4 class="text-indigo-400 font-bold m-0 mb-1">Documentación Técnica</h4>
  <p class="text-zinc-400 text-xs m-0 leading-relaxed">Este bloque utiliza clases de tipografía enriquecida del plugin oficial de Tailwind.</p>
</article>`,
  },
  {
    name: 'Badge de Estado Animado',
    category: 'feedback' as const,
    code: `<span class="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-600 dark:text-amber-300 shadow-sm">
  <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping"></span>
  <span>Sincronizando datos</span>
</span>`,
  },
];

export function ElementInspectorModal({
  activeComponent,
  onToast,
  onSaveComponent,
}: ElementInspectorModalProps) {
  // Navigation & View States
  const [activeTab, setActiveTab] = useState<'paste' | 'live-canvas'>('paste');
  const [rightPanelTab, setRightPanelTab] = useState<'preview' | 'specs' | 'tsx'>('preview');
  const [htmlInput, setHtmlInput] = useState(SAMPLE_SNIPPETS[0].code);
  const [techSheet, setTechSheet] = useState<ElementTechSheet | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Preview Settings
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>('dark');
  const [viewportSize, setViewportSize] = useState<ViewportSize>('fluid');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [iframeKey, setIframeKey] = useState<number>(0);

  // Save to DB Drawer State
  const [isSavingDrawerOpen, setIsSavingDrawerOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveCategory, setSaveCategory] = useState<Exclude<ComponentCategory, 'all' | 'favorites'>>('cards');
  const [saveTagline, setSaveTagline] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [saveTags, setSaveTags] = useState('custom, importado, tailwind');
  const [useGoldStandard, setUseGoldStandard] = useState(true);

  const sandboxMountRef = useRef<HTMLDivElement>(null);

  // Analyze HTML string
  const handleAnalyzeHtml = () => {
    setErrorMsg(null);
    try {
      if (!htmlInput.trim()) {
        setErrorMsg('Ingresa un fragmento de código HTML con clases.');
        return;
      }
      const sheet = inspectElementOrHTML(htmlInput, sandboxMountRef.current || undefined);
      setTechSheet(sheet);

      // Auto-suggest component metadata
      const suggestedName = deduceComponentName(sheet);
      setSaveName(suggestedName);
      setSaveCategory(deduceCategory(sheet));
      setSaveTagline(`Componente <${sheet.tagName}> capturado fiel al original`);
      setSaveDescription(`Pieza visual con ${sheet.totalClassesCount} clases Tailwind importada directamente.`);

      const relevantTags = Array.from(
        new Set([
          sheet.tagName,
          deduceCategory(sheet),
          'importado',
          'tailwind',
          ...(sheet.rawClassNames.slice(0, 3).map((c) => c.replace(/[^a-zA-Z0-9]/g, ''))),
        ])
      )
        .filter(Boolean)
        .join(', ');
      setSaveTags(relevantTags);

      // Refresh the preview iframe to guarantee fresh rendering
      setIframeKey((prev) => prev + 1);

      if (onToast) {
        onToast(
          sheet.wrappedMultipleRoots
            ? 'Varios elementos raíz: se agruparon en un <div> para analizarlos juntos'
            : 'Ficha técnica y vista previa aislada generadas',
        );
      }
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Error al analizar el código HTML.'));
      setTechSheet(null);
    }
  };

  // Inspect the currently rendered component on canvas
  const handleInspectActiveComponent = () => {
    setErrorMsg(null);
    const canvasEl = document.querySelector('[data-rendered-canvas="true"]') as HTMLElement;
    if (!canvasEl) {
      const rootCanvas = document.getElementById('preview-canvas-root');
      if (rootCanvas) {
        const firstVisual = rootCanvas.querySelector('button, div, input, nav, aside, section') as HTMLElement;
        if (firstVisual) {
          try {
            const sheet = inspectElementOrHTML(firstVisual);
            setTechSheet(sheet);
            setHtmlInput(sheet.cleanHtml);
            setIframeKey((prev) => prev + 1);
            if (onToast) onToast('Inspeccionado desde el lienzo en pantalla');
            return;
          } catch (e) {
            setErrorMsg(errorMessage(e, 'Error al inspeccionar elemento.'));
          }
        }
      }
      setErrorMsg('No se detectó el elemento interactivo activo en el lienzo.');
      return;
    }

    const firstInteractive = (canvasEl.firstElementChild as HTMLElement) || canvasEl;
    try {
      const sheet = inspectElementOrHTML(firstInteractive);
      setTechSheet(sheet);
      setHtmlInput(sheet.cleanHtml);
      setIframeKey((prev) => prev + 1);
      if (onToast) onToast('Inspección de elemento renderizado completada');
    } catch (err) {
      setErrorMsg(errorMessage(err, 'Error al inspeccionar elemento.'));
    }
  };

  useEffect(() => {
    if (!techSheet) {
      handleAnalyzeHtml();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      if (onToast) onToast('⚠ No se pudo copiar al portapapeles');
      return;
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    if (onToast) onToast('Copiado al portapapeles');
  };

  // Analyze snippet dependencies (Lucide, Framer Motion, Radix, etc.)
  const detectedDependencies = useMemo(() => {
    const raw = techSheet?.cleanHtml || htmlInput;
    const classes = techSheet?.rawClassNames || [];
    return analyzeSnippetDependencies(raw, classes);
  }, [techSheet, htmlInput]);

  const missingDependencies = useMemo(() => {
    return detectedDependencies.filter((d) => !d.isInstalledInCurrentApp);
  }, [detectedDependencies]);

  // Extract semantic text slots (title, subtitle, badge, actionLabel)
  const semanticSlots = useMemo(() => {
    const raw = techSheet?.cleanHtml || htmlInput;
    return extractSemanticSlots(raw);
  }, [techSheet, htmlInput]);

  // Generate clean React TSX Code
  const generatedTsxCode = useMemo(() => {
    const raw = techSheet?.cleanHtml || htmlInput;
    const cleanJsx = closeVoidElements(
      renameAttributesToJsx(
        convertHtmlComments(raw)
          .replace(/\bclass=/g, 'className=')
          .replace(/\bfor=/g, 'htmlFor=')
          .replace(/\btabindex=/g, 'tabIndex='),
      ),
    );

    const compName = (saveName || 'MiComponenteCapturado')
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('') || 'MiComponenteCapturado';

    // Check if Lucide icon import is needed
    const hasLucide = detectedDependencies.some((d) => d.id === 'lucide-react');
    const lucideImportComment = hasLucide
      ? `// Nota: Si reemplazas el <svg> por componentes Lucide, importa desde 'lucide-react'\n`
      : '';

    return `import React from 'react';
${lucideImportComment}
export function ${compName}() {
  return (
    ${cleanJsx.split('\n').map((line, idx) => (idx === 0 ? line : `    ${line}`)).join('\n')}
  );
}`;
  }, [techSheet, htmlInput, saveName, detectedDependencies]);

  // Build isolated HTML payload for iframe srcDoc (HTML saneado: el crudo solo vive en el textarea)
  const iframeSrcDoc = useMemo(
    () =>
      buildSandboxDocument({
        html: techSheet?.cleanHtml || sanitizeHtml(htmlInput),
        theme: previewTheme,
      }),
    [previewTheme, techSheet, htmlInput],
  );

  // Save Component to Database Handler
  const handleConfirmSaveToDatabase = () => {
    if (!saveName.trim()) {
      if (onToast) onToast('⚠ Indica un nombre para el componente.');
      else setErrorMsg('Indica un nombre para el componente.');
      return;
    }

    const slug = saveName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const uniqueId = `custom-${slug}-${Date.now()}`;
    const cleanVer = '1.0.0';
    const todayStr = new Date().toISOString().split('T')[0];

    const tokensArray = techSheet?.rawClassNames || [];
    const tagsArray = saveTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const compName = saveName
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('') || 'PiezaPersonalizada';

    let newComp: UIComponent;

    if (useGoldStandard) {
      const standardized = standardizeToUIComponent({
        name: saveName.trim(),
        category: saveCategory,
        tagline: saveTagline.trim(),
        description: saveDescription.trim(),
        rawHtml: techSheet?.cleanHtml || sanitizeHtml(htmlInput),
        tokens: tokensArray,
        techSheet: techSheet,
      });
      newComp = {
        ...standardized.component,
        tags: tagsArray.length > 0 ? tagsArray : standardized.component.tags,
      };
    } else {
      newComp = {
        id: uniqueId,
        name: saveName.trim(),
        version: cleanVer,
        versionHistory: [
          {
            version: cleanVer,
            date: todayStr,
            notes: 'Componente importado desde web e inspeccionado fiel al original.',
            changes: [
              'Captura fiel con vista previa aislada en iframe',
              'Tokens clasificados validados',
            ],
          },
        ],
        tagline: saveTagline.trim() || `Componente <${techSheet?.tagName || 'div'}> capturado fiel al original`,
        description: saveDescription.trim() || `Pieza visual importada y validada en el inspector de elementos.`,
        category: saveCategory,
        sourceCode: generatedTsxCode,
        usageSnippet: `<${compName} />`,
        variants: [
          {
            id: 'default',
            name: 'Original Capturado',
            description: 'Estilo idéntico importado de la web.',
            props: {},
            codeSnippet: `<${compName} />`,
          },
        ],
        props: [],
        tokensUsed: tokensArray,
        tags: tagsArray.length > 0 ? tagsArray : ['custom', 'importado'],
        isCustom: true,
        createdAt: todayStr,
        rawHtml: techSheet?.cleanHtml || sanitizeHtml(htmlInput),
      };
    }

    if (onSaveComponent) {
      onSaveComponent(newComp);
      if (onToast) {
        onToast(`¡"${newComp.name}" guardado exitosamente en la base de datos!`);
      }
      setIsSavingDrawerOpen(false);
      resetCaptureForm();
    } else {
      if (onToast) onToast('Función de guardado no conectada en este contexto');
    }
  };

  // Clears the capture form after a successful save, ready for the next piece.
  const resetCaptureForm = () => {
    setHtmlInput(SAMPLE_SNIPPETS[0].code);
    setTechSheet(null);
    setErrorMsg(null);
    setActiveTab('paste');
    setRightPanelTab('preview');
    setSaveName('');
    setSaveCategory('cards');
    setSaveTagline('');
    setSaveDescription('');
    setSaveTags('custom, importado, tailwind');
    setUseGoldStandard(true);
    setIframeKey((prev) => prev + 1);
  };


  const hasMissing = missingDependencies.length > 0;
  const rightTabs: { id: 'preview' | 'specs' | 'tsx'; label: string }[] = [
    { id: 'preview', label: 'Vista previa' },
    { id: 'specs', label: 'Ficha técnica' },
    { id: 'tsx', label: 'Código TSX' },
  ];
  const segmentBtn = (active: boolean) =>
    `min-h-9 rounded-lg px-3 text-sm transition-colors cursor-pointer ${
      active
        ? 'bg-white dark:bg-zinc-900 font-semibold text-zinc-900 dark:text-zinc-50 shadow-[var(--app-shadow-card)]'
        : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
    }`;
  const fieldClass =
    'w-full rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400';
  const outlineBtn =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer';
  const primaryBtn =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-indigo-600 px-5 text-base font-semibold text-white transition-colors hover:bg-indigo-700 dark:bg-indigo-400 dark:text-zinc-950 dark:hover:bg-indigo-300 cursor-pointer';

  return (
    <div id="element-inspector-panel" className="relative flex w-full flex-col gap-8 text-zinc-900 dark:text-zinc-50">
      {/* Punto de montaje para calcular estilos y medidas del HTML pegado. No puede ser display:none
          (las medidas saldrían 0 × 0): es un nodo absoluto de 0 px y el contenido va fuera de pantalla.
          piece-scope: los colores se calculan con la paleta original de Tailwind, no con la de la app. */}
      <div ref={sandboxMountRef} className="piece-scope absolute left-0 top-0 h-0 w-0 pointer-events-none" aria-hidden="true" />

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* Izquierda: el HTML de origen y sus dependencias */}
        <div className="flex min-w-0 flex-col gap-6">
          <div role="group" aria-label="Origen" className="grid grid-cols-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
            <button type="button" aria-pressed={activeTab === 'paste'} onClick={() => setActiveTab('paste')} className={segmentBtn(activeTab === 'paste')}>
              Pegar HTML
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'live-canvas'}
              onClick={() => {
                setActiveTab('live-canvas');
                handleInspectActiveComponent();
              }}
              className={segmentBtn(activeTab === 'live-canvas')}
            >
              Pieza del lienzo
            </button>
          </div>

          {activeTab === 'paste' ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor="inspector-html-input" className="text-base font-semibold">
                  HTML capturado
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">Ejemplos:</span>
                  {SAMPLE_SNIPPETS.map((snip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      title={snip.name}
                      onClick={() => {
                        setHtmlInput(snip.code);
                        setTimeout(handleAnalyzeHtml, 50);
                      }}
                      className="rounded-full border border-zinc-500 dark:border-zinc-400 px-2.5 py-0.5 text-sm text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                    >
                      {snip.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                id="inspector-html-input"
                value={htmlInput}
                onChange={(e) => setHtmlInput(e.target.value)}
                placeholder="<button class='rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium shadow-lg hover:bg-indigo-500'>Click me</button>"
                rows={10}
                spellCheck={false}
                className="w-full resize-y rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 p-4 font-mono text-sm leading-[22px] text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500"
              />
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Se limpia antes de mostrarlo: sin scripts ni atributos peligrosos.</p>

              <div className="flex gap-2">
                <button type="button" onClick={handleAnalyzeHtml} className={`${primaryBtn} flex-1`}>
                  Analizar y previsualizar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHtmlInput('');
                    setTechSheet(null);
                  }}
                  className={outlineBtn}
                >
                  Limpiar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 rounded-xl bg-violet-100 dark:bg-violet-900 px-5 py-4">
                <span className="mono-label text-xs text-violet-700 dark:text-violet-300">Nota</span>
                <p className="text-base leading-[26px]">
                  Tomamos la pieza que está en el lienzo (
                  <strong className="font-semibold">{activeComponent?.name || 'la pieza actual'}</strong>) y pasamos sus clases y su estructura a la vista previa aislada.
                </p>
              </div>
              <button type="button" onClick={handleInspectActiveComponent} className={outlineBtn}>
                Volver a inspeccionar
              </button>
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="flex flex-col gap-1 rounded-xl border-2 border-dashed border-indigo-700 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-5 py-4">
              <span className="mono-label text-xs text-indigo-700 dark:text-indigo-400">Revisa</span>
              <span className="text-base">{errorMsg}</span>
            </div>
          )}

          {/* Dependencias */}
          <section className="flex flex-col gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-[22px] leading-7">Dependencias</h3>
              <span className={`mono-label text-xs ${hasMissing ? 'text-amber-700 dark:text-amber-300' : 'text-violet-600 dark:text-violet-400'}`}>
                {hasMissing ? 'Faltan paquetes' : 'Compatible'}
              </span>
            </div>

            {detectedDependencies.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {detectedDependencies.map((dep) => (
                  <li
                    key={dep.id}
                    className={`flex flex-col gap-2 rounded-xl border px-4 py-3 ${
                      dep.isInstalledInCurrentApp
                        ? 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                        : 'border-2 border-dashed border-amber-600 dark:border-amber-300 bg-amber-50 dark:bg-amber-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span className="block text-base font-semibold">{dep.name}</span>
                        <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-300">{dep.packageName}</span>
                      </div>
                      <span className="mono-label shrink-0 text-xs text-zinc-600 dark:text-zinc-300">
                        {dep.isInstalledInCurrentApp ? 'Instalada' : 'Sin instalar'}
                      </span>
                    </div>
                    <p className="text-sm leading-[21px] text-zinc-700 dark:text-zinc-300">{dep.reason}</p>
                    {!dep.isInstalledInCurrentApp && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(dep.installCommand, `cmd-${dep.id}`)}
                        title="Copiar comando npm"
                        className="inline-flex items-center gap-2 self-start rounded-lg bg-zinc-900 dark:bg-black px-3 py-1.5 font-mono text-[13px] text-zinc-50 hover:bg-zinc-800 cursor-pointer"
                      >
                        {dep.installCommand}
                        {copiedKey === `cmd-${dep.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5 opacity-70" />}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-base text-zinc-600 dark:text-zinc-300">
                No usa librerías externas (Motion, Lucide, Radix): es Tailwind puro.
              </p>
            )}
          </section>
        </div>

        {/* Derecha: lo que hemos encontrado */}
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800">
            <div role="tablist" aria-label="Resultado" className="flex gap-6">
              {rightTabs.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={rightPanelTab === t.id}
                  onClick={() => setRightPanelTab(t.id)}
                  className={`-mb-px min-h-11 whitespace-nowrap border-b-2 text-base transition-colors cursor-pointer ${
                    rightPanelTab === t.id
                      ? 'border-indigo-600 dark:border-indigo-400 font-semibold text-zinc-900 dark:text-zinc-50'
                      : 'border-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {rightPanelTab === 'preview' && (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div role="group" aria-label="Fondo de la vista previa" className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                  {(
                    [
                      ['dark', 'Oscuro'],
                      ['light', 'Claro'],
                      ['checkerboard', 'Cuadros'],
                    ] as const
                  ).map(([theme, label]) => (
                    <button key={theme} type="button" aria-pressed={previewTheme === theme} onClick={() => setPreviewTheme(theme)} className={segmentBtn(previewTheme === theme)}>
                      {label}
                    </button>
                  ))}
                </div>
                <div role="group" aria-label="Ancho de la vista previa" className="hidden sm:flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                  {(
                    [
                      ['fluid', 'Fluido'],
                      ['tablet', 'Tablet'],
                      ['mobile', 'Móvil'],
                    ] as const
                  ).map(([size, label]) => (
                    <button key={size} type="button" aria-pressed={viewportSize === size} onClick={() => setViewportSize(size)} className={segmentBtn(viewportSize === size)}>
                      {label}
                    </button>
                  ))}
                </div>
                <div className="ml-auto flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.max(0.75, prev - 0.25))}
                    aria-label="Reducir zoom"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <span className="w-11 text-center font-mono text-sm text-zinc-600 dark:text-zinc-300">{Math.round(zoomScale * 100)}%</span>
                  <button
                    type="button"
                    onClick={() => setZoomScale((prev) => Math.min(1.5, prev + 0.25))}
                    aria-label="Aumentar zoom"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIframeKey((prev) => prev + 1)}
                    aria-label="Recargar la vista previa"
                    title="Recargar la vista previa"
                    className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex min-h-[380px] items-center justify-center overflow-auto rounded-[20px] border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-black p-4">
                <div
                  style={{
                    width: viewportSize === 'mobile' ? '375px' : viewportSize === 'tablet' ? '640px' : '100%',
                    transform: `scale(${zoomScale})`,
                    transformOrigin: 'center center',
                    transition: 'width 0.25s ease, transform 0.2s ease',
                  }}
                  className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
                >
                  <iframe
                    key={iframeKey}
                    title="Isolated Live Preview"
                    srcDoc={iframeSrcDoc}
                    sandbox="allow-scripts"
                    className="h-full min-h-[350px] w-full border-0"
                  />
                </div>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-300">Se ve en un iframe aislado con Tailwind completo. Puedes pasar el ratón, enfocar y pulsar.</p>
            </div>
          )}

          {rightPanelTab === 'specs' && (
            <InspectorSpecsTab techSheet={techSheet} copiedKey={copiedKey} copyToClipboard={copyToClipboard} />
          )}

          {rightPanelTab === 'tsx' && (
            <InspectorTsxTab
              generatedTsxCode={generatedTsxCode}
              missingDependencies={missingDependencies}
              copiedKey={copiedKey}
              copyToClipboard={copyToClipboard}
              isSavingDrawerOpen={isSavingDrawerOpen}
              setIsSavingDrawerOpen={setIsSavingDrawerOpen}
            />
          )}

          {/* Resumen del análisis */}
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              ['Etiqueta', techSheet ? `<${techSheet.tagName}>` : '—'],
              ['Clases Tailwind', techSheet ? String(techSheet.totalClassesCount) : '0'],
              [
                'Medidas',
                techSheet
                  ? `${techSheet.computedStyles.dimensions.width}px × ${techSheet.computedStyles.dimensions.height}px`
                  : '—',
              ],
              ['Dependencias', String(detectedDependencies.length)],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col-reverse gap-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
                <dt className="text-sm text-zinc-600 dark:text-zinc-300">{label}</dt>
                <dd className="truncate font-display text-[20px] leading-7">{value}</dd>
              </div>
            ))}
          </dl>

          {techSheet && onSaveComponent && (
            <div
              className={`flex flex-col gap-4 rounded-xl px-5 py-4 sm:flex-row sm:items-center ${
                hasMissing ? 'bg-amber-100 dark:bg-amber-900' : 'bg-violet-100 dark:bg-violet-900'
              }`}
            >
              <span
                className={`mono-label self-start rounded-full px-3 py-1 text-xs sm:self-center ${
                  hasMissing ? 'bg-amber-400 text-zinc-900' : 'bg-violet-600 text-white dark:bg-violet-400 dark:text-zinc-950'
                }`}
              >
                {hasMissing ? 'Ojo' : 'Correcto'}
              </span>
              <p className="flex-1 text-base">
                {hasMissing
                  ? 'Puedes guardarla ya; quedará anotado qué paquetes necesita.'
                  : 'Si se ve igual que el original, ya puedes guardarla.'}
              </p>
              <button type="button" id="btn-inspector-save-to-library" onClick={() => setIsSavingDrawerOpen(true)} className={primaryBtn}>
                Guardar en la biblioteca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Panel lateral para guardar la pieza */}
      <AnimatePresence>
        {isSavingDrawerOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Cerrar"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSavingDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-zinc-950/40 cursor-default"
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="inspector-save-title"
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shadow-lg sm:w-[480px]"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-5">
                <div className="flex flex-col gap-0.5">
                  <span className="mono-label text-xs text-indigo-700 dark:text-indigo-400">Guardar</span>
                  <h3 id="inspector-save-title" className="font-display text-[22px] leading-7">
                    Nueva pieza
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSavingDrawerOpen(false)}
                  aria-label="Cerrar"
                  className="flex h-11 w-11 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6">
                {hasMissing ? (
                  <div className="flex flex-col gap-3 rounded-xl bg-amber-100 dark:bg-amber-900 px-5 py-4">
                    <span className="mono-label text-xs text-amber-700 dark:text-amber-300">Ojo</span>
                    <p className="text-base leading-[26px]">
                      Usa librerías que este proyecto no tiene. Para que se vea igual donde la uses, instala:
                    </p>
                    <ul className="flex flex-col gap-2">
                      {missingDependencies.map((dep) => (
                        <li key={dep.id} className="flex items-center justify-between gap-2 rounded-lg bg-white dark:bg-zinc-900 px-3 py-2">
                          <div>
                            <span className="block text-sm font-semibold">{dep.name}</span>
                            <span className="font-mono text-[13px] text-zinc-600 dark:text-zinc-300">{dep.packageName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(dep.installCommand, `save-dep-${dep.id}`)}
                            title="Copiar comando npm"
                            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-zinc-500 dark:border-zinc-400 px-3 text-sm cursor-pointer"
                          >
                            {copiedKey === `save-dep-${dep.id}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            Copiar npm
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="text-base text-zinc-600 dark:text-zinc-300">Todas sus dependencias están disponibles en este proyecto.</p>
                )}

                <label className="flex items-start justify-between gap-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4 cursor-pointer">
                  <span className="flex flex-col gap-1">
                    <span className="text-base font-semibold">Convertir en pieza completa</span>
                    <span className="text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">
                      {useGoldStandard
                        ? 'Con 3 variantes (estándar, con brillo y compacta) y props documentadas: variant, accentColor, title y acción.'
                        : 'Se guarda como pieza estática, sin variantes ni tabla de props.'}
                    </span>
                    {useGoldStandard && (semanticSlots.title || semanticSlots.actionLabel) && (
                      <span className="flex flex-wrap gap-1.5 pt-1 text-sm">
                        {semanticSlots.title && (
                          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5">
                            Título: <strong className="font-semibold">{semanticSlots.title}</strong>
                          </span>
                        )}
                        {semanticSlots.actionLabel && (
                          <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5">
                            Botón: <strong className="font-semibold">{semanticSlots.actionLabel}</strong>
                          </span>
                        )}
                      </span>
                    )}
                  </span>
                  <input
                    type="checkbox"
                    role="switch"
                    checked={useGoldStandard}
                    onChange={(e) => setUseGoldStandard(e.target.checked)}
                    className="mt-1 h-5 w-5 shrink-0 accent-[#1d5f80] cursor-pointer"
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-base font-semibold">Nombre</span>
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="Ej: PricingCard, PrimaryGlowButton..."
                    className={`${fieldClass} h-11`}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-base font-semibold">Categoría</span>
                  <select
                    value={saveCategory}
                    onChange={(e) => setSaveCategory(e.target.value as Exclude<ComponentCategory, 'all' | 'favorites'>)}
                    className={`${fieldClass} h-11`}
                  >
                    <option value="buttons">Botones</option>
                    <option value="cards">Tarjetas</option>
                    <option value="inputs">Entradas</option>
                    <option value="feedback">Feedback</option>
                    <option value="navigation">Navegación</option>
                    <option value="data">Datos</option>
                    <option value="custom">Otra</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-base font-semibold">Subtítulo</span>
                  <input
                    type="text"
                    value={saveTagline}
                    onChange={(e) => setSaveTagline(e.target.value)}
                    placeholder="Una frase que la describa"
                    className={`${fieldClass} h-11`}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-base font-semibold">Descripción</span>
                  <textarea
                    value={saveDescription}
                    onChange={(e) => setSaveDescription(e.target.value)}
                    rows={3}
                    placeholder="Variantes, efectos, dónde usarla…"
                    className={`${fieldClass} resize-none py-3`}
                  />
                </label>

                <label className="flex flex-col gap-2">
                  <span className="text-base font-semibold">Etiquetas</span>
                  <input
                    type="text"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    placeholder="separadas por comas"
                    className={`${fieldClass} h-11`}
                  />
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 px-6 py-4">
                <button type="button" onClick={() => setIsSavingDrawerOpen(false)} className={outlineBtn}>
                  Cancelar
                </button>
                <button type="button" onClick={handleConfirmSaveToDatabase} className={primaryBtn}>
                  <Check className="h-4 w-4" />
                  Guardar pieza
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper: Deduce a reasonable name for the component based on tag and classes
function deduceComponentName(sheet: ElementTechSheet): string {
  if (sheet.tagName === 'button') {
    if (sheet.rawClassNames.some((c) => c.includes('indigo') || c.includes('blue'))) {
      return 'Boton Primario Glow';
    }
    return 'Boton Interactivo';
  }
  if (sheet.tagName === 'input' || sheet.tagName === 'textarea') {
    return 'Input de Formulario';
  }
  if (sheet.tagName === 'span' && sheet.rawClassNames.some((c) => c.includes('rounded-full'))) {
    return 'Badge de Estado';
  }
  if (sheet.tagName === 'nav' || sheet.tagName === 'header') {
    return 'Barra de Navegacion';
  }
  if (sheet.rawClassNames.some((c) => c.includes('rounded-2xl') || c.includes('rounded-xl'))) {
    return 'Tarjeta Contenedora';
  }
  return `Componente ${sheet.tagName.toUpperCase()}`;
}

// Helper: Deduce category
function deduceCategory(sheet: ElementTechSheet): Exclude<ComponentCategory, 'all' | 'favorites'> {
  const tag = sheet.tagName;
  const classes = sheet.rawClassNames;

  if (tag === 'button') return 'buttons';
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return 'inputs';
  if (tag === 'nav' || tag === 'aside' || tag === 'header') return 'navigation';
  if (classes.some((c) => c.includes('badge') || c.includes('alert') || c.includes('toast') || c.includes('status'))) {
    return 'feedback';
  }
  if (classes.some((c) => c.includes('card') || c.includes('rounded-2xl') || c.includes('shadow-xl'))) {
    return 'cards';
  }
  if (tag === 'table' || classes.some((c) => c.includes('chart') || c.includes('metric'))) {
    return 'data';
  }
  return 'custom';
}
