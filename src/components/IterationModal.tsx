import React, { useState, useEffect } from 'react';
import {
  X,
  History,
  GitCommit,
  Sparkles,
  ArrowUpRight,
  Check,
  Tag,
  Clock,
} from 'lucide-react';
import { UIComponent, ComponentIteration } from '../types';

interface IterationModalProps {
  isOpen: boolean;
  onClose: () => void;
  component: UIComponent;
  onSaveIteration: (
    updatedComponent: UIComponent,
    newIteration: ComponentIteration,
  ) => void;
  onToast: (msg: string) => void;
}

// Utility to calculate next semver versions
function getNextVersions(currentVer: string) {
  const clean = currentVer.replace(/^v/, '');
  const parts = clean.split('.').map((p) => parseInt(p, 10));
  const major = isNaN(parts[0]) ? 1 : parts[0];
  const minor = isNaN(parts[1]) ? 0 : parts[1];
  const patch = isNaN(parts[2]) ? 0 : parts[2];

  return {
    patch: `${major}.${minor}.${patch + 1}`,
    minor: `${major}.${minor + 1}.0`,
    major: `${major + 1}.0.0`,
  };
}

export function IterationModal({
  isOpen,
  onClose,
  component,
  onSaveIteration,
  onToast,
}: IterationModalProps) {
  const currentVersion = component.version || '1.0.0';
  const nextVersions = getNextVersions(currentVersion);

  const [version, setVersion] = useState(nextVersions.patch);
  const [notes, setNotes] = useState('');
  const [changeTag, setChangeTag] = useState<'enhancement' | 'fix' | 'style' | 'feature'>('feature');
  const [updatedCode, setUpdatedCode] = useState(component.sourceCode);
  const [showCodeEditor, setShowCodeEditor] = useState(false);

  // Sync state when component changes
  useEffect(() => {
    const next = getNextVersions(component.version || '1.0.0');
    setVersion(next.patch);
    setNotes('');
    setUpdatedCode(component.sourceCode);
    setShowCodeEditor(false);
  }, [component.id, component.version]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim()) {
      alert('Por favor especifica un número de versión.');
      return;
    }

    if (!notes.trim()) {
      alert('Por favor agrega una breve nota explicando los cambios de esta iteración.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];

    const newIteration: ComponentIteration = {
      version: version.trim().replace(/^v/, ''),
      date: todayStr,
      notes: notes.trim(),
      changes: [
        changeTag === 'feature'
          ? 'Nueva funcionalidad / variante'
          : changeTag === 'enhancement'
          ? 'Mejora en tokens y rendimiento'
          : changeTag === 'style'
          ? 'Ajuste de estilos y temas'
          : 'Corrección de error / bugfix',
      ],
    };

    const existingHistory = component.versionHistory || [];
    const updatedHistory = [newIteration, ...existingHistory];

    const updatedComp: UIComponent = {
      ...component,
      version: newIteration.version,
      sourceCode: showCodeEditor ? updatedCode : component.sourceCode,
      versionHistory: updatedHistory,
    };

    onSaveIteration(updatedComp, newIteration);
    onToast(`¡Iteración v${newIteration.version} de "${component.name}" registrada!`);
    onClose();
  };

  return (
    <div
      id="iteration-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="iteration-modal-container"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden text-zinc-900 dark:text-zinc-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-zinc-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400">
              <History className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Registrar Nueva Iteración
                </h2>
                <span className="rounded-md border border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.2 font-mono text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                  {component.name}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Lleva un control evolutivo y versionado de tus piezas a lo largo del tiempo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Current vs New Version Selector */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Versión actual:
              </span>
              <span className="font-mono text-xs font-bold text-zinc-800 dark:text-zinc-200 rounded-md bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5">
                v{currentVersion}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Incremento Semántico Rápido
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setVersion(nextVersions.patch)}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    version === nextVersions.patch
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Parche (+0.0.1)
                  </div>
                  <div className="font-mono text-sm mt-0.5">v{nextVersions.patch}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setVersion(nextVersions.minor)}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    version === nextVersions.minor
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Menor (+0.1.0)
                  </div>
                  <div className="font-mono text-sm mt-0.5">v{nextVersions.minor}</div>
                </button>

                <button
                  type="button"
                  onClick={() => setVersion(nextVersions.major)}
                  className={`rounded-xl border p-2.5 text-center transition-all cursor-pointer ${
                    version === nextVersions.major
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-300 font-bold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                  }`}
                >
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    Mayor (+1.0.0)
                  </div>
                  <div className="font-mono text-sm mt-0.5">v{nextVersions.major}</div>
                </button>
              </div>
            </div>

            {/* Custom Version Input */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
              <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                O introduce una versión manual personalizada:
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-mono text-xs text-zinc-400">
                  v
                </span>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value.replace(/^v/, ''))}
                  placeholder="1.1.0"
                  className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-7 pr-3 py-1.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Change Category Tag */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
              Tipo de Cambio Principal
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'feature', label: '✨ Nueva funcionalidad / variante' },
                { id: 'enhancement', label: '⚡ Mejora / refactor' },
                { id: 'style', label: '🎨 Estilos / temas' },
                { id: 'fix', label: '🐛 Corrección de bug' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChangeTag(t.id as any)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    changeTag === t.id
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Changelog Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Notas de la Iteración (Changelog) *
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ejemplo: Añadido soporte para modo oscuro, optimizado padding con escala matemática y nueva variante 'ambient-glow'..."
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Optional Code Update Toggle */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Actualizar Código TSX de la Pieza
                </span>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  ¿Esta iteración incluye cambios en el código fuente del componente?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCodeEditor(!showCodeEditor)}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
              >
                {showCodeEditor ? 'Ocultar editor' : 'Editar código TSX'}
              </button>
            </div>

            {showCodeEditor && (
              <div className="mt-3">
                <textarea
                  rows={8}
                  value={updatedCode}
                  onChange={(e) => setUpdatedCode(e.target.value)}
                  className="w-full rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-950 p-3 font-mono text-xs text-zinc-200 focus:border-indigo-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Existing Version History / Timeline */}
          {component.versionHistory && component.versionHistory.length > 0 && (
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                Historial de Iteraciones Anteriores ({component.versionHistory.length})
              </h3>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {component.versionHistory.map((item, idx) => (
                  <div
                    key={`${item.version}-${idx}`}
                    className="flex items-start gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/40 p-3 text-xs"
                  >
                    <span className="rounded-md bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200 shrink-0">
                      v{item.version}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.date}
                        </span>
                      </div>
                      <p className="mt-1 text-zinc-700 dark:text-zinc-300 text-[11px] leading-relaxed">
                        {item.notes}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors cursor-pointer"
            >
              <GitCommit className="h-3.5 w-3.5" />
              <span>Guardar Iteración v{version}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
