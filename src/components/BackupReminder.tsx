import React, { useState } from 'react';
import { readBackupState, shouldShowBackupReminder, snoozeBackupReminder } from '../utils/backupReminder';

interface BackupReminderProps {
  customCount: number;
  onExport: () => void;
}

/** Aviso en Inicio: tus piezas propias solo están en este navegador; exporta una copia. */
export function BackupReminder({ customCount, onExport }: BackupReminderProps) {
  const [state, setState] = useState(readBackupState);
  if (!shouldShowBackupReminder(customCount, state)) return null;

  const neverExported = state.lastExportAt === null;

  return (
    <div
      id="backup-reminder"
      role="status"
      className="flex flex-col gap-4 rounded-xl bg-amber-100 dark:bg-amber-900 px-6 py-5 text-left text-zinc-900 dark:text-zinc-50 md:flex-row md:items-center md:gap-6"
    >
      <span className="mono-label self-start md:self-center shrink-0 rounded-full bg-amber-400 px-3 py-1 text-xs text-[#2a1f1a]">
        Ojo
      </span>
      <div className="flex-1">
        <p className="text-base font-semibold">
          {customCount === 1 ? 'Tu pieza propia vive' : `Tus ${customCount} piezas propias viven`} solo en este navegador
        </p>
        <p className="mt-0.5 text-sm leading-[21px] text-zinc-700 dark:text-zinc-300">
          Si se borran los datos del sitio, se pierden.{' '}
          {neverExported ? 'Todavía no has exportado ninguna copia.' : 'Tu última copia tiene más de 30 días.'} Exporta
          tu colección a un archivo JSON para tener respaldo.
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={() => {
            snoozeBackupReminder();
            setState(readBackupState());
          }}
          className="min-h-11 rounded-full px-4 text-[15px] text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        >
          Recuérdamelo en 7 días
        </button>
        <button
          type="button"
          id="backup-reminder-export"
          onClick={onExport}
          className="min-h-11 rounded-full bg-zinc-900 dark:bg-zinc-50 px-5 text-[15px] font-semibold text-zinc-50 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 cursor-pointer"
        >
          Exportar ahora
        </button>
      </div>
    </div>
  );
}
