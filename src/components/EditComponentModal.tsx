import { MODAL_OVERLAY_CLASS, ModalHeader, modalBtn, modalField, modalLabel, modalPanelClass } from './ModalFrame';
import React, { useState } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
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

const labelClass = modalLabel;
const inputClass = modalField;
const codeClass = `${modalField} font-mono text-[13px] leading-5`;

/**
 * Edita metadatos y código de una pieza propia. La versión y el changelog van por "Nueva Iteración",
 * las etiquetas por su propio editor; el id no cambia (favoritos y referencias siguen apuntando bien).
 */
export function EditComponentModal({ component, onClose, onSave, onToast }: EditComponentModalProps) {
  const { isDark } = useTheme();
  const [form, setForm] = useState<ComponentEditForm>(() => formFromComponent(component));
  const [error, setError] = useState<string | null>(null);
  const isCaptured = component.rawHtml !== undefined;
  const dialogRef = useModalA11y(true, onClose);

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
      className={MODAL_OVERLAY_CLASS}
    >
      <div
        id="edit-modal-container"
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-modal-title"
        className={modalPanelClass('max-w-3xl')}
      >
        <ModalHeader
          caption="Editar"
          title="Editar pieza"
          titleId="edit-modal-title"
          description={`${isCaptured ? 'Pieza capturada: el HTML se limpia al guardar.' : 'Pieza documentada a mano.'} La versión se cambia con «Nueva iteración».`}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-5 overflow-y-auto px-6 py-6 sm:px-8">
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
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 p-2">
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
            <p role="alert" className="rounded-xl border-2 border-dashed border-indigo-700 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-4 py-3 text-base">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={modalBtn.secondary}
            >
              Cancelar
            </button>
            <button
              type="submit"
              id="btn-save-edit"
              className={modalBtn.primary}
            >
              Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
