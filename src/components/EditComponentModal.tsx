import React, { useState } from 'react';
import { PenLine, X } from 'lucide-react';
import { ComponentCategory, UIComponent } from '../types';
import { useTheme } from '../context/ThemeContext';
import { SandboxedHtmlPreview } from './ui/SandboxedHtmlPreview';
import {
  applyComponentEdits,
  ComponentEditForm,
  formFromComponent,
  validateComponentEdit,
} from '../utils/componentEdits';

interface EditComponentModalProps {
  component: UIComponent;
  onClose: () => void;
  onSave: (updated: UIComponent) => void;
  onToast: (msg: string) => void;
}

const CATEGORIES: { id: Exclude<ComponentCategory, 'all' | 'favorites'>; label: string }[] = [
  { id: 'cards', label: 'Tarjetas' },
  { id: 'buttons', label: 'Botones' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'navigation', label: 'Navegación' },
  { id: 'data', label: 'Datos' },
  { id: 'custom', label: 'Custom' },
];

const labelClass = 'block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5';
const inputClass =
  'w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-indigo-500 focus:outline-none';
const codeClass = `${inputClass} font-mono text-[11px] leading-relaxed`;

/**
 * Edita metadatos y código de una pieza propia. La versión y el changelog van por "Nueva Iteración",
 * las etiquetas por su propio editor; el id no cambia (favoritos y referencias siguen apuntando bien).
 */
export function EditComponentModal({ component, onClose, onSave, onToast }: EditComponentModalProps) {
  const { isDark } = useTheme();
  const [form, setForm] = useState<ComponentEditForm>(() => formFromComponent(component));
  const [error, setError] = useState<string | null>(null);
  const isCaptured = component.rawHtml !== undefined;

  const set = <K extends keyof ComponentEditForm>(key: K, value: ComponentEditForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const problem = validateComponentEdit(component, form);
    if (problem) {
      setError(problem);
      return;
    }
    const updated = applyComponentEdits(component, form);
    onSave(updated);
    onToast(`Cambios guardados en "${updated.name}"`);
    onClose();
  };

  return (
    <div
      id="edit-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="edit-modal-container"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <PenLine className="h-4 w-4" />
            </div>
            <div>
              <h2 id="edit-modal-title" className="text-base font-bold tracking-tight">
                Editar pieza
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isCaptured ? 'Pieza capturada: el HTML se sanea al guardar.' : 'Pieza documentada a mano.'} La versión se
                cambia con "Nueva Iteración".
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-name" className={labelClass}>
                Nombre
              </label>
              <input id="edit-name" className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div>
              <label htmlFor="edit-category" className={labelClass}>
                Categoría
              </label>
              <select
                id="edit-category"
                className={inputClass}
                value={form.category}
                onChange={(e) => set('category', e.target.value as ComponentEditForm['category'])}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="edit-tagline" className={labelClass}>
              Tagline
            </label>
            <input id="edit-tagline" className={inputClass} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} />
          </div>

          <div>
            <label htmlFor="edit-description" className={labelClass}>
              Descripción
            </label>
            <textarea
              id="edit-description"
              rows={2}
              className={inputClass}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="edit-tokens" className={labelClass}>
              Tokens usados (separados por comas)
            </label>
            <input id="edit-tokens" className={inputClass} value={form.tokensUsed} onChange={(e) => set('tokensUsed', e.target.value)} />
          </div>

          {isCaptured && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-rawhtml" className={labelClass}>
                  HTML (se renderiza en vivo)
                </label>
                <textarea
                  id="edit-rawhtml"
                  rows={10}
                  spellCheck={false}
                  className={codeClass}
                  value={form.rawHtml ?? ''}
                  onChange={(e) => set('rawHtml', e.target.value)}
                />
              </div>
              <div>
                <span className={labelClass}>Vista previa</span>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-2">
                  <SandboxedHtmlPreview
                    html={form.rawHtml ?? ''}
                    theme={isDark ? 'dark' : 'light'}
                    title={`Vista previa de la edición: ${form.name}`}
                    minHeight={120}
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="edit-usage" className={labelClass}>
              Snippet de uso
            </label>
            <textarea
              id="edit-usage"
              rows={2}
              spellCheck={false}
              className={codeClass}
              value={form.usageSnippet}
              onChange={(e) => set('usageSnippet', e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="edit-source" className={labelClass}>
              Código fuente TSX {isCaptured ? '(generado al capturar, de referencia)' : '(de referencia, no se compila)'}
            </label>
            <textarea
              id="edit-source"
              rows={10}
              spellCheck={false}
              className={codeClass}
              value={form.sourceCode}
              onChange={(e) => set('sourceCode', e.target.value)}
            />
          </div>

          {error && (
            <p role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/5 px-3 py-2 text-xs text-rose-600 dark:text-rose-300">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-edit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 cursor-pointer"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
