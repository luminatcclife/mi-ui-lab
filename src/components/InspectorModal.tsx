import React, { useEffect, useState } from 'react';
import {
  X,
  ScanSearch,
  Wand2,
  AlertTriangle,
  PackageCheck,
  PackageX,
  Trash2,
  RotateCcw,
  FileCode2,
} from 'lucide-react';
import { ComponentCategory, ComponentDraft, DetectedDependency, UIComponent } from '../types';
import { ElementTechSheet, inspectElementOrHTML } from '../utils/elementInspector';
import { StandardizedResult, standardizeToUIComponent } from '../utils/componentStandardizer';
import { detectDependencies } from '../utils/dependencyDetector';
import { deleteDraftFromDB, loadDraftsFromDB, saveDraftToDB } from '../db/db';
import { LiveComponentPreview } from './LiveComponentPreview';

interface InspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: UIComponent) => void;
  onToast: (msg: string) => void;
}

type Category = Exclude<ComponentCategory, 'all' | 'favorites'>;

/**
 * Captura piezas de fuera de mi-ui-lab: pegás el HTML que copiaste de otra
 * web/inspector, se analiza (tokens Tailwind, dependencias detectadas) y se
 * estandariza al mismo contrato que las piezas de la biblioteca — con
 * vista previa en vivo real, usando el mismo sandbox del Playground.
 */
export function InspectorModal({ isOpen, onClose, onSave, onToast }: InspectorModalProps) {
  const [drafts, setDrafts] = useState<ComponentDraft[]>([]);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('cards');
  const [tags, setTags] = useState('');
  const [rawHtml, setRawHtml] = useState('');

  const [techSheet, setTechSheet] = useState<ElementTechSheet | null>(null);
  const [analysis, setAnalysis] = useState<StandardizedResult | null>(null);
  const [detectedDeps, setDetectedDeps] = useState<DetectedDependency[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDraftsFromDB().then(setDrafts);
    }
  }, [isOpen]);

  const resetForm = () => {
    setEditingDraftId(null);
    setName('');
    setCategory('cards');
    setTags('');
    setRawHtml('');
    setTechSheet(null);
    setAnalysis(null);
    setDetectedDeps([]);
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  const handleAnalyze = () => {
    if (!name.trim()) {
      setFormError('Ponele un nombre a la pieza antes de analizarla.');
      return;
    }
    if (!rawHtml.trim()) {
      setFormError('Pegá el HTML de la pieza que querés capturar.');
      return;
    }
    try {
      const sheet = inspectElementOrHTML(rawHtml.trim());
      const result = standardizeToUIComponent({
        name: name.trim(),
        category,
        rawHtml: rawHtml.trim(),
        tokens: sheet.rawClassNames,
        techSheet: sheet,
      });
      setTechSheet(sheet);
      setAnalysis(result);
      setDetectedDeps(detectDependencies(rawHtml));
      setFormError(null);
    } catch (err: any) {
      setTechSheet(null);
      setAnalysis(null);
      setFormError(err?.message || 'No se pudo analizar el HTML pegado.');
    }
  };

  const handleSaveAsComponent = async () => {
    if (!analysis) return;
    const extraTags = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
    const finalComponent: UIComponent = {
      ...analysis.component,
      tags: Array.from(new Set([...analysis.component.tags, ...extraTags])),
    };
    onSave(finalComponent);
    onToast(`¡"${finalComponent.name}" capturada y agregada a tu biblioteca!`);
    if (editingDraftId) {
      await deleteDraftFromDB(editingDraftId);
    }
    resetForm();
    onClose();
  };

  const handleSaveAsDraft = async () => {
    if (!name.trim() || !rawHtml.trim()) {
      setFormError('Necesitás al menos un nombre y el HTML pegado para guardar un borrador.');
      return;
    }
    const draft: ComponentDraft = {
      id: editingDraftId || `draft-${Date.now()}`,
      name: name.trim(),
      category,
      rawHtml: rawHtml.trim(),
      detectedDependencies: detectDependencies(rawHtml),
      tags: tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    };
    await saveDraftToDB(draft);
    setDrafts(await loadDraftsFromDB());
    onToast(`Borrador "${draft.name}" guardado — podés retomarlo cuando quieras.`);
    resetForm();
  };

  const handleResumeDraft = (draft: ComponentDraft) => {
    setEditingDraftId(draft.id);
    setName(draft.name);
    setCategory(draft.category);
    setTags(draft.tags.join(', '));
    setRawHtml(draft.rawHtml);
    setTechSheet(null);
    setAnalysis(null);
    setDetectedDeps(draft.detectedDependencies);
    setFormError(null);
  };

  const handleDiscardDraft = async (id: string) => {
    await deleteDraftFromDB(id);
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    onToast('Borrador descartado.');
    if (editingDraftId === id) resetForm();
  };

  return (
    <div
      id="inspector-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="inspector-modal-container"
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
              <ScanSearch className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                Inspector de Componentes
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pegá el HTML de una pieza que viste en otro lado y estandarizala a tu biblioteca.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Saved drafts */}
          {drafts.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3.5">
              <h3 className="mb-2 flex items-center gap-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                <FileCode2 className="h-3.5 w-3.5 text-zinc-400" />
                Borradores guardados ({drafts.length})
              </h3>
              <div className="space-y-1.5">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
                      editingDraftId === draft.id
                        ? 'border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-800 dark:text-zinc-200">
                        {draft.name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {draft.category} · {new Date(draft.createdAt).toLocaleDateString()}
                        {draft.detectedDependencies.length > 0 &&
                          ` · ${draft.detectedDependencies.length} dependencia(s) detectada(s)`}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleResumeDraft(draft)}
                        title="Retomar este borrador"
                        className="rounded-md p-1.5 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/50 cursor-pointer"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDiscardDraft(draft.id)}
                        title="Descartar borrador"
                        className="rounded-md p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Capture form */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Nombre de la Pieza *
              </label>
              <input
                type="text"
                placeholder="Ej. PricingCard, HeroBanner"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
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
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              Etiquetas adicionales (separadas por coma, opcional)
            </label>
            <input
              type="text"
              placeholder="pricing, marketing, landing"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-zinc-700 dark:text-zinc-300 font-medium mb-1">
              HTML capturado *
            </label>
            <textarea
              rows={5}
              placeholder='Pegá acá el fragmento, ej: <div class="rounded-xl border p-4">...</div>'
              value={rawHtml}
              onChange={(e) => setRawHtml(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">
              Solo captura marcado y clases, nunca lógica ni estado — la pieza estandarizada se
              ejecuta en tu navegador para la vista previa, igual que el resto de tu biblioteca.
            </p>
          </div>

          <button
            type="button"
            onClick={handleAnalyze}
            className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 dark:bg-zinc-100 px-4 py-2 text-xs font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-white transition-colors cursor-pointer"
          >
            <Wand2 className="h-3.5 w-3.5" />
            Analizar y previsualizar
          </button>

          {formError && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300/60 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/30 px-3 py-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {/* Detected dependencies */}
          {detectedDeps.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 p-3.5 space-y-1.5">
              <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">
                Dependencias detectadas
              </h3>
              {detectedDeps.map((dep) => (
                <div
                  key={dep.packageName}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                    dep.installed
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300'
                  }`}
                >
                  {dep.installed ? (
                    <PackageCheck className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <PackageX className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="font-medium">{dep.library}</span>
                  <span className="text-[10px] opacity-80">
                    {dep.installed ? 'ya instalada' : `falta: ${dep.installCommand}`}
                  </span>
                </div>
              ))}
              <p className="pt-1 text-[10px] text-zinc-400">
                Pegar HTML solo captura marcado y clases, nunca la lógica que las hace funcionar —
                una detección no garantiza que la pieza sea 100% funcional tal cual.
              </p>
            </div>
          )}

          {/* Live preview of the standardized result */}
          {analysis && techSheet && (
            <div className="space-y-3">
              <h3 className="font-semibold text-zinc-700 dark:text-zinc-300">
                Vista previa estandarizada
              </h3>
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-5">
                <LiveComponentPreview
                  componentName={analysis.component.name}
                  sourceCode={analysis.generatedTsx}
                />
              </div>
              <p className="text-[11px] text-zinc-500">
                {techSheet.totalClassesCount} clases Tailwind detectadas · {analysis.variants.length}{' '}
                variantes generadas · {analysis.inferredProps.length} props inferidas.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 dark:border-zinc-800/80 px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg bg-zinc-100 dark:bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSaveAsDraft}
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Guardar como borrador
          </button>
          <button
            type="button"
            disabled={!analysis}
            onClick={handleSaveAsComponent}
            className="rounded-lg bg-emerald-600 px-5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
          >
            Guardar en mi biblioteca
          </button>
        </div>
      </div>
    </div>
  );
}
