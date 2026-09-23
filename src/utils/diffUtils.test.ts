import { describe, expect, it } from 'vitest';
import { computeLineDiff, computePropDiff, computeTokenDiff } from './diffUtils';
import { PropDoc } from '../types';

describe('computeLineDiff', () => {
  it('reports 100% similarity for identical text', () => {
    const r = computeLineDiff('a\nb\nc', 'a\nb\nc');
    expect(r.stats).toMatchObject({ addedCount: 0, removedCount: 0, sameCount: 3, similarityPercent: 100 });
  });

  it('counts added and removed lines', () => {
    const r = computeLineDiff('a\nb\nc', 'a\nx\nc\nd');
    expect(r.stats.removedCount).toBe(1); // b
    expect(r.stats.addedCount).toBe(2); // x, d
    expect(r.stats.sameCount).toBe(2); // a, c
    expect(r.unified.filter((l) => l.type === 'removed').map((l) => l.text)).toEqual(['b']);
  });

  it('keeps side-by-side rows aligned', () => {
    const r = computeLineDiff('a\nb', 'a\nb\nc');
    expect(r.sideBySide.length).toBe(3);
    expect(r.sideBySide[2].right).toMatchObject({ text: 'c', type: 'added' });
  });

  it('handles empty inputs', () => {
    const r = computeLineDiff('', 'a');
    expect(r.stats.addedCount).toBe(1);
    expect(r.stats.totalLinesA).toBe(0);
  });
});

describe('computePropDiff', () => {
  const p = (name: string, type = 'string', defaultValue = ''): PropDoc => ({
    name,
    type,
    defaultValue,
    description: '',
  });

  it('classifies identical, different, only-A and only-B props', () => {
    const r = computePropDiff(
      [p('title'), p('variant', "'a' | 'b'"), p('onlyA')],
      [p('title'), p('variant', "'a' | 'c'"), p('onlyB')],
    );
    const status = Object.fromEntries(r.items.map((i) => [i.name, i.status]));
    expect(status).toEqual({ title: 'identical', variant: 'different', onlyA: 'only_a', onlyB: 'only_b' });
    expect(r.stats).toMatchObject({ total: 4, identical: 1, different: 1, onlyA: 1, onlyB: 1 });
  });
});

describe('computeTokenDiff', () => {
  it('splits shared and exclusive tokens', () => {
    expect(computeTokenDiff(['a', 'b'], ['b', 'c'])).toEqual({
      shared: ['b'],
      onlyA: ['a'],
      onlyB: ['c'],
      allTokensCount: 3,
    });
  });
});
