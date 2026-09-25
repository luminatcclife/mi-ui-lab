import { beforeEach, describe, expect, it } from 'vitest';
import {
  BACKUP_MAX_AGE_MS,
  BACKUP_SNOOZE_MS,
  markExported,
  readBackupState,
  shouldShowBackupReminder,
  snoozeBackupReminder,
} from './backupReminder';

const NOW = 1_800_000_000_000;
const never = { lastExportAt: null, snoozedUntil: null };

describe('shouldShowBackupReminder', () => {
  it('stays hidden with no custom pieces (nothing to lose)', () => {
    expect(shouldShowBackupReminder(0, never, NOW)).toBe(false);
  });

  it('shows when there are custom pieces and no export yet', () => {
    expect(shouldShowBackupReminder(2, never, NOW)).toBe(true);
  });

  it('hides for 30 days after an export, then shows again', () => {
    expect(shouldShowBackupReminder(2, { lastExportAt: NOW - BACKUP_MAX_AGE_MS + 1, snoozedUntil: null }, NOW)).toBe(false);
    expect(shouldShowBackupReminder(2, { lastExportAt: NOW - BACKUP_MAX_AGE_MS - 1, snoozedUntil: null }, NOW)).toBe(true);
  });

  it('respects a snooze until it expires', () => {
    expect(shouldShowBackupReminder(2, { lastExportAt: null, snoozedUntil: NOW + 1 }, NOW)).toBe(false);
    expect(shouldShowBackupReminder(2, { lastExportAt: null, snoozedUntil: NOW - 1 }, NOW)).toBe(true);
  });
});

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips export and snooze timestamps', () => {
    expect(readBackupState()).toEqual(never);
    markExported(NOW);
    snoozeBackupReminder(NOW);
    expect(readBackupState()).toEqual({ lastExportAt: NOW, snoozedUntil: NOW + BACKUP_SNOOZE_MS });
  });

  it('ignores corrupt values', () => {
    localStorage.setItem('mi_ui_lab_last_export_at', 'no-es-un-número');
    expect(readBackupState().lastExportAt).toBeNull();
  });
});
