// src/components/ElementInspectorModal.tsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Code,
  Layers,
  Sparkles,
  Copy,
  Check,
  Eye,
  Sliders,
  Maximize2,
  FileCode2,
  Terminal,
  MousePointerClick,
  Info,
  Database,
  RefreshCw,
  Sun,
  Moon,
  Grid,
  Smartphone,
  Tablet,
  Laptop,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  PackageCheck,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Package,
} from 'lucide-react';
import {
  inspectElementOrHTML,
  ElementTechSheet,
  TailwindCategorizedTokens,
} from '../utils/elementInspector';
import {
  analyzeSnippetDependencies,
  DetectedDependency,
} from '../utils/dependencyDetector';
import {
  standardizeToUIComponent,
  extractSemanticSlots,
  closeVoidElements,
  renameAttributesToJsx,
  convertHtmlComments,
} from '../utils/componentStandardizer';
import { ComponentCategory, UIComponent } from '../types';

export interface ElementInspectorModalProps {
  activeComponent?: UIComponent;
  onToast?: (message: string) => void;
  onSaveComponent?: (component: UIComponent) => void;
}

type PreviewTheme = 'dark' | 'light' | 'checkerboard';
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

      if (onToast) onToast('Ficha técnica y vista previa aislada generadas');
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al analizar el código HTML.');
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
          } catch (e: any) {
            setErrorMsg(e.message);
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
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al inspeccionar elemento.');
    }
  };

  useEffect(() => {
    if (!techSheet) {
      handleAnalyzeHtml();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
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

  // Build isolated HTML payload for iframe srcDoc
  const iframeSrcDoc = useMemo(() => {
    const isDark = previewTheme === 'dark';
    const isCheckerboard = previewTheme === 'checkerboard';

    let backgroundStyles = '';
    if (isCheckerboard) {
      backgroundStyles = `
        background-color: #18181b;
        background-image: 
          linear-gradient(45deg, #27272a 25%, transparent 25%), 
          linear-gradient(-45deg, #27272a 25%, transparent 25%), 
          linear-gradient(45deg, transparent 75%, #27272a 75%), 
          linear-gradient(-45deg, transparent 75%, #27272a 75%);
        background-size: 16px 16px;
        background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
      `;
    } else if (isDark) {
      backgroundStyles = `
        background-color: #09090b;
        background-image: radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px);
        background-size: 18px 18px;
      `;
    } else {
      backgroundStyles = `
        background-color: #ffffff;
        background-image: radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 1px);
        background-size: 18px 18px;
      `;
    }

    const contentHtml = techSheet?.cleanHtml || htmlInput;

    return `<!DOCTYPE html>
<html lang="es" class="${isDark || isCheckerboard ? 'dark' : ''}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <!-- Tailwind Play CDN for isolated runtime styling of ANY class -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    *, ::before, ::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100vh;
      overflow-x: hidden;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 1.5rem;
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      ${backgroundStyles}
      color: ${isDark || isCheckerboard ? '#f4f4f5' : '#18181b'};
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    #preview-root {
      display: flex;
      align-items: center;
      justify-content: center;
      max-width: 100%;
      width: fit-content;
      margin: auto;
    }
  </style>
</head>
<body>
  <div id="preview-root">
    ${contentHtml}
  </div>
</body>
</html>`;
  }, [previewTheme, techSheet, htmlInput]);

  // Save Component to Database Handler
  const handleConfirmSaveToDatabase = () => {
    if (!saveName.trim()) {
      alert('Por favor indica un nombre para el componente.');
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
        rawHtml: techSheet?.cleanHtml || htmlInput,
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
        rawHtml: techSheet?.cleanHtml || htmlInput,
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

  const tokenCategories: Array<{
    key: keyof TailwindCategorizedTokens;
    label: string;
    badgeColor: string;
  }> = [
    { key: 'colors', label: 'Colores & Superficie', badgeColor: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30' },
    { key: 'spacing', label: 'Espaciado & Medidas', badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    { key: 'typography', label: 'Tipografía', badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
    { key: 'borders', label: 'Bordes & Radios', badgeColor: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
    { key: 'layout', label: 'Layout & Flex/Grid', badgeColor: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
    { key: 'effects', label: 'Efectos & Sombras', badgeColor: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
    { key: 'interactive', label: 'Estados (hover/focus)', badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
    { key: 'others', label: 'Otras clases', badgeColor: 'bg-zinc-700/40 text-zinc-300 border-zinc-600' },
  ];

  return (
    <div
      id="element-inspector-panel"
      className="relative flex flex-1 flex-col w-full h-full overflow-hidden bg-zinc-950 text-zinc-100"
    >
      {/* Hidden sandbox mount point for DOMParser style computation */}
      <div ref={sandboxMountRef} className="hidden pointer-events-none" aria-hidden="true" />
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-3.5 bg-zinc-900/70">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100">
                  Inspector de Elementos & Live Preview Aislado
                </h2>
                <span className="rounded-md bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Copia Fiel en Iframe
                </span>
                {missingDependencies.length > 0 && (
                  <span className="rounded-md bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {missingDependencies.length} {missingDependencies.length === 1 ? 'dependencia requerida' : 'dependencias requeridas'}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400">
                Captura fragmentos HTML/Tailwind, detecta dependencias requeridas (Lucide, Motion, Radix) y valida en sandbox antes de guardar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Direct Save Button in Header */}
            {onSaveComponent && techSheet && (
              <button
                type="button"
                id="btn-inspector-save-to-library"
                onClick={() => setIsSavingDrawerOpen(true)}
                className={`inline-flex items-center gap-2 rounded-xl text-white px-3.5 py-1.5 text-xs font-semibold shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer ${
                  missingDependencies.length > 0
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-600/20'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/20'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                <span>Guardar en Base de Datos</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-1 flex-col lg:flex-row overflow-hidden relative">
          {/* Left Column: Code Input, Samples, Fidelity Validation & Dependencies Alert */}
          <div className="flex flex-col w-full lg:w-[42%] border-b lg:border-b-0 lg:border-r border-zinc-800/80 bg-zinc-950/70 p-4 sm:p-5 overflow-y-auto">
            {/* Input Origin Tabs */}
            <div className="flex rounded-xl bg-zinc-900/90 p-1 border border-zinc-800 mb-3">
              <button
                type="button"
                onClick={() => setActiveTab('paste')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'paste'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5" />
                <span>Pegar HTML / CSS</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('live-canvas');
                  handleInspectActiveComponent();
                }}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-1.5 text-xs font-medium transition-all ${
                  activeTab === 'live-canvas'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MousePointerClick className="h-3.5 w-3.5" />
                <span>Elemento en Lienzo</span>
              </button>
            </div>

            {activeTab === 'paste' ? (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Code className="h-3.5 w-3.5 text-indigo-400" />
                    Código HTML con clases Tailwind
                  </label>
                  <div className="flex items-center gap-1 text-2xs text-zinc-400 overflow-x-auto">
                    <span className="hidden sm:inline">Ejemplos:</span>
                    {SAMPLE_SNIPPETS.map((snip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setHtmlInput(snip.code);
                          setTimeout(handleAnalyzeHtml, 50);
                        }}
                        className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-zinc-300 hover:border-indigo-500/50 hover:text-white transition-colors cursor-pointer shrink-0"
                      >
                        {snip.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={htmlInput}
                  onChange={(e) => setHtmlInput(e.target.value)}
                  placeholder="<button class='rounded-xl bg-indigo-600 px-4 py-2 text-white font-medium shadow-lg hover:bg-indigo-500'>Click me</button>"
                  rows={7}
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 font-mono text-xs text-zinc-200 placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none resize-none leading-relaxed"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAnalyzeHtml}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 text-xs transition-colors shadow-xs cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Analizar & Renderizar Preview</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHtmlInput('');
                      setTechSheet(null);
                    }}
                    className="rounded-xl border border-zinc-800 px-3 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3.5 text-xs text-blue-300">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <Info className="h-4 w-4 text-blue-400" />
                    Inspección del DOM activo en el lienzo
                  </div>
                  <p className="text-zinc-400 leading-relaxed">
                    Extrae el elemento renderizado en la pestaña activa del lienzo (
                    <span className="font-semibold text-zinc-200">
                      {activeComponent?.name || 'Componente actual'}
                    </span>
                    ) y transfiere sus clases y estructura al sandbox aislado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleInspectActiveComponent}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 px-4 text-xs transition-colors shadow-xs cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  <span>Re-inspeccionar Lienzo Activo</span>
                </button>
              </div>
            )}

            {/* Dependency Analysis & Requirements Warning */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 text-indigo-400" />
                  Análisis de Dependencias de Librerías
                </span>
                {missingDependencies.length > 0 ? (
                  <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-amber-300 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Requiere Paquetes
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-emerald-300 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Compatible
                  </span>
                )}
              </div>

              {detectedDependencies.length > 0 ? (
                <div className="flex flex-col gap-2.5">
                  {detectedDependencies.map((dep) => (
                    <div
                      key={dep.id}
                      className={`rounded-xl border p-3 text-xs flex flex-col gap-2 ${
                        dep.isInstalledInCurrentApp
                          ? 'border-emerald-500/20 bg-emerald-500/5'
                          : 'border-amber-500/30 bg-amber-500/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {dep.isInstalledInCurrentApp ? (
                            <PackageCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          <div>
                            <span className="font-semibold text-zinc-100 block">
                              {dep.name}
                            </span>
                            <span className="text-3xs font-mono text-zinc-400">
                              {dep.packageName}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`rounded-md px-2 py-0.5 text-3xs font-semibold border ${
                            dep.isInstalledInCurrentApp
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {dep.isInstalledInCurrentApp ? 'Instalada en este lab' : 'No instalada'}
                        </span>
                      </div>

                      <p className="text-2xs text-zinc-300 leading-relaxed">
                        {dep.reason}
                      </p>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-800/60">
                        <div className="flex items-center gap-1 text-3xs text-zinc-400">
                          <span>Tokens:</span>
                          <span className="font-mono text-zinc-300 bg-zinc-800/80 px-1.5 py-0.5 rounded">
                            {dep.matchedTokens.slice(0, 2).join(', ')}
                          </span>
                        </div>

                        {!dep.isInstalledInCurrentApp && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(dep.installCommand, `cmd-${dep.id}`)}
                            className="inline-flex items-center gap-1 rounded-md bg-zinc-900 border border-zinc-700 px-2 py-1 font-mono text-3xs text-zinc-200 hover:text-white hover:border-amber-500/60 transition-colors cursor-pointer"
                            title="Copiar comando npm"
                          >
                            <Terminal className="h-3 w-3 text-amber-400" />
                            <span>{dep.installCommand}</span>
                            {copiedKey === `cmd-${dep.id}` ? (
                              <Check className="h-3 w-3 text-emerald-400" />
                            ) : (
                              <Copy className="h-3 w-3 opacity-60" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 p-3 text-2xs text-zinc-400 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>
                    No se detectaron librerías externas (Framer Motion, Lucide, Radix). El componente es 100% Tailwind CSS nativo.
                  </span>
                </div>
              )}
            </div>

            {/* Validation & Verification Checklist Card */}
            <div className="mt-4 pt-4 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  Validación de Fidelidad Visual
                </span>
                <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 text-3xs font-semibold uppercase tracking-wider text-emerald-300">
                  Sandbox Aislado
                </span>
              </div>

              <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3 flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">Etiqueta Principal:</span>
                  <span className="font-mono font-semibold text-indigo-400">
                    &lt;{techSheet?.tagName || 'esperando...'}&gt;
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">Tokens Tailwind Detectados:</span>
                  <span className="font-mono text-zinc-200">
                    {techSheet ? `${techSheet.totalClassesCount} clases` : '0 clases'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">Medidas Calculadas:</span>
                  <span className="font-mono text-zinc-200">
                    {techSheet
                      ? `${techSheet.computedStyles.dimensions.width}px × ${techSheet.computedStyles.dimensions.height}px`
                      : '---'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="text-zinc-400">Aislamiento de Estilos:</span>
                  <span className="text-emerald-400 font-medium flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Iframe sandbox 100% aislado
                  </span>
                </div>
              </div>

              {/* Quick Save CTA */}
              {techSheet && onSaveComponent && (
                <div
                  className={`mt-4 rounded-xl border p-3.5 flex flex-col gap-2 ${
                    missingDependencies.length > 0
                      ? 'border-amber-500/30 bg-amber-500/10'
                      : 'border-emerald-500/30 bg-emerald-500/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold flex items-center gap-1.5 ${
                        missingDependencies.length > 0 ? 'text-amber-300' : 'text-emerald-300'
                      }`}
                    >
                      {missingDependencies.length > 0 ? (
                        <AlertTriangle className="h-3.5 w-3.5" />
                      ) : (
                        <Database className="h-3.5 w-3.5" />
                      )}
                      ¿Listo para agregarlo a tu colección?
                    </span>
                  </div>
                  <p className="text-2xs text-zinc-400 leading-relaxed">
                    {missingDependencies.length > 0
                      ? 'Puedes guardarlo ahora; se adjuntará el aviso de dependencias externas requeridas.'
                      : 'Una vez verificado que se ve idéntico al original, guárdalo permanentemente en IndexedDB.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSavingDrawerOpen(true)}
                    className={`w-full flex items-center justify-center gap-2 rounded-lg text-white font-medium py-2 px-3 text-xs transition-colors shadow-xs cursor-pointer mt-1 ${
                      missingDependencies.length > 0
                        ? 'bg-amber-600 hover:bg-amber-500'
                        : 'bg-emerald-600 hover:bg-emerald-500'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Guardar en Base de Datos</span>
                  </button>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
          </div>

          {/* Right Column: Live Preview Sandbox, Specs & TSX */}
          <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950">
            {/* Right Tabs Header */}
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-4 py-2.5 bg-zinc-900/40">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setRightPanelTab('preview')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    rightPanelTab === 'preview'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Live Preview Aislado</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('specs')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    rightPanelTab === 'specs'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Ficha Técnica & Tokens</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRightPanelTab('tsx')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    rightPanelTab === 'tsx'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60'
                  }`}
                >
                  <Code className="h-3.5 w-3.5" />
                  <span>Código React TSX</span>
                </button>
              </div>

              {/* Viewport & Theme Controls for Preview */}
              {rightPanelTab === 'preview' && (
                <div className="flex items-center gap-2">
                  {/* Theme Switcher */}
                  <div className="flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => setPreviewTheme('dark')}
                      className={`rounded-md p-1.5 text-xs transition-colors ${
                        previewTheme === 'dark'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Fondo Oscuro (Dark)"
                    >
                      <Moon className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTheme('light')}
                      className={`rounded-md p-1.5 text-xs transition-colors ${
                        previewTheme === 'light'
                          ? 'bg-zinc-200 text-zinc-900'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Fondo Claro (Light)"
                    >
                      <Sun className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTheme('checkerboard')}
                      className={`rounded-md p-1.5 text-xs transition-colors ${
                        previewTheme === 'checkerboard'
                          ? 'bg-indigo-600 text-white'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Fondo Transparente / Cuadriculado (Checkerboard)"
                    >
                      <Grid className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Responsive Viewport Mode */}
                  <div className="hidden sm:flex items-center rounded-lg border border-zinc-800 bg-zinc-900/80 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewportSize('fluid')}
                      className={`rounded-md p-1.5 text-xs transition-colors ${
                        viewportSize === 'fluid'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Ancho Fluido (100%)"
                    >
                      <Laptop className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewportSize('tablet')}
                      className={`rounded-md p-1.5 text-xs transition-colors ${
                        viewportSize === 'tablet'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Tablet (640px)"
                    >
                      <Tablet className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewportSize('mobile')}
                      className={`rounded-md p-1.5 text-xs transition-colors ${
                        viewportSize === 'mobile'
                          ? 'bg-zinc-800 text-zinc-100'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                      title="Móvil (375px)"
                    >
                      <Smartphone className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Zoom Controls */}
                  <div className="hidden md:flex items-center gap-1 text-2xs text-zinc-400">
                    <button
                      type="button"
                      onClick={() => setZoomScale((prev) => Math.max(0.75, prev - 0.25))}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Reducir zoom"
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </button>
                    <span className="font-mono w-9 text-center">{Math.round(zoomScale * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setZoomScale((prev) => Math.min(1.5, prev + 0.25))}
                      className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                      title="Aumentar zoom"
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Refresh Iframe */}
                  <button
                    type="button"
                    onClick={() => setIframeKey((prev) => prev + 1)}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    title="Recargar vista previa aislada"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Right Tab 1: Live Preview Iframe */}
            {rightPanelTab === 'preview' && (
              <div className="flex-1 flex flex-col p-4 sm:p-5 overflow-hidden bg-zinc-950/90">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xs font-semibold uppercase tracking-wider text-zinc-400">
                    Renderizado en vivo con Tailwind JIT completo y CSS aislado
                  </span>
                  <span className="text-2xs text-zinc-500">
                    Interactúa directamente con hover, focus y clics
                  </span>
                </div>

                <div className="flex-1 flex items-center justify-center rounded-2xl border border-zinc-800/90 bg-zinc-900/30 p-2 sm:p-4 overflow-auto">
                  <div
                    style={{
                      width:
                        viewportSize === 'mobile'
                          ? '375px'
                          : viewportSize === 'tablet'
                          ? '640px'
                          : '100%',
                      transform: `scale(${zoomScale})`,
                      transformOrigin: 'center center',
                      transition: 'width 0.25s ease, transform 0.2s ease',
                    }}
                    className="h-full flex flex-col rounded-xl overflow-hidden shadow-2xl border border-zinc-800"
                  >
                    <iframe
                      key={iframeKey}
                      title="Isolated Live Preview"
                      srcDoc={iframeSrcDoc}
                      sandbox="allow-scripts"
                      className="w-full h-full min-h-[350px] border-0"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Right Tab 2: Technical Specs & Tokens */}
            {rightPanelTab === 'specs' && (
              <div className="flex-1 flex flex-col overflow-y-auto p-5 sm:p-6 gap-6">
                {techSheet ? (
                  <>
                    {/* Top Meta Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-zinc-800 border border-zinc-700 font-mono text-xs px-2.5 py-1 text-zinc-200 font-semibold">
                          &lt;{techSheet.tagName}&gt;
                        </span>
                        {techSheet.id && (
                          <span className="text-xs font-mono text-indigo-400">#{techSheet.id}</span>
                        )}
                        <span className="text-xs text-zinc-400">
                          • {techSheet.totalClassesCount} clases Tailwind
                        </span>
                        <span className="text-xs text-zinc-500">• {techSheet.analyzedAt}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(JSON.stringify(techSheet, null, 2), 'json-sheet')
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedKey === 'json-sheet' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>Copiar JSON</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(techSheet.rawClassNames.join(' '), 'all-classes')
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                        >
                          {copiedKey === 'all-classes' ? (
                            <Check className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>Copiar Clases</span>
                        </button>
                      </div>
                    </div>

                    {/* Section 1: Filtered Computed Styles */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                          <Sliders className="h-3.5 w-3.5 text-indigo-400" />
                          Estilos Computados en Pantalla (window.getComputedStyle)
                        </h3>
                        <span className="text-2xs text-zinc-500">Valores reales en runtime</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Color de Texto</span>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0"
                              style={{ backgroundColor: techSheet.computedStyles.color }}
                            />
                            <span className="font-mono text-xs text-zinc-200 truncate">
                              {techSheet.computedStyles.color}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Fondo (Background)</span>
                          <div className="flex items-center gap-2">
                            <span
                              className="h-3.5 w-3.5 rounded-full border border-zinc-700 shrink-0"
                              style={{ backgroundColor: techSheet.computedStyles.backgroundColor }}
                            />
                            <span className="font-mono text-xs text-zinc-200 truncate">
                              {techSheet.computedStyles.backgroundColor}
                            </span>
                          </div>
                        </div>

                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Tipografía / Tamaño</span>
                          <span className="font-mono text-xs text-zinc-200 truncate block">
                            {techSheet.computedStyles.fontSize} ({techSheet.computedStyles.fontWeight})
                          </span>
                        </div>

                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Dimensiones Reales</span>
                          <span className="font-mono text-xs text-zinc-200 block">
                            {techSheet.computedStyles.dimensions.width}px × {techSheet.computedStyles.dimensions.height}px
                          </span>
                        </div>

                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Radio de Borde</span>
                          <span className="font-mono text-xs text-zinc-200 truncate block">
                            {techSheet.computedStyles.borderRadius}
                          </span>
                        </div>

                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Relleno (Padding)</span>
                          <span className="font-mono text-xs text-zinc-200 truncate block">
                            {techSheet.computedStyles.padding}
                          </span>
                        </div>

                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Fuente (Font Family)</span>
                          <span className="font-mono text-xs text-zinc-200 truncate block">
                            {techSheet.computedStyles.fontFamily}
                          </span>
                        </div>

                        <div className="rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-2.5">
                          <span className="text-2xs text-zinc-400 block mb-1">Sombra (Box Shadow)</span>
                          <span
                            className="font-mono text-xs text-zinc-200 truncate block"
                            title={techSheet.computedStyles.boxShadow}
                          >
                            {techSheet.computedStyles.boxShadow.length > 25
                              ? techSheet.computedStyles.boxShadow.slice(0, 25) + '...'
                              : techSheet.computedStyles.boxShadow}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Categorized Tailwind Tokens */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                          <Layers className="h-3.5 w-3.5 text-indigo-400" />
                          Tokens de Diseño Tailwind Clasificados
                        </h3>
                        <span className="text-2xs text-zinc-500">
                          Haz clic en cualquier token para copiar
                        </span>
                      </div>

                      <div className="flex flex-col gap-3">
                        {tokenCategories.map((cat) => {
                          const tokens = techSheet.tailwindTokens[cat.key];
                          if (!tokens || tokens.length === 0) return null;
                          return (
                            <div
                              key={cat.key}
                              className="rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-3.5"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-zinc-300">
                                  {cat.label}
                                </span>
                                <span className="text-2xs text-zinc-500">
                                  {tokens.length} {tokens.length === 1 ? 'clase' : 'clases'}
                                </span>
                              </div>

                              <div className="flex flex-wrap gap-1.5">
                                {tokens.map((token, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => copyToClipboard(token, `token-${token}`)}
                                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-all hover:scale-105 active:scale-95 cursor-pointer ${cat.badgeColor}`}
                                    title="Clic para copiar token"
                                  >
                                    <span>{token}</span>
                                    {copiedKey === `token-${token}` ? (
                                      <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="h-3 w-3 opacity-40 hover:opacity-100" />
                                    )}
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-zinc-500 text-xs">
                    Ingresa código o analiza un elemento para visualizar su ficha técnica.
                  </div>
                )}
              </div>
            )}

            {/* Right Tab 3: React TSX Code */}
            {rightPanelTab === 'tsx' && (
              <div className="flex-1 flex flex-col p-5 overflow-y-auto gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-200">
                      Componente React (TypeScript / TSX)
                    </h3>
                    <p className="text-2xs text-zinc-400">
                      Transformación limpia y lista para integrar en cualquier proyecto Vite/Next.js
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(generatedTsxCode, 'tsx-code')}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 text-xs font-medium transition-colors shadow-xs cursor-pointer"
                  >
                    {copiedKey === 'tsx-code' ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>Copiar Código TSX</span>
                  </button>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 font-mono text-xs text-zinc-200 leading-relaxed overflow-x-auto whitespace-pre">
                  {generatedTsxCode}
                </div>
              </div>
            )}
          </div>

          {/* Integrated Save to Database Drawer */}
          <AnimatePresence>
            {isSavingDrawerOpen && (
              <motion.div
                initial={{ opacity: 0, x: 300 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 300 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="absolute inset-y-0 right-0 w-full sm:w-[480px] bg-zinc-950/95 border-l border-zinc-800 backdrop-blur-xl shadow-2xl z-30 flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4 bg-zinc-900/50">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <h3 className="text-sm font-bold text-zinc-100">
                      Guardar en Base de Datos
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsSavingDrawerOpen(false)}
                    className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                  {/* Missing Dependencies Warning Block */}
                  {missingDependencies.length > 0 ? (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 text-xs text-amber-200 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 font-semibold text-amber-300">
                        <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>Advertencia de Dependencias Adicionales</span>
                      </div>
                      <p className="text-zinc-300 text-2xs leading-relaxed">
                        Este componente utiliza clases o atributos asociados a librerías externas que no están instaladas en este proyecto. Para que funcione con fidelidad plena al integrarlo, instala los paquetes requeridos:
                      </p>
                      <div className="flex flex-col gap-2">
                        {missingDependencies.map((dep) => (
                          <div
                            key={dep.id}
                            className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-2.5 flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-semibold text-zinc-100 text-xs block">
                                {dep.name}
                              </span>
                              <span className="text-3xs font-mono text-zinc-400">
                                {dep.packageName}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                copyToClipboard(dep.installCommand, `save-dep-${dep.id}`)
                              }
                              className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-3xs text-zinc-200 hover:text-white hover:border-amber-500/50 transition-colors cursor-pointer"
                              title="Copiar comando npm"
                            >
                              {copiedKey === `save-dep-${dep.id}` ? (
                                <Check className="h-3 w-3 text-emerald-400" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                              <span>Copiar npm</span>
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-3xs text-zinc-400">
                        Puedes guardarlo ahora en la base de datos; la nota de dependencias quedará registrada en el historial del componente.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      <span className="text-2xs">
                        Todas las dependencias detectadas están disponibles en este proyecto.
                      </span>
                    </div>
                  )}

                  {/* Gold Standard UIComponent Switch & Summary */}
                  <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent p-3.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
                        <span className="text-xs font-bold text-zinc-100">
                          Modelo Estándar AccentCard
                        </span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={useGoldStandard}
                          onChange={(e) => setUseGoldStandard(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {useGoldStandard ? (
                      <div className="space-y-1.5 text-2xs text-zinc-300">
                        <p className="text-zinc-400 leading-relaxed">
                          Convierte este HTML en una pieza de alta fidelidad con 3 variantes interactivas y documentación de props:
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-2">
                            <span className="text-indigo-400 font-semibold block">3 Variantes</span>
                            <span className="text-zinc-400 text-3xs">Estándar, Ambient Glow, Compacto</span>
                          </div>
                          <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-2">
                            <span className="text-emerald-400 font-semibold block">Props Tipadas</span>
                            <span className="text-zinc-400 text-3xs">variant, accentColor, title, acción</span>
                          </div>
                        </div>

                        {(semanticSlots.title || semanticSlots.actionLabel) && (
                          <div className="pt-1 border-t border-zinc-800/80 text-3xs flex flex-wrap gap-1.5 text-zinc-400">
                            {semanticSlots.title && (
                              <span className="inline-flex items-center gap-1 rounded bg-zinc-800/90 px-1.5 py-0.5 border border-zinc-700/60 text-zinc-300">
                                🏷️ Título: <strong className="text-zinc-100 truncate max-w-[120px]">{semanticSlots.title}</strong>
                              </span>
                            )}
                            {semanticSlots.actionLabel && (
                              <span className="inline-flex items-center gap-1 rounded bg-zinc-800/90 px-1.5 py-0.5 border border-zinc-700/60 text-zinc-300">
                                🔘 Botón: <strong className="text-zinc-100 truncate max-w-[120px]">{semanticSlots.actionLabel}</strong>
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-2xs text-zinc-400">
                        Guardado básico como componente estático sin variantes ni tabla de props.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Nombre del Componente
                    </label>
                    <input
                      type="text"
                      value={saveName}
                      onChange={(e) => setSaveName(e.target.value)}
                      placeholder="Ej: PricingCard, PrimaryGlowButton..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Categoría en la Biblioteca
                    </label>
                    <select
                      value={saveCategory}
                      onChange={(e) => setSaveCategory(e.target.value as any)}
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 focus:border-indigo-500 focus:outline-none"
                    >
                      <option value="buttons">Botones (buttons)</option>
                      <option value="cards">Tarjetas (cards)</option>
                      <option value="inputs">Formularios & Inputs (inputs)</option>
                      <option value="feedback">Feedback & Alertas (feedback)</option>
                      <option value="navigation">Navegación (navigation)</option>
                      <option value="data">Visualización de Datos (data)</option>
                      <option value="custom">General / Custom (custom)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Subtítulo o Tagline
                    </label>
                    <input
                      type="text"
                      value={saveTagline}
                      onChange={(e) => setSaveTagline(e.target.value)}
                      placeholder="Breve frase de descripción..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Descripción extendida
                    </label>
                    <textarea
                      value={saveDescription}
                      onChange={(e) => setSaveDescription(e.target.value)}
                      rows={3}
                      placeholder="Detalles sobre variantes, efectos y compatibilidad..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                      Etiquetas (Tags)
                    </label>
                    <input
                      type="text"
                      value={saveTags}
                      onChange={(e) => setSaveTags(e.target.value)}
                      placeholder="separadas por coma..."
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900/90 px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="border-t border-zinc-800/80 p-4 bg-zinc-900/60 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSavingDrawerOpen(false)}
                    className="rounded-xl border border-zinc-800 px-4 py-2 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmSaveToDatabase}
                    className={`inline-flex items-center gap-2 rounded-xl text-white font-semibold px-5 py-2 text-xs shadow-md transition-all hover:scale-102 active:scale-98 cursor-pointer ${
                      missingDependencies.length > 0
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                        : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/25'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    <span>Confirmar y Guardar en BD</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
