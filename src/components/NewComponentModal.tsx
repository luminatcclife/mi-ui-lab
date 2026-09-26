import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
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
 * no como modal. A diferencia de "Capturar HTML", lo que se guarda aquí es
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
      onToast('⚠ Indica un nombre para el componente.');
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
    <div className="w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Nombre del Componente *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. AccentCard, HeroGrid, MetricPill"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Versión Inicial *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 font-mono text-base text-zinc-600 dark:text-zinc-300">v</span>
              <input
                type="text"
                required
                placeholder="1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 pl-7 pr-2.5 py-2 font-mono text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Exclude<ComponentCategory, 'all' | 'favorites'>)}
              className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 text-base text-zinc-900 dark:text-zinc-50"
            >
              <option value="cards">Tarjetas</option>
              <option value="buttons">Botones</option>
              <option value="inputs">Entradas</option>
              <option value="feedback">Feedback</option>
              <option value="navigation">Navegación</option>
              <option value="data">Datos</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Notas de Versión / Changelog Inicial
            </label>
            <input
              type="text"
              placeholder="Ej. Versión inicial con soporte para temas..."
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">Tagline o resumen breve</label>
          <input
            type="text"
            placeholder="Ej. Tarjeta con acento lateral y resplandor suave"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">Descripción completa</label>
          <textarea
            rows={2}
            placeholder="Explica el caso de uso y particularidades de diseño..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">Nombre de la 1ª Variante</label>
            <input
              type="text"
              placeholder="Ej. Glow Ambient"
              value={variantName}
              onChange={(e) => setVariantName(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
          </div>
          <div>
            <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">
              Etiquetas / Tags (separadas por coma)
            </label>
            <input
              type="text"
              placeholder="tarjeta, custom, metric, react"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Tokens Tailwind Utilizados (separados por coma)
          </label>
          <input
            type="text"
            placeholder="rounded-2xl, border-zinc-800, p-6"
            value={tokensUsed}
            onChange={(e) => setTokensUsed(e.target.value)}
            className="w-full min-h-11 rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-2 text-base text-zinc-900 dark:text-zinc-50 placeholder:text-zinc-500 dark:placeholder:text-zinc-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">Snippet de Uso Rápido (JSX)</label>
          <textarea
            rows={2}
            value={usageSnippet}
            onChange={(e) => setUsageSnippet(e.target.value)}
            className="w-full rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-3 font-mono text-sm leading-[22px] text-zinc-900 dark:text-zinc-50"
          />
        </div>

        <div>
          <label className="mb-2 block text-base font-semibold text-zinc-900 dark:text-zinc-50">Código Fuente Completo (.tsx)</label>
          <textarea
            rows={6}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            className="w-full rounded-xl border border-zinc-500 dark:border-zinc-400 bg-white dark:bg-zinc-900 px-3.5 py-3 font-mono text-sm leading-[22px] text-zinc-900 dark:text-zinc-50"
          />
          <p className="mt-2 text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">
            Se guarda como código de referencia (para copiar a tu proyecto), no se renderiza en
            vivo aquí — si quieres ver la pieza funcionando de verdad con estilos reales, usa
            "Capturar HTML" en su lugar.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 pt-5">
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-500 dark:border-zinc-400 px-4 text-base text-zinc-900 dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Limpiar</span>
          </button>
          <button
            type="submit"
            className="min-h-11 rounded-full bg-indigo-600 px-5 text-base font-semibold text-white hover:bg-indigo-700 dark:bg-indigo-400 dark:text-zinc-950 dark:hover:bg-indigo-300 cursor-pointer"
          >
            Guardar en mi biblioteca
          </button>
        </div>
      </form>
    </div>
  );
}
