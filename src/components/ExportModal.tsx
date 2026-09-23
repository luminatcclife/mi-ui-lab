import React, { useState, useEffect } from 'react';
import { X, Download, Upload, Copy, Check, RefreshCw, Database, HardDrive, ShieldCheck } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { UIComponent } from '../types';
import { getDBStats } from '../db/db';
import { INITIAL_COMPONENTS } from '../data/initialComponents';
import { validateImportedCollection } from '../utils/validateImport';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  components: UIComponent[];
  onImportComponents: (imported: UIComponent[]) => void;
  onResetToDefaults: () => void;
  onToast: (msg: string) => void;
}

export function ExportModal({
  isOpen,
  onClose,
  components,
  onImportComponents,
  onResetToDefaults,
  onToast,
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

  if (!isOpen) return null;

  const jsonString = JSON.stringify(components, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    onToast('¡Colección JSON copiada al portapapeles!');
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="export-modal-container"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800/80 bg-zinc-900/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                Exportar & Respaldar mi-ui-lab
              </h2>
              <p className="text-xs text-zinc-400">
                Lleva tus componentes y tokens contigo a cualquier repositorio o equipo.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* IndexedDB Dexie.js Live Status Card */}
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/20 p-4 relative overflow-hidden">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 shrink-0">
                  <Database className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">Base de Datos Local (IndexedDB)</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Dexie.js Activo
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Almacenamiento persistente en tu navegador sin límite de 5MB y 100% privado en tu equipo.
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-3 text-[11px] font-mono text-zinc-400 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-zinc-800 shrink-0">
                <span className="flex items-center gap-1">
                  <HardDrive className="h-3 w-3 text-indigo-400" />
                  {dbStats?.customCount || 0} personalizadas
                </span>
                <span className="text-zinc-700">|</span>
                <span>{components.length} en catálogo</span>
              </div>
            </div>
          </div>

          {/* Export section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-200">
                1. Exportar Colección Actual ({components.length} piezas)
              </h3>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  type="button"
                  onClick={handleCopy}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-all duration-200 cursor-pointer ${
                    copied
                      ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 font-semibold ring-1 ring-emerald-500/30'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.6, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0.6 }}
                        className="inline-flex items-center gap-1.5 text-emerald-400"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                        <span>¡Copiado!</span>
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-1.5"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copiar JSON</span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Descargar .json</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <AnimatePresence>
                {copied && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.92 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute top-2 right-2 z-20 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-zinc-900/95 px-2.5 py-1 text-xs text-emerald-300 shadow-xl backdrop-blur-md ring-1 ring-emerald-500/20"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400"
                    >
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </motion.span>
                    <span className="font-semibold text-emerald-300 text-[10px]">
                      ¡JSON copiado!
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <textarea
                readOnly
                rows={5}
                value={jsonString}
                className={`w-full rounded-xl border p-3 font-mono text-[11px] text-zinc-400 focus:outline-none select-all transition-all duration-300 ${
                  copied
                    ? 'border-emerald-500/50 bg-zinc-900 ring-1 ring-emerald-500/30'
                    : 'border-zinc-800 bg-zinc-900/80'
                }`}
              />
            </div>
          </div>

          <div className="h-px bg-zinc-800" />

          {/* Import section */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-200">
              2. Importar o Sincronizar Colección Externa
            </h3>
            <p className="text-zinc-400">
              Pega un JSON exportado previamente para sincronizar tus piezas creadas en otro equipo o proyecto.
            </p>
            <textarea
              rows={4}
              placeholder="Pega aquí el JSON con la colección..."
              value={importJson}
              onChange={(e) => {
                setImportJson(e.target.value);
                setImportErrors([]);
              }}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 p-3 font-mono text-[11px] text-zinc-100 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!importJson.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Cargar e Integrar Piezas</span>
            </button>
            {importErrors.length > 0 && (
              <ul
                id="import-validation-errors"
                className="max-h-32 overflow-y-auto rounded-xl border border-rose-500/30 bg-rose-500/5 p-3 font-mono text-[11px] text-rose-300 space-y-1"
              >
                {importErrors.slice(0, 20).map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
                {importErrors.length > 20 && <li>… y {importErrors.length - 20} más</li>}
              </ul>
            )}
          </div>

          <div className="h-px bg-zinc-800" />

          {/* Reset section */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h4 className="text-xs font-semibold text-zinc-300">
                Restablecer a Componentes de Fábrica
              </h4>
              <p className="text-[11px] text-zinc-500">
                Restaura los componentes predeterminados incluyendo AccentCard y StepProgressCard con todas sus variantes.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    '¿Restablecer la biblioteca a las piezas iniciales de mi-ui-lab?',
                  )
                ) {
                  onResetToDefaults();
                  onClose();
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/20 transition-colors cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Restablecer</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 bg-zinc-950 px-6 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
