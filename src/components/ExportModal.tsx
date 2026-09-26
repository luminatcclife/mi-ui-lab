import { MODAL_OVERLAY_CLASS, ModalHeader, modalBtn, modalField, modalPanelClass } from './ModalFrame';
import React, { useState, useEffect } from 'react';
import { useModalA11y } from '../hooks/useModalA11y';
import { Download, Upload, Copy, Check, RefreshCw } from 'lucide-react';
import { UIComponent } from '../types';
import { getDBStats } from '../db/db';
import { INITIAL_COMPONENTS } from '../data/initialComponents';
import { validateImportedCollection } from '../utils/validateImport';
import { markExported } from '../utils/backupReminder';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: UIComponent[];
  onImportComponents: (imported: UIComponent[]) => void;
  onResetToDefaults: () => void;
  onToast: (msg: string) => void;
  /** Se llama tras copiar o descargar la colección (cuenta como copia de seguridad). */
  onExported?: () => void;
}

export function ExportModal({
  isOpen,
  onClose,
  components,
  onImportComponents,
  onResetToDefaults,
  onToast,
  onExported,
}: ExportModalProps) {
  const [importJson, setImportJson] = useState('');
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [dbStats, setDbStats] = useState<{
    isReady: boolean;
    customCount: number;
    favoritesCount: number;
    tagOverridesCount: number;
    databaseName: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      getDBStats().then(setDbStats);
    }
  }, [isOpen, components]);

  const dialogRef = useModalA11y(isOpen, onClose);

  if (!isOpen) return null;

  const jsonString = JSON.stringify(components, null, 2);

  const handleCopy = async () => {
    // Solo cuenta como copia de seguridad si el portapapeles aceptó el texto
    try {
      await navigator.clipboard.writeText(jsonString);
    } catch {
      onToast('⚠ No se pudo copiar al portapapeles: usa "Descargar .json"');
      return;
    }
    setCopied(true);
    onToast('¡Colección JSON copiada al portapapeles!');
    markExported();
    onExported?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi-ui-lab-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onToast('¡Archivo JSON descargado con éxito!');
    markExported();
    onExported?.();
  };

  const handleImport = () => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(importJson);
    } catch (e) {
      setImportErrors(['Error al parsear el JSON. Verifica la sintaxis.']);
      return;
    }

    const builtInIds = new Set(INITIAL_COMPONENTS.map((c) => c.id));
    const { valid, errors } = validateImportedCollection(parsed, builtInIds);
    setImportErrors(errors);

    if (valid.length === 0) {
      if (errors.length === 0) setImportErrors(['No hay piezas propias que importar (solo piezas base).']);
      return;
    }

    onImportComponents(valid);
    onToast(
      errors.length > 0
        ? `Se importaron ${valid.length} piezas · ${errors.length} descartadas`
        : `¡Se importaron ${valid.length} piezas a tu colección!`,
    );
    if (errors.length === 0) {
      setImportJson('');
      onClose();
    }
  };

  return (
    <div
      id="export-modal-overlay"
      className={MODAL_OVERLAY_CLASS}
    >
      <div
        id="export-modal-container"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-modal-title"
        tabIndex={-1}
        className={modalPanelClass('max-w-2xl')}
      >
        <ModalHeader
          caption="Copia de seguridad"
          title="Exportar e importar"
          titleId="export-modal-title"
          description="Lleva tus piezas propias a otro navegador o a otro equipo."
          onClose={onClose}
        />

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-8">
            {/* Estado de la base de datos local */}
            <dl className="grid grid-cols-3 gap-2">
              {[
                [String(components.length), 'piezas en total'],
                [String(dbStats?.customCount ?? 0), 'propias'],
                [String(dbStats?.favoritesCount ?? 0), 'favoritas'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col-reverse gap-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 px-4 py-3">
                  <dt className="text-sm text-zinc-600 dark:text-zinc-300">{label}</dt>
                  <dd className="font-display text-[28px] leading-[34px]">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="-mt-5 text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">
              Se guardan en este navegador (IndexedDB{dbStats?.isReady ? ', activa' : ''}). No salen de aquí salvo que las exportes.
            </p>

            {/* Exportar */}
            <section className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-display text-[22px] leading-7">Exportar la colección</h3>
                <div className="flex gap-2">
                  <button type="button" onClick={handleCopy} className={modalBtn.secondary}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copiado' : 'Copiar JSON'}
                  </button>
                  <button type="button" onClick={handleDownload} className={modalBtn.primary}>
                    <Download className="h-4 w-4" />
                    Descargar .json
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                rows={5}
                aria-label="Colección en JSON"
                value={jsonString}
                className="w-full rounded-xl bg-zinc-900 dark:bg-black p-4 font-mono text-[13px] leading-5 text-zinc-50 select-all"
              />
              <div className="flex gap-3 rounded-xl bg-amber-100 dark:bg-amber-900 px-4 py-3">
                <span className="mono-label mt-0.5 h-fit shrink-0 rounded-full bg-amber-400 px-2.5 py-0.5 text-[11px] text-zinc-900">Ojo</span>
                <p id="export-scope-note" className="text-sm leading-[21px]">
                  La copia restaura tus <strong className="font-semibold">piezas propias</strong>. No incluye tus favoritos, las etiquetas que
                  añadiste a las piezas base ni las iteraciones que registraste sobre ellas: al importarla en otro
                  navegador, las piezas base vuelven a su estado original.
                </p>
              </div>
            </section>

            {/* Importar */}
            <section className="flex flex-col gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-8">
              <h3 className="font-display text-[22px] leading-7">Importar una colección</h3>
              <p className="text-base leading-[26px] text-zinc-600 dark:text-zinc-300">
                Pega un JSON exportado para añadir las piezas que creaste en otro navegador o equipo. Las piezas con el mismo id se
                reemplazan; el resto de tu colección no se toca.
              </p>
              <textarea
                rows={4}
                aria-label="JSON a importar"
                placeholder="Pega aquí el JSON con la colección..."
                value={importJson}
                onChange={(e) => {
                  setImportJson(e.target.value);
                  setImportErrors([]);
                }}
                className={`${modalField} font-mono text-[13px] leading-5`}
              />
              <button type="button" onClick={handleImport} disabled={!importJson.trim()} className={`${modalBtn.ink} self-start`}>
                <Upload className="h-4 w-4" />
                Cargar e integrar piezas
              </button>
              {importErrors.length > 0 && (
                <div className="flex flex-col gap-2 rounded-xl border-2 border-dashed border-indigo-700 dark:border-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-4 py-3">
                  <span className="mono-label text-xs text-indigo-700 dark:text-indigo-400">Revisa</span>
                  <ul id="import-validation-errors" className="max-h-32 space-y-1 overflow-y-auto font-mono text-[13px]">
                    {importErrors.slice(0, 20).map((err, i) => (
                      <li key={i}>· {err}</li>
                    ))}
                    {importErrors.length > 20 && <li>… y {importErrors.length - 20} más</li>}
                  </ul>
                </div>
              )}
            </section>

            {/* Restablecer */}
            <section className="flex flex-col gap-3 border-t border-zinc-200 dark:border-zinc-800 pt-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-1">
                <h3 className="font-display text-[22px] leading-7">Volver al principio</h3>
                <p className="text-sm leading-[21px] text-zinc-600 dark:text-zinc-300">
                  Deja solo las 8 piezas base. Borra tus piezas propias, favoritos, etiquetas e iteraciones.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const customCount = components.filter((c) => c.isCustom).length;
                  const piecesLine =
                    customCount === 0
                      ? 'No tienes piezas propias, pero'
                      : customCount === 1
                      ? 'Se borrará definitivamente tu pieza propia. Además,'
                      : `Se borrarán definitivamente tus ${customCount} piezas propias. Además,`;
                  if (
                    confirm(
                      `¿Restablecer la biblioteca a las piezas iniciales de mi-ui-lab?\n\n` +
                        `${piecesLine} se perderán las iteraciones de las piezas base, tus favoritos y tus etiquetas.\n\n` +
                        'Esta acción no se puede deshacer. Si no has exportado una copia, cancela y descárgala primero.',
                    )
                  ) {
                    onResetToDefaults();
                    onClose();
                  }
                }}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 self-start rounded-full border-2 border-indigo-700 dark:border-indigo-400 px-4 text-base font-semibold text-indigo-700 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 cursor-pointer sm:self-center"
              >
                <RefreshCw className="h-4 w-4" />
                Restablecer
              </button>
            </section>
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-zinc-200 dark:border-zinc-800 px-6 py-4 sm:px-8">
          <button type="button" onClick={onClose} className={modalBtn.secondary}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
