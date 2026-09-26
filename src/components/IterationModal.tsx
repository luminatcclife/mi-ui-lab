import { MODAL_OVERLAY_CLASS, ModalHeader, modalBtn, modalField, modalLabel, modalPanelClass } from './ModalFrame';
import React, { useState, useEffect } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
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

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim()) {
      onToast('⚠ Indica un número de versión.');
      return;
    }

    if (!notes.trim()) {
      onToast('⚠ Añade una breve nota explicando los cambios de esta iteración.');
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
      className={MODAL_OVERLAY_CLASS}
    >
      <div
        id="iteration-modal-container"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="iteration-modal-title"
        tabIndex={-1}
        className={modalPanelClass('max-w-2xl')}
      >
        <ModalHeader
          caption="Versiones"
          title="Nueva iteración"
          titleId="iteration-modal-title"
          description={<>Registra un cambio de <strong className="font-semibold text-zinc-900 dark:text-zinc-50">{component.name}</strong> y lleva el control de sus versiones.</>}
          onClose={onClose}
        />

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-3">
                <div className="flex items-baseline justify-between gap-3">
                  <span className={modalLabel.replace('mb-2 block ', '')}>Nueva versión</span>
                  <span className="text-sm text-zinc-600 dark:text-zinc-300">
                    Ahora: <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-50">v{currentVersion}</span>
                  </span>
                </div>
                <div role="group" aria-label="Incremento de versión" className="grid grid-cols-3 gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1">
                  {(
                    [
                      [nextVersions.patch, 'Parche'],
                      [nextVersions.minor, 'Menor'],
                      [nextVersions.major, 'Mayor'],
                    ] as const
                  ).map(([v, label]) => {
                    const active = version === v;
                    return (
                      <button
                        key={label}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setVersion(v)}
                        className={`flex flex-col items-center rounded-lg px-2 py-2 transition-colors cursor-pointer ${
                          active
                            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-[var(--app-shadow-card)]'
                            : 'text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-50'
                        }`}
                      >
                        <span className={`text-sm ${active ? 'font-semibold' : ''}`}>{label}</span>
                        <span className="font-mono text-sm">v{v}</span>
                      </button>
                    );
                  })}
                </div>
                <label className="flex items-center gap-3">
                  <span className="shrink-0 text-sm text-zinc-600 dark:text-zinc-300">U otra:</span>
                  <span className="relative flex-1">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-base text-zinc-600 dark:text-zinc-300">v</span>
                    <input
                      type="text"
                      value={version}
                      onChange={(e) => setVersion(e.target.value.replace(/^v/, ''))}
                      placeholder="1.1.0"
                      className={`${modalField} pl-7 font-mono`}
                      required
                    />
                  </span>
                </label>
              </div>

              <div className="flex flex-col gap-2">
                <span className={modalLabel.replace('mb-2 block ', '')}>Tipo de cambio</span>
                <div role="group" aria-label="Tipo de cambio" className="flex flex-wrap gap-2">
                  {([
                    { id: 'feature', label: 'Nueva función o variante' },
                    { id: 'enhancement', label: 'Mejora o refactor' },
                    { id: 'style', label: 'Estilos o temas' },
                    { id: 'fix', label: 'Corrección' },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={changeTag === t.id}
                      onClick={() => setChangeTag(t.id)}
                      className={`min-h-10 rounded-full border px-4 text-sm transition-colors cursor-pointer ${
                        changeTag === t.id
                          ? 'border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900'
                          : 'border-zinc-500 dark:border-zinc-400 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex flex-col">
                <span className={modalLabel}>Qué ha cambiado</span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ejemplo: añadido el modo oscuro, ajustado el relleno y nueva variante «ambient-glow»…"
                  className={modalField}
                  required
                />
              </label>

              <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-base font-semibold">Código TSX</span>
                    <span className="text-sm text-zinc-600 dark:text-zinc-300">¿Esta iteración cambia el código de la pieza?</span>
                  </div>
                  <button
                    type="button"
                    aria-expanded={showCodeEditor}
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className="shrink-0 text-base font-semibold text-indigo-700 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    {showCodeEditor ? 'Ocultar' : 'Editar código'}
                  </button>
                </div>
                {showCodeEditor && (
                  <textarea
                    rows={8}
                    aria-label="Código TSX actualizado"
                    spellCheck={false}
                    value={updatedCode}
                    onChange={(e) => setUpdatedCode(e.target.value)}
                    className="w-full rounded-xl bg-zinc-900 dark:bg-black p-4 font-mono text-[13px] leading-5 text-zinc-50"
                  />
                )}
              </div>

              {component.versionHistory && component.versionHistory.length > 0 && (
                <section className="flex flex-col gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                  <h3 className="font-display text-[22px] leading-7">Versiones anteriores ({component.versionHistory.length})</h3>
                  <ol className="flex max-h-48 flex-col gap-3 overflow-y-auto pr-1">
                    {component.versionHistory.map((item, idx) => (
                      <li key={`${item.version}-${idx}`} className="flex flex-col gap-0.5">
                        <span className="flex items-baseline gap-3">
                          <span className="font-mono text-sm font-semibold">v{item.version}</span>
                          <span className="text-sm text-zinc-600 dark:text-zinc-300">{item.date}</span>
                        </span>
                        <span className="text-sm leading-[21px] text-zinc-700 dark:text-zinc-300">{item.notes}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 sm:px-8">
            <button type="button" onClick={onClose} className={modalBtn.secondary}>
              Cancelar
            </button>
            <button type="submit" className={modalBtn.primary}>
              Guardar v{version}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
