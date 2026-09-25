// src/utils/backupReminder.ts
// Recordatorio de copia de seguridad: las piezas propias viven solo en el IndexedDB de este navegador,
// así que si se borran los datos del sitio se pierden. Se recuerda exportar la colección cuando hay
// piezas propias y no se exportó en los últimos 30 días (o nunca), salvo que se haya pospuesto.
//
// El estado se guarda en localStorage: es por navegador, igual que los datos que protege.

const DAY = 24 * 60 * 60 * 1000;
export const BACKUP_MAX_AGE_MS = 30 * DAY;
export const BACKUP_SNOOZE_MS = 7 * DAY;

const LAST_EXPORT_KEY = 'mi_ui_lab_last_export_at';
const SNOOZED_UNTIL_KEY = 'mi_ui_lab_backup_snoozed_until';

export interface BackupState {
  lastExportAt: number | null;
  snoozedUntil: number | null;
}

export function shouldShowBackupReminder(customCount: number, state: BackupState, now = Date.now()): boolean {
  if (customCount <= 0) return false;
  if (state.snoozedUntil !== null && now < state.snoozedUntil) return false;
  return state.lastExportAt === null || now - state.lastExportAt > BACKUP_MAX_AGE_MS;
}

function readNumber(key: string): number | null {
  try {
    const raw = localStorage.getItem(key);
    const n = raw === null ? NaN : Number(raw);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

function writeNumber(key: string, value: number) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Sin almacenamiento (modo privado estricto): el aviso simplemente volverá a mostrarse
  }
}

export function readBackupState(): BackupState {
  return { lastExportAt: readNumber(LAST_EXPORT_KEY), snoozedUntil: readNumber(SNOOZED_UNTIL_KEY) };
}

/** Se llama al descargar o copiar el JSON de la colección. */
export function markExported(now = Date.now()) {
  writeNumber(LAST_EXPORT_KEY, now);
}

export function snoozeBackupReminder(now = Date.now()) {
  writeNumber(SNOOZED_UNTIL_KEY, now + BACKUP_SNOOZE_MS);
}
