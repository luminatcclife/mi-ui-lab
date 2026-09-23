import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { INITIAL_COMPONENTS } from './initialComponents';

const FILES: Record<string, string> = {
  'accent-card': 'AccentCard',
  'primary-button': 'Button',
  'status-badge': 'StatusBadge',
  'input-field': 'InputField',
  'segmented-control': 'SegmentedControl',
  'notification-callout': 'NotificationCallout',
  'toggle-switch': 'ToggleSwitch',
  'step-progress-card': 'StepProgressCard',
};

describe('INITIAL_COMPONENTS', () => {
  it('has unique ids', () => {
    const ids = INITIAL_COMPONENTS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(INITIAL_COMPONENTS.map((c) => [c.id, c] as const))(
    '%s shows exactly the code of its component file',
    (id, comp) => {
      const file = resolve(__dirname, '../components/ui', `${FILES[id]}.tsx`);
      const normalize = (s: string) => s.replace(/\r\n/g, '\n');
      expect(normalize(comp.sourceCode)).toBe(normalize(readFileSync(file, 'utf8')));
    },
  );
});
