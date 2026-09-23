import React, { useState } from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { ComponentCategory, UIComponent } from '../types';

interface NewComponentModalProps {
  onSave: (component: UIComponent) => void;
  onToast: (msg: string) => void;
}

const DEFAULT_SOURCE_CODE = `import React from 'react';

export function MiNuevaPieza() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-6 shadow-xl text-zinc-900 dark:text-zinc-100">
      <h3 className="text-base font-semibold">Nueva Pieza</h3>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Diseño 100% bajo tu control sin dependencias externas.</p>
    </div>
  );
}`;
const DEFAULT_USAGE_SNIPPET = `<MiNuevaPieza />`;
const DEFAULT_VERSION_NOTES = 'Versión inicial documentada en mi-ui-lab';
const DEFAULT_TOKENS_USED = 'rounded-xl, border-zinc-800, p-6, transition-all';
const DEFAULT_TAGS = 'tarjeta, custom, react, ui';
const DEFAULT_VARIANT_NAME = 'Variante Principal';
const DEFAULT_VARIANT_DESC = 'Estilo estándar de la pieza.';

/**
 * "Documentar a mano": formulario de captura para una pieza nueva escrita
 * como componente React completo. Vive incrustado en LaboratorioScreen,
 * no como modal. A diferencia de "Capturar HTML", lo que se guarda acá es
 * código TSX de referencia (no `rawHtml`), así que no se renderiza en vivo
 * en Biblioteca/Playground — para eso está la otra pestaña del Laboratorio.
 */
export function NewComponentModal({ onSave, onToast }: NewComponentModalProps) {
  const [name, setName] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [versionNotes, setVersionNotes] = useState(DEFAULT_VERSION_NOTES);
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Exclude<ComponentCategory, 'all' | 'favorites'>>('cards');
  const [tokensUsed, setTokensUsed] = useState(DEFAULT_TOKENS_USED);
  const [tags, setTags] = useState(DEFAULT_TAGS);
  const [variantName, setVariantName] = useState(DEFAULT_VARIANT_NAME);
  const [variantDesc, setVariantDesc] = useState(DEFAULT_VARIANT_DESC);
  const [sourceCode, setSourceCode] = useState(DEFAULT_SOURCE_CODE);
  const [usageSnippet, setUsageSnippet] = useState(DEFAULT_USAGE_SNIPPET);

  const resetForm = () => {
    setName('');
    setVersion('1.0.0');
    setVersionNotes(DEFAULT_VERSION_NOTES);
    setTagline('');
    setDescription('');
    setCategory('cards');
    setTokensUsed(DEFAULT_TOKENS_USED);
    setTags(DEFAULT_TAGS);
    setVariantName(DEFAULT_VARIANT_NAME);
    setVariantDesc(DEFAULT_VARIANT_DESC);
    setSourceCode(DEFAULT_SOURCE_CODE);
    setUsageSnippet(DEFAULT_USAGE_SNIPPET);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Por favor indica un nombre para el componente.');
      return;
    }

    const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const cleanVer = version.trim().replace(/^v/, '') || '1.0.0';
    const todayStr = new Date().toISOString().split('T')[0];

    const newComp: UIComponent = {
      id: `custom-${id}-${Date.now()}`,
      name: name.trim(),
      version: cleanVer,
      versionHistory: [
        {
          version: cleanVer,
          date: todayStr,
          notes: versionNotes.trim() || 'Versión inicial documentada en mi-ui-lab',
          changes: ['Creación inicial de la pieza'],
        },
      ],
      tagline: tagline.trim() || 'Componente personalizado de tu laboratorio.',
      description: description.trim() || 'Pieza creada e integrada en tu biblioteca personal mi-ui-lab.',
      category,
      tags: tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      tokensUsed: tokensUsed.split(',').map((t) => t.trim()).filter(Boolean),
      sourceCode: sourceCode.trim(),
      usageSnippet: usageSnippet.trim(),
      variants: [
        {
          id: 'default',
          name: variantName.trim() || 'Estándar',
          description: variantDesc.trim() || 'Variante principal documentada.',
          props: {},
          codeSnippet: usageSnippet.trim(),
        },
      ],
      props: [
        {
          name: 'className',
          type: 'string',
          defaultValue: "''",
          description: 'Clases Tailwind adicionales para sobreescritura.',
        },
      ],
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    onSave(newComp);
    onToast(`¡Pieza "${newComp.name}" (v${cleanVer}) guardada en tu biblioteca!`);
    resetForm();
  };

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Documentar una Pieza a Mano
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Escribí un componente React completo con versionado inicial, variantes y tokens.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Nombre del Componente *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. AccentCard, HeroGrid, MetricPill"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Versión Inicial *
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 font-mono text-xs text-zinc-400">v</span>
              <input
                type="text"
                required
                placeholder="1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 pl-6 pr-2.5 py-2 font-mono text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Exclude<ComponentCategory, 'all' | 'favorites'>)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="cards">Tarjetas & Contenedores</option>
              <option value="buttons">Botones & Acciones</option>
              <option value="inputs">Inputs & Formularios</option>
              <option value="feedback">Feedback & Estados</option>
              <option value="navigation">Navegación</option>
              <option value="data">Métricas & Datos</option>
            </select>
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Notas de Versión / Changelog Inicial
            </label>
            <input
              type="text"
              placeholder="Ej. Versión inicial con soporte para temas..."
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Tagline o resumen breve</label>
          <input
            type="text"
            placeholder="Ej. Tarjeta con acento lateral y resplandor suave"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Descripción completa</label>
          <textarea
            rows={2}
            placeholder="Explica el caso de uso y particularidades de diseño..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Nombre de la 1ª Variante</label>
            <input
              type="text"
              placeholder="Ej. Glow Ambient"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Etiquetas / Tags (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="tarjeta, custom, metric, react"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
            Tokens Tailwind Utilizados (separados por coma)
          </label>
          <input
            type="text"
            placeholder="rounded-2xl, border-zinc-800, p-6"
            value={tokensUsed}
            onChange={(e) => setTokensUsed(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Snippet de Uso Rápido (JSX)</label>
          <textarea
            rows={2}
            value={usageSnippet}
            onChange={(e) => setUsageSnippet(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">Código Fuente Completo (.tsx)</label>
          <textarea
            rows={6}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
            Se guarda como código de referencia (para copiar a tu proyecto), no se renderiza en
            vivo acá — si querés ver la pieza funcionando de verdad con estilos reales, usá
            "Capturar HTML" en su lugar.
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800/80 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Limpiar</span>
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
          >
            Guardar en mi biblioteca
          </button>
        </div>
      </form>
    </div>
  );
}
