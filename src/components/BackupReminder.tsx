import React, { useState } from 'react';
import { HardDriveDownload } from 'lucide-react';
import { readBackupState, shouldShowBackupReminder, snoozeBackupReminder } from '../utils/backupReminder';

interface BackupReminderProps {
  customCount: number;
  onExport: () => void;
}

/** Aviso en Inicio: tus piezas propias solo están en este navegador; exportá una copia. */
export function BackupReminder({ customCount, onExport }: BackupReminderProps) {
  const [state, setState] = useState(readBackupState);
  if (!shouldShowBackupReminder(customCount, state)) return null;

  const neverExported = state.lastExportAt === null;

  return (
    <div
      id="backup-reminder"
      role="status"
      className="mb-8 flex flex-col gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/5 p-4 text-left sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3 flex-1">
        <HardDriveDownload className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {customCount === 1 ? 'Tu pieza propia vive' : `Tus ${customCount} piezas propias viven`} solo en este navegador
          </p>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Si se borran los datos del sitio, se pierden.{' '}
            {neverExported ? 'Todavía no exportaste ninguna copia.' : 'Tu última copia tiene más de 30 días.'} Exportá
            tu colección a un archivo JSON para tener respaldo.
          </p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            snoozeBackupReminder();
            setState(readBackupState());
          }}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-amber-500/10 cursor-pointer"
        >
          Recordámelo en 7 días
        </button>
        <button
          type="button"
          id="backup-reminder-export"
          onClick={onExport}
          className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 cursor-pointer"
        >
          Exportar ahora
        </button>
      </div>
    </div>
  );
}
