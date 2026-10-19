import React, { useState } from 'react';
import { readBackupState, shouldShowBackupReminder, snoozeBackupReminder } from '../utils/backupReminder';

interface BackupReminderProps {
  customCount: number;
  onExport: () => void;
}

/** Aviso en Inicio: tus piezas propias solo están en este navegador; exporta una copia. Usa los colores de .orbita. */
export function BackupReminder({ customCount, onExport }: BackupReminderProps) {
  const [state, setState] = useState(readBackupState);
  if (!shouldShowBackupReminder(customCount, state)) return null;

  const neverExported = state.lastExportAt === null;

  return (
    <div
      id="backup-reminder"
      role="status"
      className="orb-warn-box flex flex-col gap-4 px-6 py-5 text-left md:flex-row md:items-center md:gap-6"
    >
      <span className="orb-hud self-start md:self-center shrink-0 bg-[var(--orb-warn)] px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[#0b0618]">
        ▲ Ojo
      </span>
      <div className="flex-1">
        <p className="text-base font-semibold">
          {customCount === 1 ? 'Tu pieza propia vive' : `Tus ${customCount} piezas propias viven`} solo en este navegador
        </p>
        <p className="mt-0.5 text-sm leading-[21px] text-[var(--orb-muted)]">
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
          className="min-h-11 px-4 text-[15px] text-[var(--orb-muted)] hover:bg-white/5 cursor-pointer"
        >
          Recuérdamelo en 7 días
        </button>
        <button
          type="button"
          id="backup-reminder-export"
          onClick={onExport}
          className="min-h-11 bg-[var(--orb-warn)] px-5 text-[15px] font-semibold text-[#0b0618] hover:brightness-110 cursor-pointer"
        >
          Exportar ahora
        </button>
      </div>
    </div>
  );
}
