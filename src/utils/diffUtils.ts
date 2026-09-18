import { PropDoc, UIComponent } from '../types';

export interface DiffLine {
  text: string;
  type: 'same' | 'added' | 'removed' | 'empty';
  lineNum?: number;
}

export interface SideBySideLinePair {
  left: DiffLine;
  right: DiffLine;
}

export interface UnifiedDiffLine {
  type: 'same' | 'added' | 'removed';
  text: string;
  lineNumA?: number;
  lineNumB?: number;
}

export interface LineDiffResult {
  sideBySide: SideBySideLinePair[];
  unified: UnifiedDiffLine[];
  stats: {
    addedCount: number;
    removedCount: number;
    sameCount: number;
    totalLinesA: number;
    totalLinesB: number;
    similarityPercent: number;
  };
}

/**
 * Standard Longest Common Subsequence (LCS) line-by-line diff algorithm
 */
export function computeLineDiff(textA: string, textB: string): LineDiffResult {
  const linesA = textA ? textA.split('\n') : [];
  const linesB = textB ? textB.split('\n') : [];

  const m = linesA.length;
  const n = linesB.length;

  // LCS dynamic programming table
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) {
      if (linesA[i] === linesB[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  // Backtrack to build edit sequence
  let i = m;
  let j = n;
  const rawEdits: Array<{ type: 'same' | 'added' | 'removed'; lineA?: string; lineB?: string; idxA?: number; idxB?: number }> = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && linesA[i - 1] === linesB[j - 1]) {
      rawEdits.unshift({
        type: 'same',
        lineA: linesA[i - 1],
        lineB: linesB[j - 1],
        idxA: i,
        idxB: j,
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawEdits.unshift({
        type: 'added',
        lineB: linesB[j - 1],
        idxB: j,
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawEdits.unshift({
        type: 'removed',
        lineA: linesA[i - 1],
        idxA: i,
      });
      i--;
    }
  }

  // Build unified diff
  const unified: UnifiedDiffLine[] = rawEdits.map((edit) => {
    if (edit.type === 'same') {
      return {
        type: 'same',
        text: edit.lineA!,
        lineNumA: edit.idxA,
        lineNumB: edit.idxB,
      };
    }
    if (edit.type === 'added') {
      return {
        type: 'added',
        text: edit.lineB!,
        lineNumB: edit.idxB,
      };
    }
    return {
      type: 'removed',
      text: edit.lineA!,
      lineNumA: edit.idxA,
    };
  });

  // Build side-by-side aligned lines
  const sideBySide: SideBySideLinePair[] = [];
  let k = 0;
  while (k < rawEdits.length) {
    const edit = rawEdits[k];
    if (edit.type === 'same') {
      sideBySide.push({
        left: { text: edit.lineA!, type: 'same', lineNum: edit.idxA },
        right: { text: edit.lineB!, type: 'same', lineNum: edit.idxB },
      });
      k++;
    } else {
      // Gather contiguous removed and added
      const removedGroup: typeof rawEdits = [];
      const addedGroup: typeof rawEdits = [];

      while (k < rawEdits.length && rawEdits[k].type !== 'same') {
        if (rawEdits[k].type === 'removed') {
          removedGroup.push(rawEdits[k]);
        } else {
          addedGroup.push(rawEdits[k]);
        }
        k++;
      }

      const maxLen = Math.max(removedGroup.length, addedGroup.length);
      for (let r = 0; r < maxLen; r++) {
        const rem = removedGroup[r];
        const add = addedGroup[r];

        sideBySide.push({
          left: rem
            ? { text: rem.lineA!, type: 'removed', lineNum: rem.idxA }
            : { text: '', type: 'empty' },
          right: add
            ? { text: add.lineB!, type: 'added', lineNum: add.idxB }
            : { text: '', type: 'empty' },
        });
      }
    }
  }

  let addedCount = 0;
  let removedCount = 0;
  let sameCount = 0;

  for (const edit of rawEdits) {
    if (edit.type === 'added') addedCount++;
    else if (edit.type === 'removed') removedCount++;
    else sameCount++;
  }

  const total = linesA.length + linesB.length;
  const similarityPercent =
    total > 0 ? Math.round(((2 * sameCount) / total) * 100) : 100;

  return {
    sideBySide,
    unified,
    stats: {
      addedCount,
      removedCount,
      sameCount,
      totalLinesA: linesA.length,
      totalLinesB: linesB.length,
      similarityPercent,
    },
  };
}

export type PropDiffStatus = 'identical' | 'different' | 'only_a' | 'only_b';

export interface PropDiffItem {
  name: string;
  status: PropDiffStatus;
  propA?: PropDoc;
  propB?: PropDoc;
  renderedValueA?: any;
  renderedValueB?: any;
  differences: string[];
}

export interface PropDiffResult {
  items: PropDiffItem[];
  stats: {
    total: number;
    identical: number;
    different: number;
    onlyA: number;
    onlyB: number;
  };
}

/**
 * Compares two components' props and active rendered values
 */
export function computePropDiff(
  propsA: PropDoc[] = [],
  propsB: PropDoc[] = [],
  renderedPropsA: Record<string, any> = {},
  renderedPropsB: Record<string, any> = {},
): PropDiffResult {
  const mapA = new Map<string, PropDoc>();
  propsA.forEach((p) => mapA.set(p.name, p));

  const mapB = new Map<string, PropDoc>();
  propsB.forEach((p) => mapB.set(p.name, p));

  const allNames = Array.from(
    new Set([
      ...propsA.map((p) => p.name),
      ...propsB.map((p) => p.name),
      ...Object.keys(renderedPropsA),
      ...Object.keys(renderedPropsB),
    ]),
  ).sort();

  const items: PropDiffItem[] = [];

  let identical = 0;
  let different = 0;
  let onlyA = 0;
  let onlyB = 0;

  for (const name of allNames) {
    const pA = mapA.get(name);
    const pB = mapB.get(name);
    const valA = renderedPropsA[name] !== undefined ? renderedPropsA[name] : pA?.defaultValue;
    const valB = renderedPropsB[name] !== undefined ? renderedPropsB[name] : pB?.defaultValue;

    const differences: string[] = [];

    if (pA && !pB) {
      onlyA++;
      items.push({
        name,
        status: 'only_a',
        propA: pA,
        renderedValueA: valA,
        differences: ['Solo presente en el Componente A'],
      });
    } else if (!pA && pB) {
      onlyB++;
      items.push({
        name,
        status: 'only_b',
        propB: pB,
        renderedValueB: valB,
        differences: ['Solo presente en el Componente B'],
      });
    } else if (pA && pB) {
      if (pA.type !== pB.type) {
        differences.push(`Tipo diferente: "${pA.type}" vs "${pB.type}"`);
      }
      if (pA.defaultValue !== pB.defaultValue) {
        differences.push(
          `Valor por defecto: "${pA.defaultValue}" vs "${pB.defaultValue}"`,
        );
      }
      if (Boolean(pA.required) !== Boolean(pB.required)) {
        differences.push(
          pA.required
            ? 'Requerido en A pero opcional en B'
            : 'Opcional en A pero requerido en B',
        );
      }
      if (
        valA !== undefined &&
        valB !== undefined &&
        JSON.stringify(valA) !== JSON.stringify(valB)
      ) {
        differences.push(
          `Valor renderizado activo: "${String(valA)}" vs "${String(valB)}"`,
        );
      }

      if (differences.length > 0) {
        different++;
        items.push({
          name,
          status: 'different',
          propA: pA,
          propB: pB,
          renderedValueA: valA,
          renderedValueB: valB,
          differences,
        });
      } else {
        identical++;
        items.push({
          name,
          status: 'identical',
          propA: pA,
          propB: pB,
          renderedValueA: valA,
          renderedValueB: valB,
          differences: [],
        });
      }
    } else {
      // Present in active renderedProps without formal documentation
      if (valA !== undefined && valB === undefined) {
        onlyA++;
        items.push({
          name,
          status: 'only_a',
          renderedValueA: valA,
          differences: ['Propiedad en runtime solo en A'],
        });
      } else if (valA === undefined && valB !== undefined) {
        onlyB++;
        items.push({
          name,
          status: 'only_b',
          renderedValueB: valB,
          differences: ['Propiedad en runtime solo en B'],
        });
      } else {
        different++;
        items.push({
          name,
          status: 'different',
          renderedValueA: valA,
          renderedValueB: valB,
          differences: [`Valores runtime: "${String(valA)}" vs "${String(valB)}"`],
        });
      }
    }
  }

  return {
    items,
    stats: {
      total: items.length,
      identical,
      different,
      onlyA,
      onlyB,
    },
  };
}

/**
 * Compares design tokens used between two components
 */
export function computeTokenDiff(tokensA: string[] = [], tokensB: string[] = []) {
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const shared = tokensA.filter((t) => setB.has(t));
  const onlyA = tokensA.filter((t) => !setB.has(t));
  const onlyB = tokensB.filter((t) => !setA.has(t));

  return {
    shared,
    onlyA,
    onlyB,
    allTokensCount: new Set([...tokensA, ...tokensB]).size,
  };
}
